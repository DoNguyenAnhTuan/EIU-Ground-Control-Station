import json
import math
import threading
import time
import sys
from typing import Optional, List, Dict, Any

import serial
from serial.tools import list_ports

# Thay vì print() đơn giản, nên dùng logging
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from dataclasses import dataclass

@dataclass
class Waypoint:
    x: float
    y: float
    z: float = 3.5

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Waypoint':
        return cls(
            x=float(data["x"]),
            y=float(data["y"]),
            z=float(data.get("z", 3.5))
        )


def _is_num(x) -> bool:
    """
    Check if value is a valid finite number.

    Args:
        x: Value to check

    Returns:
        bool: True if x is a valid finite number

    Examples:
        >>> _is_num(42)
        True
        >>> _is_num("not a number")
        False
        >>> _is_num(float('inf'))
        False
    """
    try:
        return isinstance(x, (int, float)) and math.isfinite(float(x))
    except Exception:
        return False


def _clean_json_str(s: str) -> str:
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end != -1 and end > start:
        return s[start:end + 1]
    return ""


def _platform_default_ports():
    """Gợi ý vài cổng mặc định theo OS để thử lần lượt."""
    if sys.platform.startswith("win"):
        # Thử vài COM phổ biến
        return [f"COM{i}" for i in range(1, 21)]
    # Linux / WSL / Mac
    return ["/dev/ttyUSB0", "/dev/ttyUSB1", "/dev/ttyACM0", "/dev/ttyACM1"]


def _first_available_port(candidates=None) -> Optional[str]:
    """Trả về COM/cổng serial đầu tiên trùng trong danh sách available."""
    ports = [p.device for p in list_ports.comports()]
    cand = candidates or _platform_default_ports()
    for c in cand:
        if c in ports:
            return c
    # nếu không trùng, cứ trả về cổng đầu tiên phát hiện
    return ports[0] if ports else None


class GroundController:
    DEFAULT_BAUDRATE = 9600
    DEFAULT_TIMEOUT = 0.2
    DEFAULT_WRITE_TIMEOUT = 0.5
    HEARTBEAT_TIMEOUT = 6.0
    HEARTBEAT_GRACE = 2
    HEARTBEAT_INTERVAL = 0.5

    def __init__(self, port: Optional[str] = None, baudrate: int = DEFAULT_BAUDRATE, gui_bridge=None):
        """
        port=None  -> tự động dò cổng khả dụng
        """
        self.port = port or _first_available_port()
        self.baudrate = baudrate
        self.ser: Optional[serial.Serial] = None
        self.waypoints = []
        self.received_thread: Optional[threading.Thread] = None
        self.received = False
        self.gui_bridge = gui_bridge

        # Heartbeat
        self._last_hb = 0.0
        self._link_ok = False
        self._hb_timeout = self.HEARTBEAT_TIMEOUT
        self._hb_thread: Optional[threading.Thread] = None

        # Khoá ghi
        self._tx_lock = threading.Lock()

    # ================= Serial helpers =================
    def _print_available_ports(self):
        ports = list_ports.comports()
        if not ports:
            print(" Không phát hiện cổng serial nào.")
            return
        print("Các cổng đang có:")
        for p in ports:
            print(f" - {p.device}: {p.description}")

    def connect(self):
        if self.ser and getattr(self.ser, "is_open", False):
            return

        # tự dò nếu chưa có
        if not self.port:
            self.port = _first_available_port()
        try:
            if not self.port:
                raise RuntimeError("Không tìm thấy cổng serial khả dụng.")

            self.ser = serial.Serial(
                self.port,
                self.baudrate,
                timeout=self.DEFAULT_TIMEOUT,
                write_timeout=self.DEFAULT_WRITE_TIMEOUT
            )
            # clear buffer
            try:
                self.ser.reset_input_buffer()
                self.ser.reset_output_buffer()
            except Exception:
                pass

            time.sleep(0.2)
            logger.info(f"Đã kết nối LoRa tại {self.port} @ {self.baudrate}")
        except Exception as e:
            logger.error(f"Không thể kết nối: {e}")
            self._print_available_ports()
            self.ser = None

    def _safe_close(self):
        try:
            if self.ser and self.ser.is_open:
                self.ser.close()
        except Exception:
            pass
        self.ser = None

    def write_line(self, line: str):
        """Ghi 1 dòng kèm newline, thread-safe."""
        if not (self.ser and self.ser.is_open):
            print("Serial chưa mở khi ghi.")
            return
        with self._tx_lock:
            try:
                self.ser.write((line.rstrip("\n") + "\n").encode("utf-8"))
                self.ser.flush()
            except Exception as e:
                print(f"Lỗi ghi serial: {e}")

    def write_json(self, obj: dict):
        try:
            self.write_line(json.dumps(obj, ensure_ascii=False))
        except Exception as e:
            print(f"Lỗi serialize JSON: {e}")

    # ================= Public API =================
    def start(self):
        self.connect()
        if self.ser and self.ser.is_open:
            print("[INFO] Gửi lệnh ON tới LoRa")
            self.write_line("ON")
        else:
            print("[ERROR] Serial không mở.")

    def stop(self):
        # tắt nhận & reset hb
        self.received = False
        self._last_hb = 0.0
        if self._link_ok:
            self._link_ok = False
            self._emit_link(False)

        # chờ thread đọc dừng
        if self.received_thread and self.received_thread.is_alive():
            try:
                self.received_thread.join(timeout=0.8)
            except Exception:
                pass

        # dừng watchdog
        if self._hb_thread and self._hb_thread.is_alive():
            try:
                # watchdog sẽ tự dừng vì self.received=False
                self._hb_thread.join(timeout=0.8)
            except Exception:
                pass

        if self.ser and self.ser.is_open:
            print("[INFO] Gửi lệnh OFF tới LoRa")
            self.write_line("OFF")
        self._safe_close()
        print("[INFO] Đã đóng serial")

    def set_gui_bridge(self, bridge):
        self.gui_bridge = bridge

    # ================= Link helper =================
    def _emit_link(self, ok: bool):
        if self.gui_bridge and hasattr(self.gui_bridge, "update_link"):
            try:
                self.gui_bridge.update_link(bool(ok))
            except Exception as e:
                print(f"GUI bridge error (update_link): {e}")

    def _hb_watch(self, interval=0.5, grace=2):
        """Watchdog: nếu không thấy hb quá self._hb_timeout trong 'grace' lần => mất link."""
        missed = 0
        while self.received:
            dt = time.monotonic() - self._last_hb
            if dt > self._hb_timeout:
                missed += 1
                if self._link_ok and missed >= grace:
                    self._link_ok = False
                    self._emit_link(False)
            else:
                missed = 0
                if not self._link_ok and self._last_hb > 0:
                    self._link_ok = True
                    self._emit_link(True)
            time.sleep(interval)

    # ================= RX loop =================
    def read_position_from_drone(self):
        if not (self.ser and self.ser.is_open):
            print("Chưa kết nối serial.")
            return

        self.received = True

        # Khởi động watchdog duy nhất
        if not self._hb_thread or not self._hb_thread.is_alive():
            self._hb_thread = threading.Thread(target=self._hb_watch, daemon=True)
            self._hb_thread.start()

        def _read_loop():
            print("Bắt đầu nhận vị trí từ drone...")
            buffer = ""
            while self.received:
                try:
                    # nếu có sẵn bytes thì đọc nhanh, giảm delay
                    if self.ser.in_waiting:
                        chunk = self.ser.read(self.ser.in_waiting)
                    else:
                        chunk = self.ser.read(256)

                    if not chunk:
                        continue

                    buffer += chunk.decode('utf-8', errors='replace')

                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.strip()
                        if not line:
                            continue

                        clean_line = _clean_json_str(line)
                        if not clean_line:
                            # không phải JSON hợp lệ -> bỏ qua
                            continue

                        # print(f"[RAW] {clean_line}")
                        try:
                            data = json.loads(clean_line)
                        except json.JSONDecodeError:
                            # print(f"Không decode được JSON: {clean_line}")
                            continue

                        # ---- Heartbeat ----
                        try:
                            if int(data.get("hb", 0)) == 1:
                                self._last_hb = time.monotonic()
                                if not self._link_ok:
                                    self._link_ok = True
                                    self._emit_link(True)
                        except Exception:
                            pass

                        # ---- Local pose ----
                        if all(k in data for k in ("x", "y", "z")) and _is_num(data["x"]) and _is_num(data["y"]) and _is_num(data["z"]):
                            x, y, z = float(data["x"]), float(data["y"]), float(data["z"])
                            # print(f"Local position: x={x}, y={y}, z={z}")
                            if self.gui_bridge and hasattr(self.gui_bridge, "update_position"):
                                try:
                                    self.gui_bridge.update_position(x, y, z)
                                except Exception as e:
                                    print(f"GUI bridge error (pos): {e}")

                        # ---- GPS ----
                        if all(k in data for k in ("lat", "lon", "alt")) and _is_num(data["lat"]) and _is_num(data["lon"]) and _is_num(data["alt"]):
                            lat, lon, alt = float(data["lat"]), float(data["lon"]), float(data["alt"])
                            # print(f"Global position: lat={lat}, lon={lon}, alt={alt}")
                            if self.gui_bridge and hasattr(self.gui_bridge, "update_global_position"):
                                try:
                                    self.gui_bridge.update_global_position(lat, lon, alt)
                                except Exception as e:
                                    print(f"GUI bridge error (gps): {e}")

                        # ---- Battery ----
                        try:
                            percent = None
                            voltage = None
                            if "battery" in data and isinstance(data["battery"], dict):
                                b = data["battery"]
                                if "percent" in b and _is_num(b["percent"]):
                                    pv = float(b["percent"])
                                    percent = pv * 100.0 if pv <= 1.0 else pv
                                if "voltage" in b and _is_num(b["voltage"]):
                                    voltage = float(b["voltage"])
                            if percent is None and "percent" in data and _is_num(data["percent"]):
                                pv = float(data["percent"])
                                percent = pv * 100.0 if pv <= 1.0 else pv
                            if percent is None and "battery" in data and _is_num(data["battery"]):
                                pv = float(data["battery"])
                                percent = pv * 100.0 if pv <= 1.0 else pv
                            if voltage is None and "voltage" in data and _is_num(data["voltage"]):
                                voltage = float(data["voltage"])
                            if voltage is None and "volt" in data and _is_num(data["volt"]):
                                voltage = float(data["volt"])

                            if self.gui_bridge and (percent is not None or voltage is not None) and hasattr(self.gui_bridge, "update_battery"):
                                try:
                                    p = float(percent) if percent is not None else -1.0
                                    v = float(voltage) if voltage is not None else float("nan")
                                    self.gui_bridge.update_battery(p, v)
                                except Exception as e:
                                    print(f"GUI bridge error (battery): {e}")
                        except Exception as e:
                            print(f"Battery parse error: {e}")

                        # ---- Speed ----
                        try:
                            spd = None
                            if "speed" in data and _is_num(data["speed"]):
                                spd = float(data["speed"])
                            elif "vel" in data and _is_num(data["vel"]):
                                spd = float(data["vel"])
                            if spd is not None and self.gui_bridge and hasattr(self.gui_bridge, "update_speed"):
                                self.gui_bridge.update_speed(spd)
                        except Exception as e:
                            print(f"GUI bridge error (speed): {e}")

                except Exception as e:
                    print(f"Lỗi đọc serial: {e}")
                    time.sleep(0.2)

        self.received_thread = threading.Thread(target=_read_loop, daemon=True)
        self.received_thread.start()

    # ================= Waypoints & Commands =================
    def update_waypoints(self, new_waypoints: List[Dict[str, Any]]) -> None:
        self.waypoints = []
        for i, wp_data in enumerate(new_waypoints):
            try:
                wp = Waypoint.from_dict(wp_data)
                self.waypoints.append(wp)
            except (KeyError, ValueError) as e:
                logger.error(f"Lỗi xử lý waypoint {i + 1}: {e}")
        print(f"Cập nhật {len(self.waypoints)} waypoint.")

    def remove_waypoint_by_index(self, index: int):
        if not self.waypoints:
            print("Danh sách waypoint rỗng.")
            return
        if index < 1 or index > len(self.waypoints):
            print(f"Không có waypoint với index = {index}")
            return
        del self.waypoints[index - 1]
        print("Đã xoá.")

    def send_waypoints_to_drone(self):
        if not (self.ser and self.ser.is_open):
            print("Chưa kết nối serial.")
            return
        if not self.waypoints:
            print("Không có waypoint để gửi.")
            return
        try:
            self.write_json({"waypoints": self.waypoints})
            print(f"Đã gửi {len(self.waypoints)} waypoint tới drone")
        except Exception as e:
            print(f"Lỗi gửi waypoint: {e}")

    def land_req(self):
        if self.ser and self.ser.is_open:
            try:
                self.write_json({"cmd": "land"})
                print("[INFO] Gửi LAND")
            except Exception as e:
                print(f"Lỗi gửi LAND: {e}")
        else:
            print("Serial chưa mở.")

    def offboard_req(self):
        if self.ser and self.ser.is_open:
            try:
                self.write_json({"cmd": "offboard"})
                print("[INFO] Gửi OFFBOARD")
            except Exception as e:
                print(f"Lỗi gửi OFFBOARD: {e}")
        else:
            print("Serial chưa mở.")


def main():
    # Cho Windows: để None để tự tìm COM; hoặc set thẳng 'COM5'
    controller = GroundController(port=None, baudrate=9600)
    controller.start()
    controller.read_position_from_drone()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Dừng bằng Ctrl+C")
    finally:
        controller.stop()


if __name__ == '__main__':
    main()

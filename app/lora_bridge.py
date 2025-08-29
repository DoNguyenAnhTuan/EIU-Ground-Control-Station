from PyQt6.QtCore import QObject, pyqtSignal, pyqtSlot
import threading
import os
class LoraBridge(QObject):
    positionUpdated = pyqtSignal(float, float, float)
    positionUpdatedLocal = pyqtSignal(float, float, float)
    positionUpdatedGPS = pyqtSignal(float, float, float)
    batteryUpdated = pyqtSignal(float, float)
    speedUpdated = pyqtSignal(float)
    linkUpdated = pyqtSignal(bool) 

    def __init__(self):
        super().__init__()
        self.controller = None
        self._rx_thread = None

    def set_controller(self, controller):
        self.controller = controller
        if hasattr(self.controller, "set_gui_bridge"):
            self.controller.set_gui_bridge(self)

    @pyqtSlot(float, float, float)
    def update_position(self, x, y, z):
        print(f"[Bridge] Sending LOCAL to JS (legacy): x={x}, y={y}, z={z}")
        self.positionUpdated.emit(x, y, z)
        self.positionUpdatedLocal.emit(x, y, z)

    @pyqtSlot(float, float, float)
    def update_local_position(self, x, y, z):
        print(f"[Bridge] Sending LOCAL to JS: x={x}, y={y}, z={z}")
        self.positionUpdatedLocal.emit(x, y, z)
        self.positionUpdated.emit(x, y, z)

    @pyqtSlot(float, float, float)
    def update_global_position(self, lat, lon, alt):
        print(f"[Bridge] Sending GPS to JS: lat={lat}, lon={lon}, alt={alt}")
        self.positionUpdatedGPS.emit(lat, lon, alt)

    @pyqtSlot()
    def startConnection(self):
        if not self.controller:
            print("No controller attached.")
            return
        print("GUI yêu cầu START kết nối LoRa")
        self.controller.start()
        if hasattr(self.controller, "set_gui_bridge"):
            self.controller.set_gui_bridge(self)
        if not self._rx_thread or not self._rx_thread.is_alive():
            self._rx_thread = threading.Thread(
                target=self.controller.read_position_from_drone, daemon=True
            )
            self._rx_thread.start()

    @pyqtSlot()
    def stopConnection(self):
        if self.controller:
            print("GUI yêu cầu STOP kết nối LoRa")
            self.controller.stop()
        else:
            print("No controller attached.")

    @pyqtSlot()
    def landConnect(self):
        if self.controller:
            print("Đã gửi yêu cầu LAND đến Lora")
            self.controller.land_req()
        else:
            print("No controller attached.")

    @pyqtSlot()
    def offBoardConnect(self):
        if self.controller:
            print("Đã gửi yêu cầu OFFBOARD đến Lora")
            self.controller.offboard_req()
        else:
            print("No controller attached.")

    @pyqtSlot(list)
    def receivedTargetWaypoint(self, waypoints):
        if not self.controller:
            print("No controller attached.")
            return
        print(f"Nhận {len(waypoints)} waypoint từ JS:")
        for i, wp in enumerate(waypoints, 1):
            print(f"  {i}: {wp}")
        self.controller.update_waypoints(waypoints)
        self.controller.send_waypoints_to_drone()

    @pyqtSlot(float, float)
    def update_battery(self, percent, voltage):
        self.batteryUpdated.emit(percent, voltage)

    
    @pyqtSlot(float)
    def update_speed(self, spd):
        self.speedUpdated.emit(spd)

    def update_link(self, ok:bool):
        print(f"[Bridge] Link: {'Connected' if ok else 'Disconnected'}")
        self.linkUpdated.emit(bool(ok))
    @pyqtSlot(result=str)
    def getMapKey(self) -> str:
        return os.environ.get("AZURE_MAPS_KEY", "")
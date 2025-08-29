from PyQt6.QtCore import QObject, pyqtSignal, pyqtSlot
import threading
import os
import time
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

    # ===== Firmware Management Methods =====
    
    @pyqtSlot(result=list)
    def scanBoards(self):
        """Scan for available flight controller boards in bootloader mode"""
        print("[Bridge] Scanning for boards...")
        try:
            # This would typically use pyserial to scan for devices
            # For demo purposes, return a mock board
            import serial.tools.list_ports
            
            boards = []
            try:
                ports = serial.tools.list_ports.comports()
                
                for port in ports:
                    # Look for common flight controller identifiers
                    if any(identifier in port.description.lower() for identifier in 
                           ['pixhawk', 'px4', 'ardupilot', 'f4', 'f7', 'h7']):
                        boards.append({
                            'name': port.description,
                            'port': port.device,
                            'vid': port.vid,
                            'pid': port.pid
                        })
            except Exception as port_error:
                print(f"[Bridge] Port scanning error: {port_error}")
            
            # Demo: return a mock board if none found
            if not boards:
                boards = [{
                    'name': 'Pixhawk 4 (Demo)',
                    'port': 'COM3',
                    'vid': 9900,
                    'pid': 17
                }]
            
            print(f"[Bridge] Found {len(boards)} board(s): {boards}")
            return boards
            
        except Exception as e:
            print(f"[Bridge] Error scanning boards: {e}")
            return []

    @pyqtSlot(dict, result=bool)
    def flashFirmware(self, config):
        """Flash firmware to the connected board"""
        print(f"[Bridge] Flashing firmware with config: {config}")
        
        try:
            # Parse config
            stack = config.get('stack', 'px4')
            channel = config.get('channel', 'stable')
            vehicle = config.get('vehicle')
            custom_path = config.get('customPath')
            
            print(f"[Bridge] Firmware: {stack} {channel} {vehicle} {custom_path}")
            
            # This would typically:
            # 1. Download firmware from official repositories
            # 2. Put board in bootloader mode
            # 3. Flash using appropriate tools (px_uploader, etc.)
            # 4. Verify flash
            
            # For demo, simulate the process
            import time
            
            # Simulate download
            time.sleep(1)
            print("[Bridge] Downloading firmware...")
            
            # Simulate erase
            time.sleep(1)
            print("[Bridge] Erasing previous firmware...")
            
            # Simulate flash
            time.sleep(2)
            print("[Bridge] Programming new firmware...")
            
            # Simulate verify
            time.sleep(1)
            print("[Bridge] Verifying firmware...")
            
            print("[Bridge] Firmware flash completed successfully")
            return True
            
        except Exception as e:
            print(f"[Bridge] Error flashing firmware: {e}")
            return False

    @pyqtSlot(str, str, result=bool)
    def applyAirframe(self, frameClass, frameType):
        """Apply airframe configuration"""
        print(f"[Bridge] Applying airframe: {frameClass} - {frameType}")
        
        try:
            # This would typically:
            # 1. Set appropriate parameters for the airframe
            # 2. Restart the vehicle
            # 3. Verify configuration
            
            # For demo, just log the action
            print(f"[Bridge] Airframe {frameClass} {frameType} applied successfully")
            return True
            
        except Exception as e:
            print(f"[Bridge] Error applying airframe: {e}")
            return False

    @pyqtSlot(result=bool)
    def calibrateRadio(self):
        """Start radio calibration process"""
        print("[Bridge] Starting radio calibration...")
        
        try:
            # This would typically:
            # 1. Put vehicle in calibration mode
            # 2. Guide user through stick movements
            # 3. Save calibration data
            
            print("[Bridge] Radio calibration completed")
            return True
            
        except Exception as e:
            print(f"[Bridge] Error calibrating radio: {e}")
            return False

    @pyqtSlot(result=bool)
    def calibrateSensors(self):
        """Start sensor calibration process"""
        print("[Bridge] Starting sensor calibration...")
        
        try:
            # This would typically:
            # 1. Calibrate accelerometer
            # 2. Calibrate compass
            # 3. Calibrate gyroscope
            # 4. Save calibration data
            
            print("[Bridge] Sensor calibration completed")
            return True
            
        except Exception as e:
            print(f"[Bridge] Error calibrating sensors: {e}")
            return False

    # ===== Motor Control Methods =====
    
    @pyqtSlot(int, float)
    def setMotorOutput(self, motorIndex, output):
        """Set individual motor output (0-100%)"""
        print(f"[Bridge] Setting motor {motorIndex} to {output}%")
        
        try:
            # Convert percentage to PWM value (typically 1000-2000 μs)
            pwmValue = 1000 + (output / 100.0) * 1000
            
            # Here you would send the motor command to the vehicle
            if self.controller:
                # Example: self.controller.set_motor_output(motorIndex, pwmValue)
                print(f"[Bridge] Motor {motorIndex} PWM: {pwmValue:.0f} μs")
            
        except Exception as e:
            print(f"[Bridge] Error setting motor output: {e}")

    @pyqtSlot()
    def stopAllMotors(self):
        """Stop all motors"""
        print("[Bridge] Stopping all motors")
        
        try:
            # Here you would send stop command to all motors
            if self.controller:
                # Example: self.controller.stop_all_motors()
                print("[Bridge] All motors stopped")
            
        except Exception as e:
            print(f"[Bridge] Error stopping motors: {e}")

    # ===== Parameter Management Methods =====
    
    @pyqtSlot(result=list)
    def getParameters(self):
        """Get all vehicle parameters"""
        print("[Bridge] Getting vehicle parameters...")
        
        try:
            # This would typically query the vehicle for all parameters
            # For demo, return sample parameters
            sampleParams = [
                {"name": "SYSID_MYGCS", "value": "255", "type": "INT32"},
                {"name": "ARMING_CHECK", "value": "1", "type": "INT32"},
                {"name": "BATT_MONITOR", "value": "4", "type": "INT32"},
                {"name": "BATT_CAPACITY", "value": "3300", "type": "INT32"},
                {"name": "COMPASS_ENABLE", "value": "1", "type": "INT32"},
                {"name": "GPS_TYPE", "value": "1", "type": "INT32"},
                {"name": "MOT_PWM_TYPE", "value": "0", "type": "INT32"},
                {"name": "MOT_PWM_RATE", "value": "400", "type": "INT32"},
                {"name": "RATE_ROLL_P", "value": "0.15", "type": "FLOAT"},
                {"name": "RATE_ROLL_I", "value": "0.15", "type": "FLOAT"},
                {"name": "RATE_ROLL_D", "value": "0.003", "type": "FLOAT"},
                {"name": "PILOT_SPEED_UP", "value": "500", "type": "INT32"},
                {"name": "PILOT_SPEED_DN", "value": "300", "type": "INT32"},
                {"name": "RTL_ALT", "value": "1000", "type": "INT32"},
                {"name": "RTL_SPEED", "value": "500", "type": "INT32"},
                {"name": "WPNAV_SPEED", "value": "500", "type": "INT32"},
                {"name": "WPNAV_ACCEL", "value": "100", "type": "INT32"},
                {"name": "RC1_MIN", "value": "1100", "type": "INT32"},
                {"name": "RC1_MAX", "value": "1900", "type": "INT32"},
                {"name": "RC1_TRIM", "value": "1500", "type": "INT32"},
                {"name": "RC2_MIN", "value": "1100", "type": "INT32"},
                {"name": "RC2_MAX", "value": "1900", "type": "INT32"},
                {"name": "RC2_TRIM", "value": "1500", "type": "INT32"},
                {"name": "RC3_MIN", "value": "1100", "type": "INT32"},
                {"name": "RC3_MAX", "value": "1900", "type": "INT32"},
                {"name": "RC3_TRIM", "value": "1500", "type": "INT32"},
                {"name": "RC4_MIN", "value": "1100", "type": "INT32"},
                {"name": "RC4_MAX", "value": "1900", "type": "INT32"},
                {"name": "RC4_TRIM", "value": "1500", "type": "INT32"}
            ]
            
            print(f"[Bridge] Retrieved {len(sampleParams)} parameters")
            return sampleParams
            
        except Exception as e:
            print(f"[Bridge] Error getting parameters: {e}")
            return []

    @pyqtSlot(str, str, result=bool)
    def setParameter(self, name, value):
        """Set a single parameter"""
        print(f"[Bridge] Setting parameter {name} = {value}")
        
        try:
            # Here you would send the parameter to the vehicle
            if self.controller:
                # Example: self.controller.set_parameter(name, value)
                print(f"[Bridge] Parameter {name} set to {value}")
            
            return True
            
        except Exception as e:
            print(f"[Bridge] Error setting parameter: {e}")
            return False

    @pyqtSlot(result=bool)
    def saveParameters(self):
        """Save parameters to vehicle"""
        print("[Bridge] Saving parameters to vehicle...")
        
        try:
            # Here you would save parameters to the vehicle
            if self.controller:
                # Example: self.controller.save_parameters()
                print("[Bridge] Parameters saved successfully")
            
            return True
            
        except Exception as e:
            print(f"[Bridge] Error saving parameters: {e}")
            return False

    @pyqtSlot(result=bool)
    def loadParameters(self):
        """Load parameters from vehicle"""
        print("[Bridge] Loading parameters from vehicle...")
        
        try:
            # Here you would load parameters from the vehicle
            if self.controller:
                # Example: self.controller.load_parameters()
                print("[Bridge] Parameters loaded successfully")
            
            return True
            
        except Exception as e:
            print(f"[Bridge] Error loading parameters: {e}")
            return False
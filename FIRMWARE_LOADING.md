# Firmware Loading Feature

This document describes the firmware loading functionality implemented in the Ground Control Station (GCS) application.

## Overview

The firmware loading feature allows users to install PX4 Pro or ArduPilot firmware onto Pixhawk-family flight-controller boards directly from the GCS interface. This feature is similar to QGroundControl's firmware loading capability.

## Features

### 1. Board Detection
- Automatically scans for connected flight controller boards
- Supports Pixhawk, PX4, ArduPilot, and other compatible boards
- Detects boards in bootloader mode

### 2. Firmware Selection
- **PX4 Flight Stack**: Install PX4 Pro firmware
- **ArduPilot Flight Stack**: Install ArduPilot firmware with vehicle type selection
- **Channel Selection**: Choose between Stable, Beta, or Daily builds
- **Custom Firmware**: Upload custom firmware files (.px4, .apj, .bin)

### 3. Firmware Installation Process
- Downloads firmware from official repositories
- Erases previous firmware
- Programs new firmware
- Verifies installation
- Real-time progress tracking

## How to Use

### 1. Access Firmware Setup
1. Open the GCS application
2. Click on the "Setup" button in the sidebar
3. Click on "Firmware" in the setup menu

### 2. Connect Device
1. **Important**: Disconnect all USB connections to your vehicle (both direct and through telemetry radio)
2. **Important**: Ensure the vehicle is not powered by a battery
3. Connect your device (Pixhawk, SiK Radio, PX4 Flow) directly to your computer via USB
4. Click the "Refresh" button to scan for connected boards

### 3. Select Firmware
1. Choose the Flight Stack (PX4 or ArduPilot)
2. If selecting ArduPilot, choose the vehicle type (Quadcopter, Plane, Rover, etc.)
3. Select the firmware channel (Stable, Beta, or Daily)
4. Optionally, use Advanced Settings to upload a custom firmware file

### 4. Install Firmware
1. Click "Load Firmware" to start the installation
2. Monitor the progress bar and log output
3. Wait for the installation to complete
4. The device will reboot and reconnect automatically

## Technical Implementation

### Frontend (JavaScript)
- **File**: `web/js/ui/setup.js`
- **Features**:
  - Board scanning and detection
  - Firmware selection interface
  - Progress tracking
  - Real-time log display
  - Error handling

### Backend (Python)
- **File**: `app/lora_bridge.py`
- **Methods**:
  - `scanBoards()`: Scan for connected boards
  - `flashFirmware(config)`: Flash firmware with given configuration
  - `applyAirframe(frameClass, frameType)`: Apply airframe configuration
  - `calibrateRadio()`: Start radio calibration
  - `calibrateSensors()`: Start sensor calibration

### Bridge Communication
- **File**: `web/js/bridge.js`
- Uses Qt WebChannel for communication between JavaScript frontend and Python backend
- Handles method calls and signal connections

## Safety Warnings

⚠️ **IMPORTANT SAFETY PRECAUTIONS**:

1. **Disconnect Power**: Always disconnect the battery before flashing firmware
2. **Disconnect Telemetry**: Remove all telemetry radio connections
3. **Direct USB Connection**: Connect directly to a powered USB port (not through a USB hub)
4. **Stable Connection**: Ensure the USB connection is stable during the entire process
5. **Backup**: Consider backing up current firmware if possible

## Supported Hardware

### Flight Controllers
- Pixhawk 1
- Pixhawk 2
- Pixhawk 4
- Pixhawk 5
- Pixhawk 6
- Pixhawk 7
- Other Pixhawk-compatible boards

### Firmware Types
- **PX4 Pro**: v1.14.x and newer
- **ArduPilot**: Copter, Plane, Rover, Sub

### File Formats
- `.px4`: PX4 firmware files
- `.apj`: ArduPilot firmware files
- `.bin`: Binary firmware files

## Troubleshooting

### Common Issues

1. **Board Not Detected**
   - Ensure board is in bootloader mode
   - Try different USB cable
   - Check device manager for connection issues

2. **Flash Failed**
   - Verify USB connection is stable
   - Try different USB port
   - Check if board supports the selected firmware

3. **Verification Failed**
   - Retry the flash process
   - Check if board has sufficient memory
   - Verify firmware compatibility

### Debug Information
- Check the console output for detailed error messages
- Monitor the log output in the firmware interface
- Verify board detection in device manager

## Future Enhancements

1. **Firmware Repository Integration**: Direct download from official repositories
2. **Parameter Backup**: Automatic backup of current parameters before flash
3. **Firmware Validation**: Checksum verification of downloaded firmware
4. **Batch Operations**: Flash multiple devices simultaneously
5. **Firmware Rollback**: Ability to revert to previous firmware version

## Development Notes

### Demo Mode
When the backend methods are not fully implemented, the system runs in demo mode:
- Simulates board detection
- Shows mock progress during firmware flash
- Provides realistic user feedback

### Extending Functionality
To add support for new hardware or firmware types:
1. Update the `scanBoards()` method to detect new hardware
2. Modify the `flashFirmware()` method to handle new firmware formats
3. Update the frontend interface to support new options

## Related Files

- `web/views/setup.html`: Setup view HTML structure
- `web/assets/css/views.css`: Setup overlay and firmware styles
- `web/js/view-manager.js`: View management and navigation
- `app/main.py`: Main application entry point
- `app/control.py`: Ground controller implementation

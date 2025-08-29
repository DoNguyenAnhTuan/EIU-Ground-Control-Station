# Ground Control Station Setup Features

This document describes the comprehensive setup functionality implemented in the Ground Control Station (GCS) application, including firmware loading and all vehicle configuration features.

## Overview

The setup system provides a complete vehicle configuration interface similar to QGroundControl, allowing users to configure and calibrate all aspects of their drone or autonomous vehicle. The system includes firmware management, sensor calibration, flight mode configuration, power management, motor testing, safety settings, tuning parameters, camera/gimbal setup, and advanced parameter management.

## Features

### 1. **Firmware Management**
- **Board Detection**: Automatically scans for connected flight controller boards
- **Firmware Selection**: Choose between PX4 Pro and ArduPilot firmware
- **Channel Selection**: Stable, Beta, or Daily builds
- **Custom Firmware**: Upload custom firmware files (.px4, .apj, .bin)
- **Installation Process**: Download, erase, program, and verify firmware

### 2. **Sensor Setup**
- **Accelerometer Calibration**: Multi-position calibration
- **Compass Calibration**: 360-degree rotation calibration
- **Gyroscope Calibration**: Static calibration
- **Level Horizon Calibration**: Level flight orientation setup
- **Pressure/Barometer Calibration**: Altitude zero setting
- **CompassMot Calibration**: Motor interference compensation
- **Sensor Orientation**: Flight controller and compass mounting configuration

### 3. **Flight Modes Configuration**
- **Mode Channel Selection**: Choose radio channel for mode switching
- **6 Flight Modes**: Configure up to 6 different flight modes
- **Mode Options**: Stabilized, Altitude Hold, Loiter, RTL, Auto, Acro, Position, etc.
- **Channel Mapping**: Map modes to radio switch positions

### 4. **Power Management**
- **Battery Configuration**: Cell count, voltage settings
- **Voltage Calibration**: Automatic voltage divider calculation
- **Current Calibration**: Amps-per-volt calculation
- **ESC Calibration**: PWM range calibration
- **Advanced Settings**: Voltage drop compensation, PWM limits

### 5. **Motor Setup & Testing**
- **Individual Motor Control**: Test each motor separately
- **Direction Verification**: Confirm motor rotation direction
- **Safety Features**: Propeller removal confirmation
- **Motor Testing**: 3-second test mode
- **Emergency Stop**: Instant motor shutdown

### 6. **Safety Configuration**
- **Return to Launch (RTL)**: Altitude and speed settings
- **RC Loss Failsafe**: Timeout and action configuration
- **Link Loss Failsafe**: Communication loss handling
- **Low Battery Failsafe**: Threshold and action settings
- **Failsafe Actions**: RTL, Land, Hold, Warning options

### 7. **Flight Tuning**
- **Rate Controller**: Roll/Pitch PID tuning
- **Attitude Controller**: Roll/Pitch PID tuning
- **Yaw Controller**: Yaw PID tuning
- **Altitude Controller**: Altitude PID tuning
- **Default Values**: Reset to factory defaults

### 8. **Camera & Gimbal Setup**
- **Camera Configuration**: Type and trigger settings
- **Gimbal Control**: Roll, Pitch, Yaw channel mapping
- **Gimbal Types**: Servo, Brushless, DJI support
- **Photo Interval**: Automatic photo capture timing
- **Gimbal Testing**: Test gimbal movement

### 9. **Advanced Parameters**
- **Parameter Search**: Find specific parameters
- **Category Filtering**: Filter by parameter type
- **Real-time Editing**: Modify parameters directly
- **Parameter Reset**: Reset individual parameters
- **Bulk Operations**: Save, load, reset all parameters

## How to Use

### 1. Access Setup
1. Open the GCS application
2. Click on the "Setup" button in the sidebar
3. Choose the desired setup category from the menu

### 2. Firmware Loading
1. **Disconnect Power**: Remove battery and telemetry connections
2. **Connect Device**: Connect flight controller via USB
3. **Scan for Boards**: Click "Refresh" to detect connected devices
4. **Select Firmware**: Choose stack, channel, and vehicle type
5. **Install**: Click "Load Firmware" and monitor progress

### 3. Sensor Calibration
1. **Choose Sensor**: Click on the sensor to calibrate
2. **Follow Instructions**: Position vehicle as directed
3. **Complete Calibration**: Wait for completion confirmation
4. **Verify Results**: Check calibration quality indicators

### 4. Flight Mode Setup
1. **Select Channel**: Choose radio channel for mode switching
2. **Configure Modes**: Set desired flight mode for each position
3. **Apply Settings**: Save configuration to vehicle

### 5. Power Configuration
1. **Battery Settings**: Enter battery specifications
2. **Calibration**: Use calculation tools for voltage/current
3. **ESC Setup**: Calibrate ESC PWM range if needed
4. **Apply Settings**: Save power configuration

### 6. Motor Testing
1. **Safety Check**: Confirm propellers are removed
2. **Enable Controls**: Check "Propellers are removed" box
3. **Test Motors**: Use sliders or test button
4. **Verify Direction**: Confirm correct motor rotation

### 7. Safety Configuration
1. **RTL Settings**: Configure return-to-launch parameters
2. **Failsafe Actions**: Set appropriate failsafe responses
3. **Battery Monitoring**: Configure low battery handling
4. **Apply Settings**: Save safety configuration

### 8. Tuning Parameters
1. **Adjust PID Values**: Modify controller gains
2. **Test Changes**: Monitor vehicle response
3. **Fine-tune**: Iterate for optimal performance
4. **Save Settings**: Apply tuning parameters

### 9. Camera Setup
1. **Camera Type**: Select camera model
2. **Trigger Mode**: Configure photo capture
3. **Gimbal Setup**: Map control channels
4. **Test Functionality**: Verify camera/gimbal operation

### 10. Parameter Management
1. **Search Parameters**: Find specific parameters
2. **Filter by Category**: Browse parameter types
3. **Edit Values**: Modify parameter settings
4. **Save Changes**: Apply parameter modifications

## Technical Implementation

### Frontend (JavaScript)
- **File**: `web/js/ui/setup.js`
- **Features**:
  - Modular screen initialization
  - Real-time parameter editing
  - Interactive motor controls
  - Dynamic sensor calibration
  - Comprehensive form validation

### Backend (Python)
- **File**: `app/lora_bridge.py`
- **Methods**:
  - `scanBoards()`: Hardware detection
  - `flashFirmware()`: Firmware installation
  - `calibrateSensors()`: Sensor calibration
  - `setMotorOutput()`: Motor control
  - `getParameters()`: Parameter management
  - `setParameter()`: Parameter modification

### Bridge Communication
- **File**: `web/js/bridge.js`
- Uses Qt WebChannel for real-time communication
- Handles method calls and signal connections
- Provides fallback for missing backend methods

### User Interface
- **File**: `web/index.html`
- **CSS**: `web/assets/css/views.css`
- Responsive design with dark theme
- Intuitive navigation and controls
- Safety warnings and confirmations

## Safety Warnings

⚠️ **CRITICAL SAFETY PRECAUTIONS**:

### Firmware Loading
1. **Disconnect Power**: Always disconnect battery before flashing
2. **Remove Telemetry**: Disconnect all radio links
3. **Stable Connection**: Use direct USB connection
4. **Backup Data**: Consider backing up current configuration

### Motor Testing
1. **Remove Propellers**: Always remove props before testing
2. **Secure Vehicle**: Ensure vehicle is properly secured
3. **Clear Area**: Test in open, clear space
4. **Emergency Stop**: Know how to stop motors immediately

### Sensor Calibration
1. **Level Surface**: Use level surface for calibration
2. **Minimize Interference**: Avoid magnetic interference
3. **Follow Instructions**: Complete calibration steps exactly
4. **Verify Results**: Check calibration quality

### ESC Calibration
1. **Remove Props**: Never calibrate with propellers attached
2. **Follow Sequence**: Complete calibration in correct order
3. **Monitor Motors**: Watch for unexpected motor movement
4. **Test Safely**: Verify calibration in safe environment

## Supported Hardware

### Flight Controllers
- Pixhawk 1, 2, 4, 5, 6, 7
- Other Pixhawk-compatible boards
- ArduPilot and PX4 compatible hardware

### Firmware Types
- **PX4 Pro**: v1.14.x and newer
- **ArduPilot**: Copter, Plane, Rover, Sub
- **Custom Firmware**: User-provided firmware files

### Sensors
- **IMU**: Accelerometer, Gyroscope, Magnetometer
- **GPS**: Various GPS modules
- **Barometer**: Pressure sensors
- **Compass**: Internal and external compasses

### Motors & ESCs
- **Motor Types**: Brushless and brushed motors
- **ESC Types**: Various ESC protocols
- **PWM Range**: 1000-2000 μs standard range

## Troubleshooting

### Common Issues

1. **Board Not Detected**
   - Check USB connection and drivers
   - Verify board is in bootloader mode
   - Try different USB cable or port

2. **Calibration Fails**
   - Ensure proper positioning
   - Check for magnetic interference
   - Verify sensor connections

3. **Motor Issues**
   - Confirm propellers are removed
   - Check motor connections
   - Verify ESC calibration

4. **Parameter Changes Not Applied**
   - Check parameter save/load
   - Verify vehicle connection
   - Restart vehicle if needed

### Debug Information
- Check browser console for JavaScript errors
- Monitor Python console for backend messages
- Verify bridge communication status
- Check parameter transmission logs

## Future Enhancements

1. **Advanced Calibration**: Automated calibration procedures
2. **Parameter Validation**: Real-time parameter validation
3. **Configuration Backup**: Automatic configuration backup
4. **Multi-Vehicle Support**: Support for multiple vehicles
5. **Cloud Integration**: Parameter synchronization
6. **Advanced Tuning**: Automated tuning assistance
7. **Safety Features**: Enhanced safety checks and warnings
8. **Mobile Support**: Tablet and phone compatibility

## Development Notes

### Demo Mode
When backend methods are not fully implemented:
- Simulates hardware detection
- Shows realistic progress feedback
- Provides educational demonstrations
- Maintains user experience consistency

### Extending Functionality
To add support for new features:
1. Update HTML interface
2. Add JavaScript logic
3. Implement backend methods
4. Update bridge communication
5. Add CSS styling

### Testing
- Test all safety features thoroughly
- Verify parameter validation
- Check error handling
- Test responsive design
- Validate user workflows

## Related Files

- `web/views/setup.html`: Setup view HTML structure
- `web/assets/css/views.css`: Setup overlay and component styles
- `web/js/view-manager.js`: View management and navigation
- `web/js/ui/setup.js`: Setup screen logic and interactions
- `app/lora_bridge.py`: Backend implementation
- `app/main.py`: Main application entry point
- `app/control.py`: Ground controller implementation

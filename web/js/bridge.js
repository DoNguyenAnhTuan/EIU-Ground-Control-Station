// Setup QWebChannel và expose các callback cập nhật UI
export function initBridge(signalHandlers) {
  return new Promise((resolve) => {
    if (!window.qt || !window.QWebChannel) return resolve(null);
    new QWebChannel(qt.webChannelTransport, (channel) => {
      const bridge = channel.objects?.bridge || null;
      if (!bridge) return resolve(null);

      // Wire signals nếu có
      if (signalHandlers) {
        const { onLocal, onGPS, onBattery, onSpeed, onLink, onMode } = signalHandlers;
        bridge.positionUpdated       && onLocal  && bridge.positionUpdated.connect(onLocal);
        bridge.positionUpdatedLocal  && onLocal  && bridge.positionUpdatedLocal.connect(onLocal);
        bridge.positionUpdatedGPS    && onGPS    && bridge.positionUpdatedGPS.connect(onGPS);
        bridge.batteryUpdated        && onBattery&& bridge.batteryUpdated.connect(onBattery);
        bridge.speedUpdated          && onSpeed  && bridge.speedUpdated.connect(onSpeed);
        bridge.linkUpdated           && onLink   && bridge.linkUpdated.connect(onLink);
        bridge.modeUpdated           && onMode   && bridge.modeUpdated.connect(onMode);
      }

      // Wrapper action APIs (chỉ gọi nếu slot tồn tại)
      const api = {
        startConnection: (...a)=> bridge.startConnection?.(...a),
        stopConnection:  (...a)=> bridge.stopConnection?.(...a),
        arm:             (...a)=> bridge.arm?.(...a) || bridge.command?.('arm', ...a),
        disarm:          (...a)=> bridge.disarm?.(...a) || bridge.command?.('disarm', ...a),
        takeoff:         (alt)=> bridge.takeoff?.(alt) || bridge.command?.('takeoff', alt),
        rtl:             (...a)=> bridge.rtl?.(...a) || bridge.command?.('rtl', ...a),
        land:            (...a)=> bridge.land?.(...a) || bridge.command?.('land', ...a),
        receivedTargetWaypoint: (...a)=> bridge.receivedTargetWaypoint?.(...a),
        downloadMission: (...a)=> bridge.downloadMission?.(...a),
        
        // Firmware management methods
        scanBoards:      (...a)=> bridge.scanBoards?.(...a),
        flashFirmware:   (...a)=> bridge.flashFirmware?.(...a),
        applyAirframe:   (...a)=> bridge.applyAirframe?.(...a),
        calibrateRadio:  (...a)=> bridge.calibrateRadio?.(...a),
        calibrateSensors:(...a)=> bridge.calibrateSensors?.(...a),
        
        // Motor control methods
        setMotorOutput:  (...a)=> bridge.setMotorOutput?.(...a),
        stopAllMotors:   (...a)=> bridge.stopAllMotors?.(...a),
        
        // Parameter management methods
        getParameters:   (...a)=> bridge.getParameters?.(...a),
        setParameter:    (...a)=> bridge.setParameter?.(...a),
        saveParameters:  (...a)=> bridge.saveParameters?.(...a),
        loadParameters:  (...a)=> bridge.loadParameters?.(...a),
      };

      // Trả về proxy: ưu tiên api, fallback sang bridge gốc
      const merged = new Proxy(bridge, {
        get(t, p) { return (p in api) ? api[p] : t[p]; }
      });

      resolve(merged);
    });
  });
}

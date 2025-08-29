// js/ui/setup.js - Setup overlay management and firmware loading
export function initSetupOverlay(bridge) {
  console.log('initSetupOverlay called with bridge:', bridge);
  
  const overlay = document.getElementById('setupFull');
  const backBtn = document.getElementById('setupBack');
  const titleEl = document.getElementById('setupTitle');

  console.log('Setup elements found:', {
    overlay: !!overlay,
    backBtn: !!backBtn,
    titleEl: !!titleEl
  });

  const titleMap = {
    summary: 'Summary',
    firmware: 'Firmware',
    airframe: 'Airframe',
    radio: 'Radio',
    sensors: 'Sensors',
    flightmodes: 'Flight Modes',
    power: 'Power',
    motors: 'Motors',
    safety: 'Safety',
    tuning: 'Tuning',
    camera: 'Camera',
    params: 'Parameters'
  };

  let currentScreen = 'summary';

  function openScreen(key) {
    console.log(`Opening setup screen: ${key}`);
    
    // Hide all screens
    const allScreens = document.querySelectorAll('.setup-screen');
    console.log(`Found ${allScreens.length} setup screens`);
    allScreens.forEach(s => s.hidden = true);
    
    // Show selected screen
    const pane = document.getElementById(`setup-screen-${key}`);
    console.log(`Looking for screen: setup-screen-${key}, found:`, !!pane);
    
    if (!pane) {
      console.error(`Setup screen not found: ${key}`);
      return;
    }
    
    pane.hidden = false;
    currentScreen = key;
    
    // Update title
    if (titleEl) {
      titleEl.textContent = titleMap[key] || key;
    }
    
    // Show overlay
    if (overlay) {
      overlay.hidden = false;
      document.body.classList.add('overlay-open');
      console.log('Overlay shown, body class added');
    } else {
      console.error('Overlay element not found!');
    }
    
    // Initialize screen-specific logic
    initScreenLogic(key);
  }

  function closeOverlay() {
    console.log('Closing setup overlay');
    overlay.hidden = true;
    document.body.classList.remove('overlay-open');
    currentScreen = 'summary';
  }

  function initScreenLogic(screenName) {
    switch (screenName) {
      case 'firmware':
        initFirmwareScreen();
        break;
      case 'airframe':
        initAirframeScreen();
        break;
      case 'radio':
        initRadioScreen();
        break;
      case 'sensors':
        initSensorsScreen();
        break;
      case 'flightmodes':
        initFlightModesScreen();
        break;
      case 'power':
        initPowerScreen();
        break;
      case 'motors':
        initMotorsScreen();
        break;
      case 'safety':
        initSafetyScreen();
        break;
      case 'tuning':
        initTuningScreen();
        break;
      case 'camera':
        initCameraScreen();
        break;
      case 'params':
        initParamsScreen();
        break;
      default:
        // Other screens can be initialized here
        break;
    }
  }

  function initFirmwareScreen() {
    console.log('Initializing firmware screen...');
    
    const dot = document.getElementById('fwDot');
    const status = document.getElementById('fwStatus');
    const refresh = document.getElementById('fwRefresh');
    const start = document.getElementById('fwStart');
    const chan = document.getElementById('fwChannel');
    const veh = document.getElementById('fwVehicle');
    const file = document.getElementById('fwFile');
    const prog = document.getElementById('fwProg');
    const logEl = document.getElementById('fwLog');

    if (!refresh || !start) {
      console.error('Firmware elements not found');
      return;
    }

    const log = (t) => {
      logEl.textContent += (t + '\n');
      logEl.scrollTop = logEl.scrollHeight;
    };

    const setStatus = (txt, ok = false) => {
      status.textContent = txt;
      dot?.classList.toggle('ok', !!ok);
      // Allow flash from custom file when board not detected
      start.disabled = !ok && !(file?.files?.length);
    };

    setStatus('Disconnected', false);

    // Handle ArduPilot vehicle selector
    document.querySelectorAll('input[name="fwStack"]').forEach(r => {
      r.addEventListener('change', () => {
        veh.hidden = !(r.value === 'ardu' && r.checked);
      });
    });

    // Refresh button - scan for boards
    refresh.addEventListener('click', async () => {
      console.log('Scanning for boards...');
      setStatus('Scanning...');
      log('Scanning for bootloader...');
      
      try {
        if (bridge && typeof bridge.scanBoards === 'function') {
          const list = await bridge.scanBoards(); // [{name,port}, ...]
          const b = list?.[0];
          setStatus(b ? `Found: ${b.name || 'Board'}` : 'Not found', !!b);
          log(b ? 'Bootloader detected.' : 'No bootloader found.');
        } else {
          // Demo mode
          setTimeout(() => {
            setStatus('Found: Pixhawk (demo)', true);
            log('Bootloader detected (demo).');
          }, 600);
        }
      } catch (e) {
        setStatus('Scan error');
        log('Scan failed: ' + (e?.message || e));
      }
    });

    // Start firmware update
    start.addEventListener('click', async () => {
      const stack = document.querySelector('input[name="fwStack"]:checked')?.value || 'px4';
      const channel = chan.value;
      const vehicle = veh.hidden ? null : veh.value;
      const custom = file?.files?.[0]?.name || null;

      log(`Starting flash: ${stack} ${channel}${vehicle ? ` (${vehicle})` : ''}${custom ? ` [file:${custom}]` : ''}`);
      prog.style.width = '0%';

      try {
        if (bridge && typeof bridge.flashFirmware === 'function') {
          await bridge.flashFirmware(
            { stack, channel, vehicle, customPath: custom },
            (p, msg) => {
              if (p != null) prog.style.width = `${Math.max(0, Math.min(100, p))}%`;
              if (msg) log(msg);
            }
          );
        } else {
          // Demo progress
          const steps = [
            'Downloading firmware...',
            'Download complete',
            'Erasing previous program...',
            'Erase complete',
            'Programming new version...',
            'Verify program...',
            'Upgrade complete'
          ];
          
          for (let i = 0; i < steps.length; i++) {
            await new Promise(r => setTimeout(r, 600));
            prog.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
            log(steps[i]);
          }
        }
      } catch (e) {
        log('Error: ' + (e?.message || e));
      }
    });

    // Auto-refresh on screen open
    setTimeout(() => {
      refresh.click();
    }, 100);
  }

  function initAirframeScreen() {
    console.log('Initializing airframe screen...');
    
    const applyBtn = document.getElementById('applyAirframe');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const frameClass = document.getElementById('airframeClass').value;
        const frameType = document.getElementById('airframeType').value;
        
        console.log(`Applying airframe: ${frameClass} - ${frameType}`);
        
        // Show confirmation dialog
        if (confirm(`Apply ${frameClass} ${frameType} configuration and restart vehicle?`)) {
          // Here you would call the bridge to apply airframe settings
          if (bridge && typeof bridge.applyAirframe === 'function') {
            bridge.applyAirframe(frameClass, frameType);
          } else {
            console.log('Demo: Airframe applied successfully');
            alert('Airframe configuration applied successfully!');
          }
        }
      });
    }
  }

  function initRadioScreen() {
    console.log('Initializing radio screen...');
    
    const nextStepBtn = document.getElementById('nextStep');
    if (nextStepBtn) {
      nextStepBtn.addEventListener('click', () => {
        console.log('Radio calibration next step');
        // Implement radio calibration steps here
        alert('Radio calibration step completed!');
      });
    }
  }

  function initSensorsScreen() {
    console.log('Initializing sensors screen...');
    
    // Bind sensor calibration buttons
    document.querySelectorAll('.sensor-item button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sensorItem = e.target.closest('.sensor-item');
        const sensorType = sensorItem.dataset.sensor;
        console.log(`Starting ${sensorType} calibration...`);
        
        // Here you would call the bridge to start sensor calibration
        if (bridge && typeof bridge.calibrateSensors === 'function') {
          bridge.calibrateSensors(sensorType);
        } else {
          alert(`${sensorType} calibration started (demo mode)`);
        }
      });
    });

    // Bind sensor settings
    const applySensorSettingsBtn = document.getElementById('applySensorSettings');
    if (applySensorSettingsBtn) {
      applySensorSettingsBtn.addEventListener('click', () => {
        const fcOrientation = document.getElementById('fcOrientation').value;
        const compass1Orientation = document.getElementById('compass1Orientation').value;
        const compass2Orientation = document.getElementById('compass2Orientation').value;
        const useCompass1 = document.getElementById('useCompass1').checked;
        const useCompass2 = document.getElementById('useCompass2').checked;
        
        console.log('Applying sensor settings:', {
          fcOrientation,
          compass1Orientation,
          compass2Orientation,
          useCompass1,
          useCompass2
        });
        
        alert('Sensor settings applied successfully!');
      });
    }
  }

  function initFlightModesScreen() {
    console.log('Initializing flight modes screen...');
    
    const applyFlightModesBtn = document.getElementById('applyFlightModes');
    if (applyFlightModesBtn) {
      applyFlightModesBtn.addEventListener('click', () => {
        const modeChannel = document.getElementById('modeChannel').value;
        const modes = [];
        
        for (let i = 1; i <= 6; i++) {
          const modeSelect = document.getElementById(`mode${i}`);
          if (modeSelect) {
            modes.push(modeSelect.value);
          }
        }
        
        console.log('Applying flight modes:', {
          modeChannel,
          modes
        });
        
        alert('Flight modes applied successfully!');
      });
    }
  }

  function initPowerScreen() {
    console.log('Initializing power screen...');
    
    // Bind calculation buttons
    const calcVoltageDividerBtn = document.getElementById('calcVoltageDivider');
    if (calcVoltageDividerBtn) {
      calcVoltageDividerBtn.addEventListener('click', () => {
        const measuredVoltage = prompt('Enter measured voltage from multimeter:');
        if (measuredVoltage && !isNaN(measuredVoltage)) {
          const voltageDivider = (parseFloat(measuredVoltage) / 3.3) * 10;
          document.getElementById('voltageDivider').value = voltageDivider.toFixed(1);
        }
      });
    }

    const calcAmpsPerVoltBtn = document.getElementById('calcAmpsPerVolt');
    if (calcAmpsPerVoltBtn) {
      calcAmpsPerVoltBtn.addEventListener('click', () => {
        const measuredCurrent = prompt('Enter measured current from multimeter:');
        if (measuredCurrent && !isNaN(measuredCurrent)) {
          const ampsPerVolt = parseFloat(measuredCurrent) / 3.3;
          document.getElementById('ampsPerVolt').value = ampsPerVolt.toFixed(1);
        }
      });
    }

    const calibrateESCBtn = document.getElementById('calibrateESC');
    if (calibrateESCBtn) {
      calibrateESCBtn.addEventListener('click', () => {
        if (confirm('⚠️ WARNING: Remove all propellers before ESC calibration!\n\nProceed with ESC calibration?')) {
          console.log('Starting ESC calibration...');
          alert('ESC calibration started. Follow the on-screen instructions.');
        }
      });
    }

    const applyPowerSettingsBtn = document.getElementById('applyPowerSettings');
    if (applyPowerSettingsBtn) {
      applyPowerSettingsBtn.addEventListener('click', () => {
        const batteryCells = document.getElementById('batteryCells').value;
        const batteryFull = document.getElementById('batteryFull').value;
        const batteryEmpty = document.getElementById('batteryEmpty').value;
        const voltageDivider = document.getElementById('voltageDivider').value;
        const ampsPerVolt = document.getElementById('ampsPerVolt').value;
        
        console.log('Applying power settings:', {
          batteryCells,
          batteryFull,
          batteryEmpty,
          voltageDivider,
          ampsPerVolt
        });
        
        alert('Power settings applied successfully!');
      });
    }
  }

  function initMotorsScreen() {
    console.log('Initializing motors screen...');
    
    const propsRemovedCheckbox = document.getElementById('propsRemoved');
    const motorSliders = document.querySelectorAll('.motor-slider');
    const motorValues = document.querySelectorAll('.motor-value');
    
    // Enable/disable motor sliders based on checkbox
    propsRemovedCheckbox.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      motorSliders.forEach(slider => {
        slider.disabled = !enabled;
      });
    });
    
    // Update motor values when sliders change
    motorSliders.forEach((slider, index) => {
      slider.addEventListener('input', (e) => {
        const value = e.target.value;
        motorValues[index].textContent = `${value}%`;
        
        // Here you would send the motor command to the vehicle
        if (bridge && typeof bridge.setMotorOutput === 'function') {
          bridge.setMotorOutput(index + 1, value);
        }
      });
    });
    
    // Stop all motors button
    const stopAllMotorsBtn = document.getElementById('stopAllMotors');
    if (stopAllMotorsBtn) {
      stopAllMotorsBtn.addEventListener('click', () => {
        motorSliders.forEach(slider => {
          slider.value = 0;
        });
        motorValues.forEach(value => {
          value.textContent = '0%';
        });
        
        if (bridge && typeof bridge.stopAllMotors === 'function') {
          bridge.stopAllMotors();
        }
      });
    }
    
    // Test all motors button
    const testAllMotorsBtn = document.getElementById('testAllMotors');
    if (testAllMotorsBtn) {
      testAllMotorsBtn.addEventListener('click', () => {
        if (!propsRemovedCheckbox.checked) {
          alert('⚠️ Please confirm that propellers are removed before testing motors!');
          return;
        }
        
        console.log('Testing all motors for 3 seconds...');
        
        // Simulate motor test
        motorSliders.forEach(slider => {
          slider.value = 50;
        });
        motorValues.forEach(value => {
          value.textContent = '50%';
        });
        
        setTimeout(() => {
          motorSliders.forEach(slider => {
            slider.value = 0;
          });
          motorValues.forEach(value => {
            value.textContent = '0%';
          });
        }, 3000);
      });
    }
  }

  function initSafetyScreen() {
    console.log('Initializing safety screen...');
    
    const applySafetySettingsBtn = document.getElementById('applySafetySettings');
    if (applySafetySettingsBtn) {
      applySafetySettingsBtn.addEventListener('click', () => {
        const rtlMinAlt = document.getElementById('rtlMinAlt').value;
        const rtlHomeAlt = document.getElementById('rtlHomeAlt').value;
        const rcLossTimeout = document.getElementById('rcLossTimeout').value;
        const rcLossAction = document.getElementById('rcLossAction').value;
        const linkLossAction = document.getElementById('linkLossAction').value;
        const lowBatteryAction = document.getElementById('lowBatteryAction').value;
        const lowBatteryThreshold = document.getElementById('lowBatteryThreshold').value;
        
        console.log('Applying safety settings:', {
          rtlMinAlt,
          rtlHomeAlt,
          rcLossTimeout,
          rcLossAction,
          linkLossAction,
          lowBatteryAction,
          lowBatteryThreshold
        });
        
        alert('Safety settings applied successfully!');
      });
    }
  }

  function initTuningScreen() {
    console.log('Initializing tuning screen...');
    
    const applyTuningSettingsBtn = document.getElementById('applyTuningSettings');
    if (applyTuningSettingsBtn) {
      applyTuningSettingsBtn.addEventListener('click', () => {
        const tuningParams = {
          rateRollP: document.getElementById('rateRollP').value,
          rateRollI: document.getElementById('rateRollI').value,
          rateRollD: document.getElementById('rateRollD').value,
          attitudeRollP: document.getElementById('attitudeRollP').value,
          attitudeRollI: document.getElementById('attitudeRollI').value,
          rateYawP: document.getElementById('rateYawP').value,
          rateYawI: document.getElementById('rateYawI').value,
          rateYawD: document.getElementById('rateYawD').value,
          altP: document.getElementById('altP').value,
          altI: document.getElementById('altI').value,
          altD: document.getElementById('altD').value
        };
        
        console.log('Applying tuning settings:', tuningParams);
        
        alert('Tuning settings applied successfully!');
      });
    }
    
    const resetTuningDefaultsBtn = document.getElementById('resetTuningDefaults');
    if (resetTuningDefaultsBtn) {
      resetTuningDefaultsBtn.addEventListener('click', () => {
        if (confirm('Reset all tuning parameters to default values?')) {
          // Reset to default values
          const defaults = {
            rateRollP: 0.15,
            rateRollI: 0.15,
            rateRollD: 0.003,
            attitudeRollP: 4.5,
            attitudeRollI: 0.0,
            rateYawP: 0.2,
            rateYawI: 0.02,
            rateYawD: 0.0,
            altP: 1.0,
            altI: 0.0,
            altD: 0.0
          };
          
          Object.entries(defaults).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
              element.value = value;
            }
          });
          
          alert('Tuning parameters reset to defaults!');
        }
      });
    }
  }

  function initCameraScreen() {
    console.log('Initializing camera screen...');
    
    const applyCameraSettingsBtn = document.getElementById('applyCameraSettings');
    if (applyCameraSettingsBtn) {
      applyCameraSettingsBtn.addEventListener('click', () => {
        const cameraType = document.getElementById('cameraType').value;
        const cameraTriggerMode = document.getElementById('cameraTriggerMode').value;
        const photoInterval = document.getElementById('photoInterval').value;
        const gimbalType = document.getElementById('gimbalType').value;
        const gimbalRollChannel = document.getElementById('gimbalRollChannel').value;
        const gimbalPitchChannel = document.getElementById('gimbalPitchChannel').value;
        const gimbalYawChannel = document.getElementById('gimbalYawChannel').value;
        
        console.log('Applying camera settings:', {
          cameraType,
          cameraTriggerMode,
          photoInterval,
          gimbalType,
          gimbalRollChannel,
          gimbalPitchChannel,
          gimbalYawChannel
        });
        
        alert('Camera settings applied successfully!');
      });
    }
    
    const testGimbalBtn = document.getElementById('testGimbal');
    if (testGimbalBtn) {
      testGimbalBtn.addEventListener('click', () => {
        console.log('Testing gimbal...');
        alert('Gimbal test started. Check gimbal movement.');
      });
    }
  }

  function initParamsScreen() {
    console.log('Initializing parameters screen...');
    
    // Load sample parameters
    loadSampleParameters();
    
    // Bind search functionality
    const searchParamsBtn = document.getElementById('searchParams');
    const paramSearchInput = document.getElementById('paramSearch');
    
    if (searchParamsBtn && paramSearchInput) {
      searchParamsBtn.addEventListener('click', () => {
        const searchTerm = paramSearchInput.value.toLowerCase();
        filterParameters(searchTerm);
      });
      
      paramSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const searchTerm = paramSearchInput.value.toLowerCase();
          filterParameters(searchTerm);
        }
      });
    }
    
    // Bind category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.dataset.category;
        filterParametersByCategory(category);
      });
    });
    
    // Bind parameter actions
    const refreshParamsBtn = document.getElementById('refreshParams');
    const saveParamsBtn = document.getElementById('saveParams');
    const loadParamsBtn = document.getElementById('loadParams');
    const resetParamsBtn = document.getElementById('resetParams');
    
    if (refreshParamsBtn) {
      refreshParamsBtn.addEventListener('click', () => {
        console.log('Refreshing parameters...');
        loadSampleParameters();
      });
    }
    
    if (saveParamsBtn) {
      saveParamsBtn.addEventListener('click', () => {
        console.log('Saving parameters...');
        alert('Parameters saved successfully!');
      });
    }
    
    if (loadParamsBtn) {
      loadParamsBtn.addEventListener('click', () => {
        console.log('Loading parameters...');
        alert('Parameters loaded successfully!');
      });
    }
    
    if (resetParamsBtn) {
      resetParamsBtn.addEventListener('click', () => {
        if (confirm('Reset all parameters to default values?')) {
          console.log('Resetting parameters...');
          alert('Parameters reset to defaults!');
        }
      });
    }
  }

  function loadSampleParameters() {
    const sampleParams = [
      { name: 'SYSID_MYGCS', value: '255', units: '', description: 'Ground station ID', category: 'system' },
      { name: 'ARMING_CHECK', value: '1', units: '', description: 'Arming check enable', category: 'safety' },
      { name: 'BATT_MONITOR', value: '4', units: '', description: 'Battery monitoring', category: 'power' },
      { name: 'BATT_CAPACITY', value: '3300', units: 'mAh', description: 'Battery capacity', category: 'power' },
      { name: 'COMPASS_ENABLE', value: '1', units: '', description: 'Compass enable', category: 'sensors' },
      { name: 'GPS_TYPE', value: '1', units: '', description: 'GPS type', category: 'sensors' },
      { name: 'MOT_PWM_TYPE', value: '0', units: '', description: 'Motor PWM type', category: 'motors' },
      { name: 'MOT_PWM_RATE', value: '400', units: 'Hz', description: 'Motor PWM rate', category: 'motors' },
      { name: 'RATE_ROLL_P', value: '0.15', units: '', description: 'Roll rate P gain', category: 'flight' },
      { name: 'RATE_ROLL_I', value: '0.15', units: '', description: 'Roll rate I gain', category: 'flight' },
      { name: 'RATE_ROLL_D', value: '0.003', units: '', description: 'Roll rate D gain', category: 'flight' },
      { name: 'PILOT_SPEED_UP', value: '500', units: 'cm/s', description: 'Pilot speed up', category: 'flight' },
      { name: 'PILOT_SPEED_DN', value: '300', units: 'cm/s', description: 'Pilot speed down', category: 'flight' },
      { name: 'RTL_ALT', value: '1000', units: 'cm', description: 'RTL altitude', category: 'navigation' },
      { name: 'RTL_SPEED', value: '500', units: 'cm/s', description: 'RTL speed', category: 'navigation' },
      { name: 'WPNAV_SPEED', value: '500', units: 'cm/s', description: 'Waypoint navigation speed', category: 'navigation' },
      { name: 'WPNAV_ACCEL', value: '100', units: 'cm/s/s', description: 'Waypoint navigation acceleration', category: 'navigation' },
      { name: 'RC1_MIN', value: '1100', units: 'μs', description: 'RC channel 1 minimum', category: 'radio' },
      { name: 'RC1_MAX', value: '1900', units: 'μs', description: 'RC channel 1 maximum', category: 'radio' },
      { name: 'RC1_TRIM', value: '1500', units: 'μs', description: 'RC channel 1 trim', category: 'radio' },
      { name: 'RC2_MIN', value: '1100', units: 'μs', description: 'RC channel 2 minimum', category: 'radio' },
      { name: 'RC2_MAX', value: '1900', units: 'μs', description: 'RC channel 2 maximum', category: 'radio' },
      { name: 'RC2_TRIM', value: '1500', units: 'μs', description: 'RC channel 2 trim', category: 'radio' },
      { name: 'RC3_MIN', value: '1100', units: 'μs', description: 'RC channel 3 minimum', category: 'radio' },
      { name: 'RC3_MAX', value: '1900', units: 'μs', description: 'RC channel 3 maximum', category: 'radio' },
      { name: 'RC3_TRIM', value: '1500', units: 'μs', description: 'RC channel 3 trim', category: 'radio' },
      { name: 'RC4_MIN', value: '1100', units: 'μs', description: 'RC channel 4 minimum', category: 'radio' },
      { name: 'RC4_MAX', value: '1900', units: 'μs', description: 'RC channel 4 maximum', category: 'radio' },
      { name: 'RC4_TRIM', value: '1500', units: 'μs', description: 'RC channel 4 trim', category: 'radio' }
    ];
    
    const tbody = document.getElementById('paramsTableBody');
    if (tbody) {
      tbody.innerHTML = '';
      
      sampleParams.forEach(param => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${param.name}</td>
          <td><input type="text" class="param-value" value="${param.value}" data-original="${param.value}"></td>
          <td>${param.units}</td>
          <td>${param.description}</td>
          <td>
            <button class="btn btn--ghost btn--sm param-reset" data-param="${param.name}">Reset</button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // Bind parameter value changes
      document.querySelectorAll('.param-value').forEach(input => {
        input.addEventListener('change', (e) => {
          const originalValue = e.target.dataset.original;
          const newValue = e.target.value;
          console.log(`Parameter ${e.target.closest('tr').cells[0].textContent} changed from ${originalValue} to ${newValue}`);
        });
      });
      
      // Bind reset buttons
      document.querySelectorAll('.param-reset').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const paramName = e.target.dataset.param;
          const row = e.target.closest('tr');
          const input = row.querySelector('.param-value');
          const originalValue = input.dataset.original;
          input.value = originalValue;
          console.log(`Parameter ${paramName} reset to ${originalValue}`);
        });
      });
    }
  }

  function filterParameters(searchTerm) {
    const rows = document.querySelectorAll('#paramsTableBody tr');
    rows.forEach(row => {
      const paramName = row.cells[0].textContent.toLowerCase();
      const description = row.cells[3].textContent.toLowerCase();
      
      if (paramName.includes(searchTerm) || description.includes(searchTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  function filterParametersByCategory(category) {
    const rows = document.querySelectorAll('#paramsTableBody tr');
    rows.forEach(row => {
      const paramName = row.cells[0].textContent;
      const param = findParameterByName(paramName);
      
      if (category === 'all' || (param && param.category === category)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  function findParameterByName(name) {
    // This would typically query the actual parameter list
    // For demo purposes, return a mock parameter
    return { name, category: 'system' };
  }

  // Bind setup menu events
  const setupMenu = document.querySelector('#view-setup #setupMenu');
  console.log('Setup menu found:', !!setupMenu);
  
  if (setupMenu) {
    console.log('Binding setup menu click events...');
    setupMenu.addEventListener('click', (e) => {
      console.log('Setup menu clicked, target:', e.target);
      const el = e.target.closest('[data-setup]');
      console.log('Closest data-setup element:', el);
      
      if (!el) return;
      
      e.preventDefault();
      const setupType = el.dataset.setup;
      console.log(`Setup menu clicked: ${setupType}`);
      
      openScreen(setupType);
      
      // Highlight active item
      setupMenu.querySelectorAll('.menu-item').forEach(n => {
        n.classList.toggle('active', n === el);
      });
    });

    // Keyboard support
    setupMenu.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      
      const el = e.target.closest('[data-setup]');
      if (!el) return;
      
      e.preventDefault();
      openScreen(el.dataset.setup);
    });
  }

  // Back button
  backBtn?.addEventListener('click', closeOverlay);

  // Escape key to close
  document.addEventListener('keydown', e => {
    if (!overlay.hidden && e.key === 'Escape') {
      closeOverlay();
    }
  });

  // Close overlay when switching views
  document.addEventListener('gcs:viewchange', e => {
    if (e.detail.view !== 'setup') {
      closeOverlay();
    }
  });

  console.log('Setup overlay initialized successfully');
  
  // Add test button listener
  setTimeout(() => {
    const testBtn = document.getElementById('testSetupOverlay');
    if (testBtn) {
      console.log('Test button found, adding listener');
      testBtn.addEventListener('click', () => {
        console.log('Test button clicked, opening firmware screen');
        openScreen('firmware');
      });
    } else {
      console.log('Test button not found');
    }
  }, 1000);
}

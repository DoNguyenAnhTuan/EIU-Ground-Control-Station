// js/ui/settings.js - Settings overlay management
export function initSettingsOverlay(bridge) {
  console.log('initSettingsOverlay called with bridge:', bridge);
  
  // Prevent multiple initializations
  if (window.settingsOverlayInitialized) {
    console.log('Settings overlay already initialized, skipping...');
    return;
  }
  
  const overlay = document.getElementById('settingsFull');
  const backBtn = document.getElementById('settingsBack');
  const titleEl = document.getElementById('settingsTitle');

  console.log('Settings elements found:', {
    overlay: !!overlay,
    backBtn: !!backBtn,
    titleEl: !!titleEl
  });

  const titleMap = {
    general: 'General Settings',
    commlinks: 'Communication Links',
    offline: 'Offline Maps',
    mavlink: 'MAVLink Settings',
    console: 'Console Logging'
  };

  let currentScreen = 'general';

  function openScreen(key) {
    console.log(`Opening settings screen: ${key}`);
    
    // Hide all screens
    const allScreens = document.querySelectorAll('.settings-screen');
    console.log(`Found ${allScreens.length} settings screens`);
    allScreens.forEach(s => s.hidden = true);
    
    // Show selected screen
    const pane = document.getElementById(`settings-screen-${key}`);
    console.log(`Looking for screen: settings-screen-${key}, found:`, !!pane);
    
    if (!pane) {
      console.error(`Settings screen not found: ${key}`);
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
      console.log('Settings overlay shown, body class added');
    } else {
      console.error('Settings overlay element not found!');
    }
    
    // Initialize screen-specific logic
    initScreenLogic(key);
  }

  function closeOverlay() {
    console.log('Closing settings overlay');
    if (overlay) {
      overlay.hidden = true;
      document.body.classList.remove('overlay-open');
    }
    currentScreen = 'general';
  }

  function initScreenLogic(screenName) {
    switch (screenName) {
      case 'general':
        initGeneralScreen();
        break;
      case 'commlinks':
        initCommLinksScreen();
        break;
      case 'offline':
        initOfflineScreen();
        break;
      case 'mavlink':
        initMavlinkScreen();
        break;
      case 'console':
        initConsoleScreen();
        break;
      default:
        console.log(`No specific logic for screen: ${screenName}`);
        break;
    }
  }

  function initGeneralScreen() {
    console.log('Initializing general settings screen...');
    
    // Load saved settings
    loadGeneralSettings();
    
    // Bind UI scaling range
    const uiScaling = document.getElementById('uiScaling');
    const uiScalingValue = document.getElementById('uiScalingValue');
    if (uiScaling && uiScalingValue) {
      uiScaling.addEventListener('input', (e) => {
        uiScalingValue.textContent = `${e.target.value}%`;
        // Apply UI scaling
        document.documentElement.style.setProperty('--ui-scale', `${e.target.value / 100}`);
      });
    }
    
    // Bind save base position button
    const saveBaseBtn = document.getElementById('saveBasePosition');
    if (saveBaseBtn) {
      saveBaseBtn.addEventListener('click', () => {
        console.log('Saving current base position...');
        // This would typically get current GPS position
        alert('Base position saved from current GPS location');
      });
    }
    
    // Bind reset brand image button
    const resetBrandBtn = document.getElementById('resetBrandImage');
    if (resetBrandBtn) {
      resetBrandBtn.addEventListener('click', () => {
        console.log('Resetting brand image...');
        document.getElementById('indoorImage').value = '';
        document.getElementById('outdoorImage').value = '';
        alert('Brand image reset to default');
      });
    }
    
    // Auto-save settings on change
    const generalInputs = document.querySelectorAll('#settings-screen-general input, #settings-screen-general select');
    generalInputs.forEach(input => {
      input.addEventListener('change', saveGeneralSettings);
    });
  }

  function initCommLinksScreen() {
    console.log('Initializing comm links screen...');
    
    // Load saved comm link settings
    loadCommLinkSettings();
    
    // Auto-save settings on change
    const commInputs = document.querySelectorAll('#settings-screen-commlinks input, #settings-screen-commlinks select');
    commInputs.forEach(input => {
      input.addEventListener('change', saveCommLinkSettings);
    });
  }

  function initOfflineScreen() {
    console.log('Initializing offline maps screen...');
    
    // Load saved offline settings
    loadOfflineSettings();
    
    // Bind add offline set button
    const addOfflineBtn = document.getElementById('addOfflineSet');
    if (addOfflineBtn) {
      addOfflineBtn.addEventListener('click', () => {
        console.log('Adding new offline map set...');
        alert('Offline map set creation would open map interface');
      });
    }
    
    // Auto-save settings on change
    const offlineInputs = document.querySelectorAll('#settings-screen-offline input, #settings-screen-offline select');
    offlineInputs.forEach(input => {
      input.addEventListener('change', saveOfflineSettings);
    });
  }

  function initMavlinkScreen() {
    console.log('Initializing MAVLink screen...');
    
    // Load saved MAVLink settings
    loadMavlinkSettings();
    
    // Update connection status
    updateConnectionStatus();
    
    // Bind refresh logs button
    const refreshLogsBtn = document.getElementById('refreshLogs');
    if (refreshLogsBtn) {
      refreshLogsBtn.addEventListener('click', refreshLogFiles);
    }
    
    // Bind upload selected logs button
    const uploadLogsBtn = document.getElementById('uploadSelectedLogs');
    if (uploadLogsBtn) {
      uploadLogsBtn.addEventListener('click', uploadSelectedLogs);
    }
    
    // Bind delete selected logs button
    const deleteLogsBtn = document.getElementById('deleteSelectedLogs');
    if (deleteLogsBtn) {
      deleteLogsBtn.addEventListener('click', deleteSelectedLogs);
    }
    
    // Auto-save settings on change
    const mavlinkInputs = document.querySelectorAll('#settings-screen-mavlink input, #settings-screen-mavlink select, #settings-screen-mavlink textarea');
    mavlinkInputs.forEach(input => {
      input.addEventListener('change', saveMavlinkSettings);
    });
  }

  function initConsoleScreen() {
    console.log('Initializing console screen...');
    
    // Load saved console settings
    loadConsoleSettings();
    
    // Bind set logging button
    const setLoggingBtn = document.getElementById('setLogging');
    if (setLoggingBtn) {
      setLoggingBtn.addEventListener('click', toggleConsoleLogging);
    }
    
    // Bind clear console button
    const clearConsoleBtn = document.getElementById('clearConsole');
    if (clearConsoleBtn) {
      clearConsoleBtn.addEventListener('click', clearConsoleOutput);
    }
    
    // Auto-save settings on change
    const consoleInputs = document.querySelectorAll('#settings-screen-console input, #settings-screen-console select');
    consoleInputs.forEach(input => {
      input.addEventListener('change', saveConsoleSettings);
    });
  }

  // Settings loading functions
  function loadGeneralSettings() {
    console.log('Loading general settings...');
    // This would load from localStorage or backend
    const settings = {
      distanceUnit: 'meters',
      areaUnit: 'sqm',
      speedUnit: 'mps',
      tempUnit: 'celsius',
      language: 'system',
      colorScheme: 'indoor',
      mapProvider: 'google',
      mapType: 'road',
      uiScaling: 100,
      muteAudio: false,
      checkInternet: true,
      autoloadMissions: false,
      clearSettings: false,
      batteryAnnounce: 20,
      appPath: '/path/to/app/data'
    };
    
    // Apply settings to form
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else if (element.type === 'range') {
          element.value = settings[key];
          const valueDisplay = document.getElementById(`${key}Value`);
          if (valueDisplay) {
            valueDisplay.textContent = `${settings[key]}%`;
          }
        } else {
          element.value = settings[key];
        }
      }
    });
  }

  function loadCommLinkSettings() {
    console.log('Loading comm link settings...');
    const settings = {
      defaultConnection: 'serial',
      defaultBaudRate: '115200'
    };
    
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.value = settings[key];
      }
    });
  }

  function loadOfflineSettings() {
    console.log('Loading offline settings...');
    const settings = {
      defaultCacheSize: 1000,
      autoCleanupTiles: true
    };
    
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else {
          element.value = settings[key];
        }
      }
    });
  }

  function loadMavlinkSettings() {
    console.log('Loading MAVLink settings...');
    const settings = {
      mavlinkSystemId: 255,
      emitHeartbeat: true,
      onlyAcceptSameProtocol: true,
      enableMavlinkForwarding: false,
      forwardHost: '192.168.1.100',
      forwardPort: 14550,
      enableMavlinkLogging: false,
      autoStartLogging: false,
      logFilePath: '/path/to/logs',
      logUploadEmail: 'user@example.com',
      logDefaultDescription: 'Flight description',
      logUploadUrl: 'https://logs.px4.io',
      logWindSpeed: 'calm',
      logFlightRating: 'good',
      logPublic: false,
      logAutoUpload: false,
      logDeleteAfterUpload: false
    };
    
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else {
          element.value = settings[key];
        }
      }
    });
  }

  function loadConsoleSettings() {
    console.log('Loading console settings...');
    const settings = {
      logLevel: 'info',
      logToFile: false,
      consoleLogPath: '/path/to/console.log',
      logLinkManager: false,
      logMultiVehicle: false,
      logLinkManagerVerbose: false,
      logFirmwareUpgrade: false,
      logParameterManager: false,
      logPlanManager: false,
      logMissionManager: false,
      logGeoFenceManager: false,
      logRallyPointManager: false,
      logRadioComponent: false
    };
    
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else {
          element.value = settings[key];
        }
      }
    });
  }

  // Settings saving functions
  function saveGeneralSettings() {
    console.log('Saving general settings...');
    const settings = {};
    
    const generalInputs = document.querySelectorAll('#settings-screen-general input, #settings-screen-general select');
    generalInputs.forEach(input => {
      if (input.type === 'checkbox') {
        settings[input.id] = input.checked;
      } else {
        settings[input.id] = input.value;
      }
    });
    
    // Save to localStorage or backend
    localStorage.setItem('generalSettings', JSON.stringify(settings));
    console.log('General settings saved:', settings);
  }

  function saveCommLinkSettings() {
    console.log('Saving comm link settings...');
    const settings = {};
    
    const commInputs = document.querySelectorAll('#settings-screen-commlinks input, #settings-screen-commlinks select');
    commInputs.forEach(input => {
      settings[input.id] = input.value;
    });
    
    localStorage.setItem('commLinkSettings', JSON.stringify(settings));
  }

  function saveOfflineSettings() {
    console.log('Saving offline settings...');
    const settings = {};
    
    const offlineInputs = document.querySelectorAll('#settings-screen-offline input, #settings-screen-offline select');
    offlineInputs.forEach(input => {
      if (input.type === 'checkbox') {
        settings[input.id] = input.checked;
      } else {
        settings[input.id] = input.value;
      }
    });
    
    localStorage.setItem('offlineSettings', JSON.stringify(settings));
  }

  function saveMavlinkSettings() {
    console.log('Saving MAVLink settings...');
    const settings = {};
    
    const mavlinkInputs = document.querySelectorAll('#settings-screen-mavlink input, #settings-screen-mavlink select, #settings-screen-mavlink textarea');
    mavlinkInputs.forEach(input => {
      if (input.type === 'checkbox') {
        settings[input.id] = input.checked;
      } else {
        settings[input.id] = input.value;
      }
    });
    
    localStorage.setItem('mavlinkSettings', JSON.stringify(settings));
  }

  function saveConsoleSettings() {
    console.log('Saving console settings...');
    const settings = {};
    
    const consoleInputs = document.querySelectorAll('#settings-screen-console input, #settings-screen-console select');
    consoleInputs.forEach(input => {
      if (input.type === 'checkbox') {
        settings[input.id] = input.checked;
      } else {
        settings[input.id] = input.value;
      }
    });
    
    localStorage.setItem('consoleSettings', JSON.stringify(settings));
  }

  // MAVLink specific functions
  function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    const messageRateEl = document.getElementById('messageRate');
    const lossRateEl = document.getElementById('lossRate');
    
    if (statusEl) {
      // Demo: simulate connection status
      const isConnected = Math.random() > 0.5;
      statusEl.textContent = isConnected ? 'Connected' : 'Disconnected';
      statusEl.className = `status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
    }
    
    if (messageRateEl) {
      messageRateEl.textContent = `${Math.floor(Math.random() * 50 + 10)} Hz`;
    }
    
    if (lossRateEl) {
      lossRateEl.textContent = `${(Math.random() * 5).toFixed(1)}%`;
    }
  }

  function refreshLogFiles() {
    console.log('Refreshing log files...');
    const logFilesList = document.getElementById('logFilesList');
    if (logFilesList) {
      // Demo: show some mock log files
      logFilesList.innerHTML = `
        <div style="margin-bottom: 8px;">
          <input type="checkbox" id="log1"> 
          <label for="log1">flight_2024_01_15_14_30_22.ulg (2.3 MB)</label>
        </div>
        <div style="margin-bottom: 8px;">
          <input type="checkbox" id="log2"> 
          <label for="log2">flight_2024_01_15_13_45_10.ulg (1.8 MB)</label>
        </div>
        <div style="margin-bottom: 8px;">
          <input type="checkbox" id="log3"> 
          <label for="log3">flight_2024_01_15_12_20_05.ulg (3.1 MB)</label>
        </div>
      `;
    }
  }

  function uploadSelectedLogs() {
    console.log('Uploading selected logs...');
    const selectedLogs = document.querySelectorAll('#logFilesList input[type="checkbox"]:checked');
    if (selectedLogs.length > 0) {
      alert(`Uploading ${selectedLogs.length} log file(s) to Flight Review...`);
    } else {
      alert('Please select log files to upload');
    }
  }

  function deleteSelectedLogs() {
    console.log('Deleting selected logs...');
    const selectedLogs = document.querySelectorAll('#logFilesList input[type="checkbox"]:checked');
    if (selectedLogs.length > 0) {
      if (confirm(`Are you sure you want to delete ${selectedLogs.length} log file(s)?`)) {
        alert('Log files deleted');
        refreshLogFiles();
      }
    } else {
      alert('Please select log files to delete');
    }
  }

  // Console specific functions
  function toggleConsoleLogging() {
    console.log('Toggling console logging...');
    const setLoggingBtn = document.getElementById('setLogging');
    const isLogging = setLoggingBtn.textContent === 'Stop Logging';
    
    if (isLogging) {
      setLoggingBtn.textContent = 'Set Logging';
      addConsoleLine('Console logging stopped', 'info');
    } else {
      setLoggingBtn.textContent = 'Stop Logging';
      addConsoleLine('Console logging started', 'info');
      addConsoleLine('LinkManagerLog: Debug connection problems', 'debug');
      addConsoleLine('MultiVehicleManagerLog: Vehicle management active', 'debug');
    }
  }

  function clearConsoleOutput() {
    console.log('Clearing console output...');
    const consoleOutput = document.getElementById('consoleOutput');
    if (consoleOutput) {
      consoleOutput.innerHTML = '<div class="console-line">Console cleared.</div>';
    }
  }

  function addConsoleLine(message, type = 'info') {
    const consoleOutput = document.getElementById('consoleOutput');
    if (consoleOutput) {
      const line = document.createElement('div');
      line.className = `console-line ${type}`;
      line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      consoleOutput.appendChild(line);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
  }

  // Bind settings menu events
  const settingsMenu = document.querySelector('#view-settings #settingsMenu');
  console.log('Settings menu found:', !!settingsMenu);
  
  if (settingsMenu) {
    console.log('Binding settings menu click events...');
    settingsMenu.addEventListener('click', (e) => {
      console.log('Settings menu clicked, target:', e.target);
      const el = e.target.closest('[data-setting]');
      console.log('Closest data-setting element:', el);
      
      if (!el) return;
      
      e.preventDefault();
      const settingType = el.dataset.setting;
      console.log(`Settings menu clicked: ${settingType}`);
      
      openScreen(settingType);
      
      // Highlight active item
      settingsMenu.querySelectorAll('.menu-item').forEach(n => {
        n.classList.toggle('active', n === el);
      });
    });
  }

  // Bind back button and escape key
  if (backBtn) {
    backBtn.addEventListener('click', closeOverlay);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) {
      closeOverlay();
    }
  });

  console.log('Settings overlay initialized successfully');
  
  // Add test button listener
  setTimeout(() => {
    const testBtn = document.getElementById('testSettingsOverlay');
    if (testBtn) {
      console.log('Test button found, adding listener');
      testBtn.addEventListener('click', () => {
        console.log('Test button clicked, opening general screen');
        openScreen('general');
      });
    } else {
      console.log('Test button not found');
    }
  }, 1000);
  
  // Mark as initialized
  window.settingsOverlayInitialized = true;
}

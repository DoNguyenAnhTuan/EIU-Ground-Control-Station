// main.js
import { getAzureKey, ORIGIN } from "./config.js";
import { initBridge } from "./bridge.js";
import { initMap, addHtmlMarker, setStyle, cameraTo } from "./map-core.js";
import { initViewManager } from "./view-manager.js";
import * as tel from "./telemetry.js";
import * as mission from "./mission.js";
import { enuToLatLon, llDistanceMeters, rafThrottle } from "./utils.js";
import { initSetupOverlay } from "./ui/setup.js";
import { initSettingsOverlay } from "./ui/settings.js";

let bridge = null;
let droneMarker = null, droneEl = null, lastLL = null;
let viewManager = null;
let map = null;

function getOrCreateDroneMarker(){
  if (droneMarker) return droneMarker;
  const c = document.createElement('div');
  c.style.position = 'relative';
  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 40 40");
  svg.style.width = "28px";
  svg.style.height = "28px";
  svg.innerHTML = `
    <g class="drone-arrow" transform="rotate(0 20 20)">
      <polygon points="20,3 25,17 20,14 15,17" fill="#1abc9c"/>
      <circle cx="20" cy="20" r="6" fill="#ffffff" opacity=".9"/>
    </g>`;
  c.appendChild(svg);
  droneEl = c;
  droneMarker = addHtmlMarker([ORIGIN.lon, ORIGIN.lat], c);
  return droneMarker;
}

const updateDroneLocal = rafThrottle(()=>{
  const m = getOrCreateDroneMarker();
  const next = enuToLatLon(
    mission.state.lastLocal.x,
    mission.state.lastLocal.y,
    mission.state.lastLocal.z,
    ORIGIN.lat, ORIGIN.lon
  );
  if (lastLL && llDistanceMeters(lastLL, next) < 0.5) return;
  lastLL = next;
  m.setOptions({ position: next });
  if (droneEl){
    const L = mission.state.lastLocal;
    droneEl.title = `LOCAL\nx:${L.x.toFixed(2)} y:${L.y.toFixed(2)} z:${L.z.toFixed(2)}`;
  }
});

const updateDroneGPS = rafThrottle(()=>{
  const m = getOrCreateDroneMarker();
  const next = [mission.state.lastGPS.lon, mission.state.lastGPS.lat];
  if (lastLL && llDistanceMeters(lastLL, next) < 0.5) return;
  lastLL = next;
  m.setOptions({ position: next });
  if (droneEl){
    const G = mission.state.lastGPS;
    droneEl.title = `GPS\nlat:${G.lat.toFixed(6)} lon:${G.lon.toFixed(6)} alt:${G.alt.toFixed(1)}`;
  }
});

// Sidebar collapse functionality
function initSidebarCollapse() {
  console.log('Initializing sidebar collapse...');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      
      // Update button icon
      const icon = sidebarToggle.querySelector('svg');
      if (sidebar.classList.contains('collapsed')) {
        icon.innerHTML = '<path d="M9 18l6-6-6-6"/>'; // Right arrow
      } else {
        icon.innerHTML = '<path d="M15 18l-6-6 6-6"/>'; // Left arrow
      }
    });
    console.log('Sidebar collapse initialized successfully');
  } else {
    console.warn('Sidebar elements not found');
  }
}

// Map click event for adding waypoints
function initMapClickEvents() {
  if (map) {
    console.log('Initializing map click events...');
    
    // Add click event listener to the map
    map.events.add('click', (e) => {
      console.log('Map clicked!');
      
      // Check if we're in Plan view
      if (viewManager && viewManager.getCurrentView() === 'plan') {
        const position = e.position;
        const lat = position[1];
        const lon = position[0];
        
        console.log(`Map clicked at: ${lat}, ${lon}`);
        
        // Add waypoint to mission if available
        if (mission && mission.addWaypoint) {
          mission.addWaypoint(lat, lon, 3.5); // Default altitude 3.5m
        } else if (mission && mission.addMarkerAndStep) {
          // Fallback to old method
          mission.addMarkerAndStep([lon, lat]);
        }
        
        // Show feedback
        showMapClickFeedback(lat, lon);
        
        // Update waypoint count
        updateWaypointCount();
      } else {
        console.log('Not in Plan view, ignoring map click');
      }
    });
    
    console.log('Map click events initialized successfully');
  } else {
    console.warn('Map not available for click events');
  }
}

// Show feedback when clicking on map
function showMapClickFeedback(lat, lon) {
  try {
    // Create temporary marker
    const marker = addHtmlMarker([lon, lat], createWaypointMarker());
    
    // Remove after 2 seconds
    setTimeout(() => {
      if (marker && map && map.markers) {
        map.markers.remove(marker);
      }
    }, 2000);
    
    console.log('Waypoint marker added temporarily');
  } catch (error) {
    console.error('Error showing map click feedback:', error);
  }
}

// Create waypoint marker element
function createWaypointMarker() {
  const div = document.createElement('div');
  div.className = 'waypoint-marker';
  div.innerHTML = `
    <div class="waypoint-icon">📍</div>
    <div class="waypoint-label">New</div>
  `;
  return div;
}

// Update waypoint count display
function updateWaypointCount() {
  try {
    const countElement = document.getElementById('waypointCount');
    if (countElement) {
      // Try to get count from mission state
      let count = 0;
      if (mission && mission.state) {
        if (mission.state.waypoints) {
          count = mission.state.waypoints.length;
        } else if (mission.state.steps) {
          count = mission.state.steps.length;
        } else if (mission.state.markers) {
          count = mission.state.markers.length;
        }
      }
      countElement.textContent = `${count} waypoint${count !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error updating waypoint count:', error);
  }
}

// Update position fields in Fly view
function updatePositionFields() {
  const xVal = document.getElementById('xVal');
  const yVal = document.getElementById('yVal');
  const zVal = document.getElementById('zVal');
  
  if (xVal && yVal && zVal) {
    if (mission.state.lastLocal) {
      xVal.value = mission.state.lastLocal.x.toFixed(2);
      yVal.value = mission.state.lastLocal.y.toFixed(2);
      zVal.value = mission.state.lastLocal.z.toFixed(2);
    } else if (mission.state.lastGPS) {
      xVal.value = mission.state.lastGPS.lat.toFixed(6);
      yVal.value = mission.state.lastGPS.lon.toFixed(6);
      zVal.value = mission.state.lastGPS.alt.toFixed(2);
    }
  }
}

// Wire UI events
function wireUI(mapInstance) {
  console.log('Wiring UI events...');
  map = mapInstance;
  
  // Initialize sidebar collapse
  initSidebarCollapse();
  
  // Initialize map click events
  initMapClickEvents();
  
  // Style selector
  const styleSelector = document.getElementById('styleSelector');
  if (styleSelector) {
    styleSelector.addEventListener('change', (e) => {
      if (setStyle) setStyle(e.target.value);
    });
    console.log('Style selector wired');
  }
  
  // Coordinate input
  const coordInput = document.getElementById('coordInput');
  if (coordInput) {
    coordInput.addEventListener('change', (e) => {
      const value = e.target.value.trim();
      if (value) {
        const parts = value.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const lat = parseFloat(parts[0]);
          const lon = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lon)) {
            cameraTo([lon, lat], 15);
          }
        }
      }
    });
    
    coordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        coordInput.dispatchEvent(new Event('change'));
      }
    });
    console.log('Coordinate input wired');
  }
  
  // Map control buttons
  const centerBtn = document.getElementById('centerOnDroneBtn');
  if (centerBtn) {
    centerBtn.addEventListener('click', () => {
      if (droneMarker && map) {
        const pos = droneMarker.getOptions()?.position;
        if (pos && Array.isArray(pos)) {
          cameraTo(pos, Math.max(map.getCamera().zoom, 17));
        }
      }
    });
    console.log('Center on drone button wired');
  }
  
  const satelliteBtn = document.getElementById('satelliteBtn');
  if (satelliteBtn) {
    satelliteBtn.addEventListener('click', () => {
      if (setStyle) setStyle('satellite');
    });
    console.log('Satellite button wired');
  }
  
  console.log('UI events wired successfully');
}



// Main boot function
(async function boot(){
  console.log('Starting GCS application...');
  
  try {
    // 0) Khởi tạo View Manager
    console.log('Initializing View Manager...');
    viewManager = await initViewManager();
    console.log('View Manager initialized successfully:', viewManager);

    // 1) Bridge
    console.log('Initializing Bridge...');
    bridge = await initBridge({
      onLocal: (x,y,z)=>{
        mission.state.lastLocal = { x:+x, y:+y, z:+z };
        if (mission.state.currentMode === 'local') updateDroneLocal();
        updatePositionFields();
        const altTxt = mission.state.lastLocal?.z?.toFixed(2);
        tel.updateAlt(altTxt);
        document.getElementById('fiAlt')?.replaceChildren(altTxt ?? '—');
      },
      onGPS: (lat,lon,alt)=>{
        mission.state.lastGPS = { lat:+lat, lon:+lon, alt:+alt };
        if (mission.state.currentMode === 'gps') updateDroneGPS();
        updatePositionFields();
        const altTxt = mission.state.lastGPS?.alt?.toFixed(2);
        tel.updateAlt(altTxt);
        document.getElementById('fiAlt')?.replaceChildren(altTxt ?? '—');
        const fiGps = document.getElementById('fiGps');
        if (fiGps) fiGps.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      },
      onBattery: (v)=>{ 
        tel.updateBattery(v); 
        document.getElementById('fiBatt')?.replaceChildren(v ?? '—'); 
      },
      onSpeed: (v)=>{ 
        tel.updateSpeed(v);   
        document.getElementById('fiSpd')?.replaceChildren(v ?? '—'); 
      },
      onMode: (mode)=>{ 
        document.getElementById('hudMode')?.replaceChildren(mode);
        document.getElementById('fiMode')?.replaceChildren(mode); 
      },
      onLink: tel.setConnected
    });
    console.log('Bridge initialized successfully');

    // 2) Map
    console.log('Initializing Map...');
    const key = await getAzureKey();
    const mapInstance = await initMap(key);
    console.log('Map initialized successfully');

    // 3) UI wires
    console.log('Wiring UI...');
    wireUI(mapInstance);
    
    if (mission && mission.bindMapInteractions) {
      mission.bindMapInteractions();
    }
    
    if (initSetupOverlay) {
      console.log('Initializing setup overlay...');
      try {
        initSetupOverlay(bridge);
        console.log('Setup overlay initialized successfully');
        // Expose to global scope for view manager
        window.initSetupOverlay = initSetupOverlay;
      } catch (error) {
        console.error('Error initializing setup overlay:', error);
      }
    } else {
      console.warn('initSetupOverlay function not found');
    }

    if (initSettingsOverlay) {
      console.log('Initializing settings overlay...');
      try {
        initSettingsOverlay(bridge);
        console.log('Settings overlay initialized successfully');
        // Expose to global scope for view manager
        window.initSettingsOverlay = initSettingsOverlay;
      } catch (error) {
        console.error('Error initializing settings overlay:', error);
      }
    } else {
      console.warn('initSettingsOverlay function not found');
    }
    
    console.log('GCS application started successfully!');
    
    // Initialize flight widgets
    initFlightWidgets();
    
  } catch (error) {
    console.error('Failed to start GCS application:', error);
  }
})();

// Flight Widgets Management
function initFlightWidgets() {
  console.log('Initializing flight widgets...');
  
  // Update Flight Widgets
  function updateFlightWidgets() {
    // Update speed widget
    const speedValue = document.getElementById('speedValue');
    if (speedValue) {
      const speed = Math.random() * 15 + 2; // Demo speed 2-17 m/s
      speedValue.textContent = speed.toFixed(1);
    }

    // Update altitude widget
    const altitudeValue = document.getElementById('altitudeValue');
    if (altitudeValue) {
      const altitude = Math.random() * 100 + 25; // Demo altitude 25-125m
      altitudeValue.textContent = altitude.toFixed(1);
    }

    // Update compass widget
    const compassNeedle = document.getElementById('compassNeedle');
    const headingValue = document.getElementById('headingValue');
    if (compassNeedle && headingValue) {
      const heading = Math.random() * 360; // Demo heading 0-360°
      compassNeedle.style.transform = `translateX(-50%) rotate(${heading}deg)`;
      headingValue.textContent = `${Math.round(heading)}°`;
    }

    // Update battery widget
    const batteryFill = document.getElementById('batteryFill');
    const batteryValue = document.getElementById('batteryValue');
    if (batteryFill && batteryValue) {
      const battery = Math.random() * 40 + 60; // Demo battery 60-100%
      batteryFill.style.width = `${battery}%`;
      batteryValue.textContent = `${Math.round(battery)}%`;
    }
  }

  // Start updating widgets every second
  setInterval(updateFlightWidgets, 1000);
  
  // Initial update
  updateFlightWidgets();
  
  console.log('Flight widgets initialized successfully');
}

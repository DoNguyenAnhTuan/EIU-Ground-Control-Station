// main.js - Main application logic
import { ViewManager } from './view-manager.js';
import { Bridge } from './bridge.js';

// Global variables
let viewManager;
let bridge;
let map;
let mission = null;
let waypoints = [];
let waypointMarkers = [];

// Initialize the application
async function boot() {
  try {
    console.log('🚀 Starting GCS application...');
    
    // Initialize ViewManager first
    viewManager = new ViewManager();
    await viewManager.init();
    
    // Initialize Bridge
    bridge = new Bridge();
    await bridge.init();
    
    // Initialize map
    await initMap();
    
    // Initialize UI events
    initUIEvents();
    
    // Initialize sidebar collapse
    initSidebarCollapse();
    
    // Initialize map click events
    initMapClickEvents();
    
    console.log('✅ GCS application started successfully!');
    
  } catch (error) {
    console.error('❌ Failed to start GCS application:', error);
  }
}

// Initialize map
async function initMap() {
  try {
    // Wait for Azure Maps to load
    await new Promise(resolve => {
      if (window.atlas) {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });

    // Get map key from bridge
    const mapKey = await bridge.getMapKey();
    
    // Initialize map
    map = new atlas.Map('myMap', {
      center: [106.6297, 10.8231], // Ho Chi Minh City
      zoom: 12,
      language: 'en-US',
      authOptions: {
        authType: 'subscription-key',
        subscriptionKey: mapKey
      }
    });

    // Add map controls
    map.controls.add([
      new atlas.control.ZoomControl(),
      new atlas.control.CompassControl(),
      new atlas.control.PitchControl(),
      new atlas.control.StyleControl()
    ], {
      position: 'top-right'
    });

    console.log('🗺️ Map initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize map:', error);
  }
}

// Initialize UI events
function initUIEvents() {
  console.log('🔌 Initializing UI events...');
  
  // Wire navigation buttons - FIXED CLICK FUNCTIONALITY
  const navButtons = document.querySelectorAll('.nav-btn');
  console.log(`Found ${navButtons.length} navigation buttons`);
  
  navButtons.forEach((btn, index) => {
    console.log(`Wiring button ${index + 1}: ${btn.getAttribute('data-view')}`);
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const view = btn.getAttribute('data-view');
      console.log(`Navigation button clicked: ${view}`);
      
      if (viewManager) {
        // Remove active class from all buttons
        navButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Toggle the view
        viewManager.toggleView(view);
        console.log(`View toggled to: ${view}`);
      } else {
        console.warn('ViewManager not available');
      }
    });
  });

  // Wire map control buttons
  const centerOnDroneBtn = document.getElementById('centerOnDroneBtn');
  if (centerOnDroneBtn) {
    centerOnDroneBtn.addEventListener('click', () => {
      if (map && bridge.dronePosition) {
        map.setCamera({
          center: [bridge.dronePosition.lng, bridge.dronePosition.lat],
          zoom: 16
        });
      }
    });
  }

  const satelliteBtn = document.getElementById('satelliteBtn');
  if (satelliteBtn) {
    satelliteBtn.addEventListener('click', () => {
      if (map) {
        const currentStyle = map.getStyle();
        const newStyle = currentStyle === 'satellite' ? 'road' : 'satellite';
        map.setStyle(newStyle);
      }
    });
  }

  // Wire Plan view specific buttons
  wirePlanViewButtons();
  
  console.log('✅ UI events initialized successfully');
}

// Wire Plan view specific buttons
function wirePlanViewButtons() {
  // Map style selector
  const mapStyleSelect = document.getElementById('mapStyle');
  if (mapStyleSelect) {
    mapStyleSelect.addEventListener('change', (e) => {
      if (map) {
        const style = e.target.value;
        map.setStyle(style);
        console.log(`Map style changed to: ${style}`);
      }
    });
  }

  // Coordinate input
  const coordInput = document.getElementById('coordInput');
  if (coordInput) {
    coordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = e.target.value.trim();
        if (value && map) {
          const parts = value.split(',').map(p => p.trim());
          if (parts.length >= 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              map.setCamera({
                center: [lng, lat],
                zoom: 15
              });
              console.log(`Map centered on: ${lat}, ${lng}`);
            }
          }
        }
      }
    });
  }

  // Plan tools buttons
  const polylineBtn = document.getElementById('polylineBtn');
  if (polylineBtn) {
    polylineBtn.addEventListener('click', () => {
      console.log('Polyline tool activated');
      // Add polyline drawing logic here
    });
  }

  const polygonBtn = document.getElementById('polygonBtn');
  if (polygonBtn) {
    polygonBtn.addEventListener('click', () => {
      console.log('Polygon tool activated');
      // Add polygon drawing logic here
    });
  }

  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      console.log('Clear all waypoints');
      clearAllWaypoints();
    });
  }

  const addWaypointBtn = document.getElementById('addWaypointBtn');
  if (addWaypointBtn) {
    addWaypointBtn.addEventListener('click', () => {
      console.log('Add waypoint button clicked');
      // This will be handled by map click events
    });
  }

  const uploadBtn = document.getElementById('uploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      console.log('Upload mission');
      // Add upload logic here
    });
  }

  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      console.log('Download mission');
      downloadMission();
    });
  }
}

// Initialize sidebar collapse
function initSidebarCollapse() {
  const sidebarToggle = document.getElementById('sidebarToggleCenter');
  const sidebar = document.getElementById('sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      
      // Update arrow direction
      const svg = sidebarToggle.querySelector('svg');
      if (svg) {
        if (sidebar.classList.contains('collapsed')) {
          svg.style.transform = 'rotate(180deg)';
        } else {
          svg.style.transform = 'rotate(0deg)';
        }
      }
    });
  }
}

// Initialize map click events for waypoints
function initMapClickEvents() {
  if (!map) return;
  
  map.events.add('click', (e) => {
    if (viewManager && viewManager.getCurrentView() === 'plan') {
      const position = e.position;
      const lngLat = map.pixelToPosition(position);
      
      if (mission && mission.addMarkerAndStep) {
        // Use mission system if available
        mission.addMarkerAndStep(lngLat[0], lngLat[1]);
      } else {
        // Fallback to direct waypoint addition
        addWaypoint(lngLat[0], lngLat[1]);
      }
      
      // Show feedback
      showMapClickFeedback(e.position);
      
      // Update waypoint count
      try {
        updateWaypointCount();
      } catch (error) {
        console.warn('Could not update waypoint count:', error);
      }
    }
  });
}

// Add waypoint
function addWaypoint(lng, lat) {
  const waypoint = {
    id: Date.now(),
    lng: lng,
    lat: lat,
    alt: 50 // Default altitude
  };
  
  waypoints.push(waypoint);
  
  // Create marker
  const marker = new atlas.HtmlMarker({
    htmlContent: createWaypointMarker(waypoint.id),
    position: [lng, lat]
  });
  
  map.markers.add(marker);
  waypointMarkers.push(marker);
  
  // Update table
  updateWaypointTable();
  
  console.log(`📍 Added waypoint: ${lng}, ${lat}`);
}

// Create waypoint marker HTML
function createWaypointMarker(id) {
  return `
    <div class="waypoint-marker" data-waypoint-id="${id}">
      <div class="waypoint-icon">📍</div>
      <div class="waypoint-label">WP</div>
    </div>
  `;
}

// Show map click feedback
function showMapClickFeedback(position) {
  try {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: absolute;
      left: ${position[0]}px;
      top: ${position[1]}px;
      width: 20px;
      height: 20px;
      background: #1abc9c;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      animation: clickFeedback 0.6s ease-out forwards;
    `;
    
    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 600);
    
  } catch (error) {
    console.warn('Could not show click feedback:', error);
  }
}

// Update waypoint count
function updateWaypointCount() {
  try {
    const waypointCount = document.querySelector('.waypoint-count');
    if (waypointCount) {
      waypointCount.textContent = `${waypoints.length} waypoint${waypoints.length !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.warn('Could not update waypoint count:', error);
  }
}

// Update waypoint table
function updateWaypointTable() {
  const tableBody = document.getElementById('waypointTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if (tableBody && emptyState) {
    if (waypoints.length === 0) {
      tableBody.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      tableBody.style.display = 'table-row-group';
      emptyState.style.display = 'none';
      
      // Clear existing rows
      tableBody.innerHTML = '';
      
      // Add waypoint rows
      waypoints.forEach((wp, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${wp.lat.toFixed(6)}</td>
          <td>${wp.lng.toFixed(6)}</td>
        `;
        tableBody.appendChild(row);
      });
    }
  }
}

// Clear all waypoints
function clearAllWaypoints() {
  waypoints = [];
  
  // Remove markers from map
  if (map && map.markers) {
    waypointMarkers.forEach(marker => {
      map.markers.remove(marker);
    });
  }
  waypointMarkers = [];
  
  // Update UI
  updateWaypointCount();
  updateWaypointTable();
  
  console.log('🗑️ All waypoints cleared');
}

// Download mission
function downloadMission() {
  if (waypoints.length === 0) {
    alert('No waypoints to download');
    return;
  }
  
  const missionData = {
    waypoints: waypoints,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(missionData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mission_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('📥 Mission downloaded');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

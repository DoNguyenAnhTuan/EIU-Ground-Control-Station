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
  // Wire navigation buttons
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (viewManager) {
        viewManager.toggleView(view);
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
      waypointCount.textContent = waypoints.length;
    }
  } catch (error) {
    console.warn('Could not update waypoint count:', error);
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

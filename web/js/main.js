// main.js
import { getAzureKey, ORIGIN } from "./config.js";
import { initBridge } from "./bridge.js";
import { initMap, addHtmlMarker, setStyle, cameraTo } from "./map-core.js";
import { initViewManager } from "./view-manager.js";
import * as tel from "./telemetry.js";
import * as mission from "./mission.js";
import { enuToLatLon, llDistanceMeters, rafThrottle } from "./utils.js";
import { initSetupOverlay } from "./ui/setup.js";

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
  }
}

// Map click event for adding waypoints
function initMapClickEvents() {
  if (map) {
    map.events.add('click', (e) => {
      // Check if we're in Plan view
      if (viewManager && viewManager.getCurrentView() === 'plan') {
        const position = e.position;
        const lat = position[1];
        const lon = position[0];
        
        console.log(`Map clicked at: ${lat}, ${lon}`);
        
        // Add waypoint to mission
        if (mission && mission.addWaypoint) {
          mission.addWaypoint(lat, lon, 3.5); // Default altitude 3.5m
        }
        
        // Show feedback
        showMapClickFeedback(lat, lon);
      }
    });
  }
}

// Show feedback when clicking on map
function showMapClickFeedback(lat, lon) {
  // Create temporary marker
  const marker = addHtmlMarker([lon, lat], createWaypointMarker());
  
  // Remove after 2 seconds
  setTimeout(() => {
    if (marker) {
      map.markers.remove(marker);
    }
  }, 2000);
  
  // Update waypoint count
  updateWaypointCount();
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
  const countElement = document.getElementById('waypointCount');
  if (countElement && mission && mission.state && mission.state.waypoints) {
    const count = mission.state.waypoints.length;
    countElement.textContent = `${count} waypoint${count !== 1 ? 's' : ''}`;
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
  map = mapInstance;
  
  // Initialize sidebar collapse
  initSidebarCollapse();
  
  // Initialize map click events
  initMapClickEvents();
  
  // style switch
  document.getElementById('styleSelector')?.addEventListener('change', (e)=> setStyle(e.target.value));
  document.getElementById('satelliteBtn')?.addEventListener('click', ()=> setStyle('satellite'));

  // coord input (chỉ cho Plan)
  const coord = document.getElementById('coordInput');
  coord?.addEventListener('change', ()=>{
    if (document.body?.dataset?.view !== 'plan') { alert('Open Plan first'); return; }
    const q=coord.value.trim(), re=/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    if(!re.test(q)) return alert('Vui lòng nhập: lat, lon');
    const [lat,lon]=q.split(',').map(parseFloat);
    mission.addMarkerAndStep([lon,lat]);
  });
  coord?.addEventListener('keydown', (e)=>{
    if (e.key==='Enter'){ e.preventDefault(); coord.dispatchEvent(new Event('change')); }
  });

  // connect / disconnect
  let isConnecting=false;
  document.getElementById('connectBtn')?.addEventListener('click', ()=>{
    if (isConnecting) return;
    if (bridge?.startConnection){ isConnecting=true; bridge.startConnection(); setTimeout(()=>isConnecting=false, 1500); }
    else alert('Không tìm thấy startConnection.');
  });
  document.getElementById('disconnectBtn')?.addEventListener('click', ()=>{
    if (bridge?.stopConnection){ bridge.stopConnection(); tel.setConnected(false); }
  });

  // position mode
  document.getElementById('posMode')?.addEventListener('change', (e)=>{
    mission.state.currentMode = e.target.value;
    if (mission.state.currentMode==='local' && mission.state.lastLocal) updateDroneLocal(map);
    if (mission.state.currentMode==='gps'   && mission.state.lastGPS)   updateDroneGPS(map);
    updatePositionFields();
  });

  // center on drone
  document.getElementById('centerOnDroneBtn')?.addEventListener('click', ()=>{
    const m=droneMarker?.getOptions?.().position;
    if(Array.isArray(m)) cameraTo(m, Math.max(map.getCamera().zoom,17));
  });

  // steps panel (chỉ dùng trong Plan)
  document.getElementById('stepsShowBtn')?.addEventListener('click', ()=>{
    document.getElementById('stepsPanel')?.classList.toggle('is-hidden');
  });
  document.getElementById('stepsHideBtn')?.addEventListener('click', ()=>{
    document.getElementById('stepsPanel')?.classList.add('is-hidden');
  });
  document.getElementById('addStepBtn')?.addEventListener('click', ()=>{
    const pos = map.getCamera().center; // [lon,lat]
    mission.addMarkerAndStep(pos);
  });
  document.getElementById('sendMissionBtn')?.addEventListener('click', ()=>{
    mission.sendMission(bridge);
  });

  // draw tools
  document.getElementById('drawPolylineBtn')?.addEventListener('click', ()=> mission.drawFromMarkers('polyline'));
  document.getElementById('drawPolygonBtn')?.addEventListener('click', ()=> mission.drawFromMarkers('polygon'));
  document.getElementById('clearMarkersBtn')?.addEventListener('click', mission.clearAll);

  // hamburger: desktop thu gọn, mobile như cũ
  document.getElementById('sidebarToggle')?.addEventListener('click', (ev) => {
    ev.stopPropagation(); // tránh click xuyên
    if (window.innerWidth <= 900) {
      document.body.classList.toggle('sidebar-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
  });

  // cập nhật bảng từ sự kiện
  document.addEventListener('mission:changed', renderMissionTable);
  renderMissionTable();

  // rời Plan thì đóng Steps
  document.addEventListener('gcs:viewchange', (e)=>{
    const v = e.detail.view; // 'home' | 'plan' | 'fly' | ...
    if (v !== 'plan') document.getElementById('stepsPanel')?.classList.add('is-hidden');
  });
}

function callBridge(fnName, ...args){
  if (bridge && typeof bridge[fnName] === 'function') return bridge[fnName](...args);
  alert(`${fnName}() chưa được bridge Python export.`);
}

function collectWPs(){
  const out = [];
  const steps = mission?.state?.steps || mission?.state?.markers || [];
  steps.forEach((s,i)=>{
    let lon, lat, alt = 0;
    if (Array.isArray(s)) { [lon,lat,alt=0] = s; }
    else if (s?.pos) { [lon,lat,alt=0] = s.pos; }
    else if (s?.position) { [lon,lat,alt=0] = s.position; }
    else if (s?.lon!==undefined && s?.lat!==undefined){ lon=s.lon; lat=s.lat; alt=s.alt||0; }
    out.push({ idx:i+1, lat, lon, alt });
  });
  return out;
}

function renderMissionTable(){
  const tb = document.querySelector('#wpTable tbody');
  if (!tb) return;
  const rows = collectWPs();
  tb.innerHTML = rows.map(r =>
    `<tr><td>${r.idx}</td><td>${(r.lat??'-')?.toFixed?.(5) ?? '-'}</td><td>${(r.lon??'-')?.toFixed?.(5) ?? '-'}</td><td>${(r.alt??0)?.toFixed?.(1) ?? '-'}</td></tr>`
  ).join('');
}

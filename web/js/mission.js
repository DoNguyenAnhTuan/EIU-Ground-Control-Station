// mission.js
import { ORIGIN } from "./config.js";
import { getMap, addHtmlMarker, removeMarker, drawPolyline, drawPolygon, clearDraw, cameraTo, pixelHitIndex } from "./map-core.js";
import { latLonToENU } from "./utils.js";

export const state = {
  markers: [],
  steps: [],
  seq: 1,
  currentMode: "local",
  lastLocal: null,
  lastGPS: null
};

function emitChanged() {
  document.dispatchEvent(new CustomEvent('mission:changed'));
}

export function defaultAlt(){
  if (state.currentMode==='local' && state.lastLocal) return Math.max(0, +state.lastLocal.z||0);
  if (state.lastGPS) return Math.max(0, +state.lastGPS.alt||0);
  return 10;
}

export function addMarkerAndStep(posLonLat){
  const num = state.markers.length + 1;
  const el = document.createElement("div");
  el.style.cssText = "background:#ef4444;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;border:1px solid #fff;";
  el.textContent = num;
  const m = addHtmlMarker(posLonLat, el);
  state.markers.push(m);

  const [lon,lat] = posLonLat;
  state.steps.push({ id: state.seq++, type:"Fly to", lat, lon, alt: defaultAlt(), task: "None", markerIndex: state.markers.length-1 });
  renderSteps();
  emitChanged();
}

export function renderSteps(){
  const list = document.getElementById('stepsList'); if(!list) return;
  list.innerHTML = '';
  state.steps.forEach((s, idx)=>{
    const row = document.createElement('div');
    row.className='step-item';
    row.innerHTML = `
      <div class="step-head">
        <div class="step-num">${idx+1}</div>
        <select class="step-type">
          <option ${s.type==="Fly to"?'selected':''}>Fly to</option>
          <option ${s.type==="Take off"?'selected':''}>Take off</option>
          <option ${s.type==="Return & land"?'selected':''}>Return & land</option>
        </select>
        <div class="step-actions">
          <button class="icon-btn up" title="Move up">▲</button>
          <button class="icon-btn down" title="Move down">▼</button>
          <button class="icon-btn focus" title="Center">◎</button>
          <button class="icon-btn del" title="Delete">✕</button>
        </div>
      </div>
      <div class="step-grid">
        <div class="step-field"><span style="opacity:.7">Lat</span><input class="lat" value="${(+s.lat).toFixed(6)}"></div>
        <div class="step-field"><span style="opacity:.7">Lon</span><input class="lon" value="${(+s.lon).toFixed(6)}"></div>
      </div>
      <div class="step-foot">
        <div class="step-field"><span style="opacity:.7">Alt</span><input class="alt" value="${(+s.alt).toFixed(2)}"></div>
        <select class="step-task">
          <option ${s.task==="None"?'selected':''}>None</option>
          <option ${s.task==="Photo"?'selected':''}>Photo</option>
          <option ${s.task==="Hover 5s"?'selected':''}>Hover 5s</option>
          <option ${s.task==="Payload drop"?'selected':''}>Payload drop</option>
          <option ${s.task==="Custom"?'selected':''}>Custom</option>
        </select>
      </div>
    `;
    row.querySelector('.up').onclick    = ()=> moveStep(idx,-1);
    row.querySelector('.down').onclick  = ()=> moveStep(idx,+1);
    row.querySelector('.del').onclick   = ()=> removeStep(idx,true);
    row.querySelector('.focus').onclick = ()=> cameraTo([s.lon,s.lat], Math.max(getMap().getCamera().zoom,17));
    row.querySelector('.step-type').onchange = e => s.type = e.target.value;
    row.querySelector('.step-task').onchange = e => s.task = e.target.value;
    row.querySelector('.lat').onchange = e => updateStepCoord(idx, +e.target.value, s.lon);
    row.querySelector('.lon').onchange = e => updateStepCoord(idx, s.lat, +e.target.value);
    row.querySelector('.alt').onchange = e => s.alt = +e.target.value || 0;

    list.appendChild(row);
  });
}
function updateStepCoord(idx, newLat, newLon){
  const s = state.steps[idx];
  if (!s) return;
  if (Number.isFinite(newLat)) s.lat = +newLat;
  if (Number.isFinite(newLon)) s.lon = +newLon;

  // cập nhật marker tương ứng
  const m = state.markers[idx];
  if (m) m.setOptions({ position: [s.lon, s.lat] });

  rebuildMarkers();
  renderSteps();
  emitChanged();
}

export function moveStep(i, dir){
  const j = i + dir; if (j<0 || j>=state.steps.length) return;
  [state.steps[i], state.steps[j]]   = [state.steps[j], state.steps[i]];
  [state.markers[i], state.markers[j]] = [state.markers[j], state.markers[i]];
  state.steps.forEach((s,k)=>s.markerIndex=k);
  rebuildMarkers(); renderSteps(); emitChanged();
}

export function removeStep(i, alsoRemoveMarker){
  state.steps.splice(i,1);
  if (alsoRemoveMarker && state.markers[i]){
    removeMarker(state.markers[i]);
    state.markers.splice(i,1);
  }
  state.steps.forEach((s,k)=>s.markerIndex=k);
  rebuildMarkers(); renderSteps(); emitChanged();
}

export function rebuildMarkers(){
  state.markers.forEach((m,i)=>{
    const [lon,lat]=m.getOptions().position;
    m.setOptions({ htmlContent: `<div title="Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}"
      style="background:#ef4444;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;border:1px solid white;">${i+1}</div>` });
  });
}

export function bindMapInteractions(){
  const map = getMap();

  // click => add marker (CHỈ khi đang ở Plan)
  map.events.add('click', (e)=> {
    if (document.body?.dataset?.view !== 'plan') return;
    const pos = e?.position;
    if (Array.isArray(pos) && typeof pos[0]==='number') addMarkerAndStep(pos);
  });

  // right-click => delete (CHỈ khi Plan)
  map.events.add('contextmenu',(e)=>{
    if (document.body?.dataset?.view !== 'plan') return;
    if (!e?.position) return;
    const idx = pixelHitIndex(state.markers, e.position, 16);
    if (idx!==-1) removeStep(idx, true);
  });
}

export function drawFromMarkers(type){
  const coords = state.markers.map(m=>m.getOptions().position).filter(Array.isArray);
  if (type==="polyline") {
    if (coords.length<2) return alert('Cần ít nhất 2 điểm.');
    drawPolyline(coords);
  } else {
    if (coords.length<3) return alert('Cần ít nhất 3 điểm.');
    drawPolygon([...coords, coords[0]]);
  }
}

export function clearAll(){
  state.markers.forEach(removeMarker);
  state.markers.length = 0;
  state.steps = [];
  clearDraw();
  renderSteps();
  emitChanged();
}

// (giữ nguyên phần updateStepCoord/sendMission nếu bạn có)


export function sendMission(bridge){
  if (!state.steps.length) return alert("❗ Không có waypoint nào.");
  const wps = state.steps.map(s=>{
    const [east,north] = latLonToENU(s.lat, s.lon, ORIGIN.lat, ORIGIN.lon);
    const alt = +s.alt || 0;
    return { x:+east.toFixed(3), y:+north.toFixed(3), z:+alt.toFixed(3) };
  });
  bridge?.receivedTargetWaypoint && bridge.receivedTargetWaypoint(wps);
}

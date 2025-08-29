// map-core.js
import { ORIGIN } from "./config.js";

// ===== module state =====
let map;
let missionSource, drawSource;        // bạn có sẵn
let trackSource, plannedSource;       // thêm mới

// ===== named exports (để file khác import) =====
export function getMap() { return map; }
export function getSources() {
  return { missionSource, drawSource, trackSource, plannedSource };
}

// Khởi tạo bản đồ + layers
export function initMap(subscriptionKey) {
  return new Promise((resolve) => {
    map = new atlas.Map("myMap", {
      center: [ORIGIN.lon, ORIGIN.lat],
      zoom: 16,
      style: "satellite_road_labels",
      authOptions: { authType: "subscriptionKey", subscriptionKey },
    });

    map.events.add("ready", () => {
      // sources cơ bản
      missionSource = new atlas.source.DataSource();  map.sources.add(missionSource);
      drawSource    = new atlas.source.DataSource();  map.sources.add(drawSource);

      // vẽ nhanh polyline/polygon (tools)
      const lineLayer    = new atlas.layer.LineLayer(drawSource,   null,
        { strokeColor: "blue", strokeWidth: 3 });
      const polygonLayer = new atlas.layer.PolygonLayer(drawSource, null,
        { fillColor: "rgba(0,255,0,0.4)", strokeColor: "green", strokeWidth: 2 });
      map.layers.add([lineLayer, polygonLayer]);

      // sources/layers cho track thực tế & planned route
      trackSource   = new atlas.source.DataSource();  map.sources.add(trackSource);
      plannedSource = new atlas.source.DataSource();  map.sources.add(plannedSource);

      const trackLayer = new atlas.layer.LineLayer(trackSource, null, {
        strokeColor: "#38bdf8", strokeWidth: 3
      });
      const plannedLayer = new atlas.layer.LineLayer(plannedSource, null, {
        strokeColor: "#22c55e", strokeDashArray: [2, 2], strokeWidth: 2
      });
      map.layers.add([trackLayer, plannedLayer]);

      resolve(map);
    });
  });
}

// ===== Marker & camera helpers =====
export function addHtmlMarker(position, htmlContent) {
  const m = new atlas.HtmlMarker({ position, htmlContent });
  map.markers.add(m);
  return m;
}
export function removeMarker(m) { map.markers.remove(m); }
export function setStyle(style) { map.setStyle({ style }); }
export function cameraTo(center, zoom) { map.setCamera({ center, zoom }); }

// hit-test marker theo pixel
export function pixelHitIndex(markers, clickLL, pixelRadius = 16) {
  const pt = map.positionsToPixels([clickLL])[0];
  let idx = -1;
  markers.some((m, i) => {
    const mp = map.positionsToPixels([m.getOptions().position])[0];
    const dx = mp[0] - pt[0], dy = mp[1] - pt[1];
    if ((dx * dx + dy * dy) <= (pixelRadius * pixelRadius)) { idx = i; return true; }
  });
  return idx;
}

// ===== Draw tools (giữ nguyên) =====
export function drawPolyline(coords) {
  drawSource.clear();
  drawSource.add(new atlas.data.LineString(coords));
}
export function drawPolygon(coords) {
  drawSource.clear();
  drawSource.add(new atlas.data.Polygon([coords]));
}
export function clearDraw() { drawSource.clear(); }

// ===== Track / Planned helpers (mới) =====
export function drawTrackLine(coordsArray) {
  if (!coordsArray?.length) return;
  trackSource.clear();
  trackSource.add(new atlas.data.LineString(coordsArray));
}
export function clearTrack() { trackSource.clear(); }

export function drawPlannedRoute(coordsArray) {
  if (!coordsArray?.length) { plannedSource.clear(); return; }
  plannedSource.clear();
  plannedSource.add(new atlas.data.LineString(coordsArray));
}
export function clearPlanned() { plannedSource.clear(); }

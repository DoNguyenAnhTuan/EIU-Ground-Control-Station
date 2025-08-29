export function enuToLatLon(east, north, up, originLat, originLon) {
  const R = 6378137.0, oLat = originLat * Math.PI / 180.0;
  const dLat = north / R, dLon = east / (R * Math.cos(oLat));
  return [originLon + dLon * 180 / Math.PI, originLat + dLat * 180 / Math.PI];
}

export function latLonToENU(lat, lon, originLat, originLon) {
  const R=6378137.0, latR=lat*Math.PI/180.0, lonR=lon*Math.PI/180.0,
        oLat=originLat*Math.PI/180.0, oLon=originLon*Math.PI/180.0;
  const dLat=latR-oLat, dLon=lonR-oLon, north=dLat*R, east=dLon*R*Math.cos(oLat);
  return [east, north, 0];
}

export function llDistanceMeters(a,b){
  if(!a||!b) return Infinity; const R=6378137;
  const dLat=(b[1]-a[1]) * Math.PI/180, dLon=(b[0]-a[0]) * Math.PI/180, mlat=(a[1]+b[1]) * 0.5 * Math.PI/180;
  const x=dLon*Math.cos(mlat), y=dLat; return Math.sqrt(x*x+y*y)*R;
}

export function rafThrottle(fn){
  let locked=false;
  return (...args)=>{
    if (locked) return;
    locked=true;
    requestAnimationFrame(()=>{ locked=false; fn(...args); });
  };
}

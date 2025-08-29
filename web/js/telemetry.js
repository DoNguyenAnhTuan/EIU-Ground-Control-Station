let telePinned=false, teleAutoTimer=null;
const TELEMETRY_PEEK_MS=2500;

export function setConnected(on){
  const el=document.getElementById('teleConn'); if(!el) return;
  el.textContent=on?'Connected':'Disconnected';
  el.classList.toggle('tele__status--ok',on);
  el.classList.toggle('tele__status--bad',!on);
}

export function updateBattery(percent, voltage){
  const txt=document.getElementById('teleBattText');
  const p=Number.isFinite(percent)?Math.max(0,Math.min(100,+percent)):null;
  const v=Number.isFinite(voltage)?+voltage:null;
  if(!txt) return;
  if(p!=null && v!=null) txt.textContent=`${p.toFixed(0)}% • ${v.toFixed(2)}V`;
  else if(p!=null) txt.textContent=`${p.toFixed(0)}%`;
  else if(v!=null) txt.textContent=`${v.toFixed(2)}V`;
  else txt.textContent='—';
  autoPeek();
}

export function updateSpeed(spd){
  const el=document.getElementById('teleSpeed'); if(el) el.textContent=(typeof spd==='number' && isFinite(spd))?spd.toFixed(2):'—';
  autoPeek();
}

export function updateAlt(txt){
  const el=document.getElementById('teleAlt'); if(!el) return;
  el.textContent = txt ?? '—';
  autoPeek();
}

export function bindDrawer(){
  const tgl=document.getElementById('teleToggle');
  const wrap=document.getElementById('teleDrawer');
  if (!tgl || !wrap) return;
  tgl.addEventListener('click', ()=>{
    const collapsed = wrap.classList.toggle('collapsed');
    telePinned = !collapsed;
    if (telePinned) clearTimeout(teleAutoTimer);
  });
}

function autoPeek(){
  if (telePinned) return;
  const wrap=document.getElementById('teleDrawer');
  wrap?.classList.remove('collapsed');
  clearTimeout(teleAutoTimer);
  teleAutoTimer = setTimeout(()=>wrap?.classList.add('collapsed'), TELEMETRY_PEEK_MS);
}

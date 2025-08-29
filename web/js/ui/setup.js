// js/ui/setup.js
export function initSetupOverlay(bridge) {
  const overlay  = document.getElementById('setupFull');
  const backBtn  = document.getElementById('setupBack');
  const titleEl  = document.getElementById('setupTitle');

  const titleMap = {
    summary:'Summary', firmware:'Firmware', airframe:'Airframe', radio:'Radio',
    sensors:'Sensors', flightmodes:'Flight Modes', power:'Power', motors:'Motors',
    safety:'Safety', tuning:'Tuning', camera:'Camera', params:'Parameters'
  };

  function openScreen(key){
    document.querySelectorAll('.setup-screen').forEach(s => s.hidden = true);
    const pane = document.getElementById(`setup-screen-${key}`);
    if (!pane) return;
    pane.hidden = false;
    titleEl.textContent = titleMap[key] || key;
    overlay.hidden = false;
    document.body.classList.add('overlay-open');
  }
  function closeOverlay(){
    overlay.hidden = true;
    document.body.classList.remove('overlay-open');
  }

  // Event delegation để nhẹ & ít listener
const setupMenu = document.querySelector('#view-setup #setupMenu');
setupMenu?.addEventListener('click', (e)=>{
  const el = e.target.closest('[data-setup]');
  if (!el) return;
  e.preventDefault();
  openScreen(el.dataset.setup);
  // highlight item đang mở
  setupMenu.querySelectorAll('.menu-item').forEach(n=> n.classList.toggle('active', n===el));
});
// hỗ trợ bàn phím
setupMenu?.addEventListener('keydown', (e)=>{
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[data-setup]');
  if (!el) return;
  e.preventDefault();
  openScreen(el.dataset.setup);
});


  backBtn?.addEventListener('click', closeOverlay);
  document.addEventListener('keydown', e=>{ if (!overlay.hidden && e.key==='Escape') closeOverlay(); });
  document.addEventListener('gcs:viewchange', e=>{ if (e.detail.view !== 'setup') closeOverlay(); });

  // ===== Bind phần Firmware =====
  const dot     = document.getElementById('fwDot');
  const status  = document.getElementById('fwStatus');
  const refresh = document.getElementById('fwRefresh');
  const start   = document.getElementById('fwStart');
  const chan    = document.getElementById('fwChannel');
  const veh     = document.getElementById('fwVehicle');
  const file    = document.getElementById('fwFile');
  const prog    = document.getElementById('fwProg');
  const logEl   = document.getElementById('fwLog');

  if (refresh && start) {
    const log = (t)=>{ logEl.textContent += (t+'\n'); logEl.scrollTop = logEl.scrollHeight; };
    const setStatus = (txt, ok=false)=>{
      status.textContent = txt;
      dot?.classList.toggle('ok', !!ok);
      // cho phép flash từ file custom khi chưa detect board
      start.disabled = !ok && !(file?.files?.length);
    };
    setStatus('Disconnected', false);

    // ArduPilot → hiện selector vehicle
    document.querySelectorAll('input[name="fwStack"]').forEach(r=>{
      r.addEventListener('change', ()=>{
        veh.hidden = !(r.value==='ardu' && r.checked);
      });
    });

    refresh.addEventListener('click', async ()=>{
      setStatus('Scanning...');
      try{
        if (bridge && typeof bridge.scanBoards === 'function') {
          const list = await bridge.scanBoards(); // [{name,port}, ...]
          const b = list?.[0];
          setStatus(b ? `Found: ${b.name || 'Board'}` : 'Not found', !!b);
          log(b ? 'Bootloader detected.' : 'No bootloader found.');
        } else {
          setTimeout(()=>{ setStatus('Found: Pixhawk (demo)', true); log('Bootloader detected (demo).'); }, 600);
        }
      }catch(e){
        setStatus('Scan error'); log('Scan failed: ' + (e?.message || e));
      }
    });

    start.addEventListener('click', async ()=>{
      const stack   = document.querySelector('input[name="fwStack"]:checked')?.value || 'px4';
      const channel = chan.value;
      const vehicle = veh.hidden ? null : veh.value;
      const custom  = file?.files?.[0]?.name || null;

      log(`Starting flash: ${stack} ${channel}${vehicle?` (${vehicle})`:''}${custom?` [file:${custom}]`:''}`);
      prog.style.width = '0%';

      try{
        if (bridge && typeof bridge.flashFirmware === 'function') {
          await bridge.flashFirmware(
            {stack, channel, vehicle, customPath: custom},
            (p,msg)=>{ if(p!=null) prog.style.width = `${Math.max(0,Math.min(100,p))}%`; if(msg) log(msg); }
          );
        } else {
          // demo progress
          const steps = [
            'Downloading firmware...','Download complete','Erasing previous program...',
            'Erase complete','Programming new version...','Verify program...','Upgrade complete'
          ];
          for(let i=0;i<steps.length;i++){
            await new Promise(r=>setTimeout(r, 600));
            prog.style.width = `${Math.round(((i+1)/steps.length)*100)}%`;
            log(steps[i]);
          }
        }
      }catch(e){
        log('Error: ' + (e?.message || e));
      }
    });
  }
}

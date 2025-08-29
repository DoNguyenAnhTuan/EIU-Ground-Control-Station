// js/ui/setup/screens/firmware.js
export async function mount(root, ctx){
  root.innerHTML = `
    <div class="card">
      <div class="fw-grid">
        <div>
          <h1>Firmware</h1>
          <p class="muted">Plug your device via USB to start firmware upgrade.</p>
          <div class="warn small">Unplug battery & telemetry links before flashing.</div>
        </div>
        <div class="fw-status">
          <span class="dot" id="fwDot"></span>
          <span id="fwStatus">Disconnected</span>
          <button id="fwRefresh" class="btn btn--ghost btn--sm" type="button">Refresh</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="fw-opts">
        <div class="row">
          <label class="lbl">Stack</label>
          <label class="chip"><input type="radio" name="fwStack" value="px4" checked> PX4</label>
          <label class="chip"><input type="radio" name="fwStack" value="ardu"> ArduPilot</label>
          <select id="fwVehicle" class="sel" hidden>
            <option value="quad">Quadcopter</option>
            <option value="plane">Plane</option>
            <option value="rover">Rover</option>
            <option value="heli">Heli</option>
          </select>
        </div>
        <div class="row">
          <label class="lbl">Channel</label>
          <select id="fwChannel" class="sel">
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <details class="adv"><summary>Advanced</summary>
          <div class="row"><label class="lbl">Custom file</label><input type="file" id="fwFile" accept=".px4,.apj"></div>
        </details>
        <div class="row"><button id="fwStart" class="btn btn--primary" type="button">Load Firmware</button></div>
      </div>
    </div>

    <div class="card">
      <div class="progress"><div id="fwProg" style="width:0%"></div></div>
      <pre id="fwLog" class="log" aria-live="polite"></pre>
    </div>
  `;

  const log  = (t)=>{ const el=root.querySelector('#fwLog'); el.textContent+=t+'\n'; el.scrollTop=el.scrollHeight; };
  const prog = root.querySelector('#fwProg');
  const dot  = root.querySelector('#fwDot');
  const stat = root.querySelector('#fwStatus');
  const setConn = on => { dot.classList.toggle('ok', !!on); stat.textContent = on?'Connected':'Disconnected'; };

  async function refresh(){
    try{
      const ok = !!ctx?.bridge?.isBootloaderConnected && await new Promise(r=>ctx.bridge.isBootloaderConnected(r));
      setConn(ok); log(ok?'Bootloader detected.':'No bootloader found.');
    }catch{ log('Refresh error'); }
  }

  async function start(){
    const stack   = root.querySelector('input[name="fwStack"]:checked')?.value || 'px4';
    const channel = root.querySelector('#fwChannel').value;
    const file    = root.querySelector('#fwFile').files?.[0] || null;

    log('Starting firmware update...'); prog.style.width='3%';

    if (!ctx?.bridge?.flashFirmware){ log('bridge.flashFirmware() not available'); return; }

    await new Promise(resolve=>{
      ctx.bridge.flashFirmware(JSON.stringify({stack, channel, custom:file?.name}), (line, pct)=>{
        if (line) log(line);
        if (pct != null) prog.style.width = `${pct}%`;
        if (pct === 100) resolve();
      });
    });
    log('Upgrade complete'); prog.style.width='100%';
  }

  root.querySelector('#fwRefresh').addEventListener('click', refresh);
  root.querySelector('#fwStart').addEventListener('click', start);

  return { unmount(){
    root.querySelector('#fwRefresh')?.removeEventListener('click', refresh);
    root.querySelector('#fwStart')?.removeEventListener('click', start);
  }};
}

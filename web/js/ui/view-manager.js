// js/ui/view-manager.js
export function initViewNav(initial /* 'home' | 'plan' | 'fly' | 'setup' | 'settings' | null */){
  const navBtns = [...document.querySelectorAll('.nav-btn[data-view]')];

  function setView(v){
    const view = v || 'home';
    document.body.dataset.view = view;

    // toggle pane trong sidebar
    document.querySelectorAll('.view-pane').forEach(p => p.hidden = true);
    if (view !== 'home') document.getElementById(`view-${view}`)?.removeAttribute('hidden');

    // nav active
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === view));

    // đóng Steps khi rời Plan
    if (view !== 'plan') document.getElementById('stepsPanel')?.classList.add('is-hidden');

    // phát sự kiện cho các module khác (mission, main…)
    document.dispatchEvent(new CustomEvent('gcs:viewchange', { detail:{ view }}));
  }

  navBtns.forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const v = btn.dataset.view;
      // nếu đang ở view => bấm lại quay về Home
      setView(document.body.dataset.view === v ? 'home' : v);
    });
  });

  setView(initial || 'home');
  return { setView };
}

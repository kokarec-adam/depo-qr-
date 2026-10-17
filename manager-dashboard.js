(() => {
  'use strict';

  const ROLE_ATTR = 'data-depoqr-role';
  const CORE_ID = 'dqManagerCore';
  const CORE_URL = 'https://cdn.jsdelivr.net/gh/kokarec-adam/depo-qr-@6d806aa966fcf076ba962c48d5776487473d34e1/manager-dashboard.js';
  let coreRequested = false;

  const isManager = () => document.documentElement.dataset.depoqrRole === 'manager' || window.DepoQRRole === 'manager';

  function installGlobalMobileFix() {
    if (document.getElementById('dqGlobalMobileFix')) return;
    const style = document.createElement('style');
    style.id = 'dqGlobalMobileFix';
    style.textContent = `
      @media(max-width:740px){
        body{overflow-x:hidden}
        .topbar{position:static!important;height:68px!important;padding:0 10px!important;z-index:20!important}
        .topbar-left{min-width:0!important;gap:8px!important}
        .mobile-menu{width:46px!important;height:46px!important;min-width:46px!important;flex:0 0 46px!important}
        .breadcrumb{font-size:12px!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:125px!important}
        .topbar-actions{gap:6px!important;flex:0 0 auto!important}
        .topbar-actions .system-pill{display:none!important}
        .topbar-actions .icon-button{width:44px!important;height:44px!important;min-width:44px!important;font-size:20px!important}
        .topbar-actions .top-add{width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;font-size:0!important;border-radius:10px!important}
        .topbar-actions .top-add span{font-size:24px!important}
        .sidebar-bottom #exportBtn,.sidebar-bottom #importBtn{display:none!important}
        .excel-button{position:static!important;width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;font-size:0!important;justify-content:center!important;border-radius:10px!important;box-shadow:none!important}
        .excel-button::before{content:'▣';font-size:20px!important;line-height:1}
        .pro-toolbar{gap:8px!important}
        .page-content{padding:18px 10px 34px!important}
      }
      @media(max-width:380px){
        .breadcrumb{max-width:105px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function removeManagerUI() {
    document.querySelectorAll('[data-view="manager"]').forEach(el => el.remove());
    document.getElementById('view-manager')?.remove();
    document.getElementById('dqManagerProStyle')?.remove();
    document.getElementById('dqManagerMobileFix')?.remove();
    const core = document.getElementById(CORE_ID);
    if (core) core.remove();
    coreRequested = false;
    if (location.hash === '#manager') history.replaceState(null, '', location.pathname + location.search);
  }

  function installManagerMobileFix() {
    if (document.getElementById('dqManagerMobileFix')) return;
    const style = document.createElement('style');
    style.id = 'dqManagerMobileFix';
    style.textContent = `
      #view-manager .wm-action{cursor:pointer}
      #view-manager .wm-action:focus-visible{outline:3px solid #7db8e2;outline-offset:2px}
      @media(max-width:740px){
        #view-manager{padding:0 0 30px!important;overflow-x:hidden}
        #view-manager .wm-head{display:block!important;margin-bottom:10px!important}
        #view-manager .wm-head h1{font-size:27px!important;line-height:1.12!important;margin:5px 0 4px!important}
        #view-manager .wm-sub{font-size:10px!important;line-height:1.35!important}
        #view-manager .wm-period{display:grid!important;grid-template-columns:40px minmax(0,1fr) 40px!important;gap:6px!important;width:100%!important;margin-top:12px!important}
        #view-manager .wm-nav{width:40px!important;height:40px!important}
        #view-manager .wm-mainperiod{height:40px!important;min-width:0!important;width:100%!important;font-size:11px!important}
        #view-manager .wm-banner{margin:9px 0!important;padding:8px 10px!important;font-size:9px!important;line-height:1.35!important}
        #view-manager .wm-tabs{width:100%!important;margin:0 0 10px!important;padding:3px!important;gap:3px!important}
        #view-manager .wm-tab{flex:1 0 0!important;min-width:0!important;padding:9px 5px!important;font-size:9px!important}
        #view-manager .wm-hero{display:flex!important;flex-direction:column!important;gap:8px!important;margin-bottom:9px!important}
        #view-manager .wm-ai{min-height:0!important;padding:15px!important;border-radius:14px!important}
        #view-manager .wm-ai h2{font-size:17px!important;line-height:1.22!important;margin:6px 0 7px!important}
        #view-manager .wm-ai p{font-size:10px!important;line-height:1.5!important}
        #view-manager .wm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-bottom:9px!important}
        #view-manager .wm-kpi{padding:11px!important;border-radius:10px!important}
        #view-manager .wm-kpi-label{font-size:8px!important}
        #view-manager .wm-kpi-value{font-size:20px!important;margin-top:5px!important}
        #view-manager .wm-kpi-foot{font-size:7px!important;margin-top:4px!important}
        #view-manager .wm-kpi:nth-child(5){grid-column:1/-1}
        #view-manager .wm-command{display:flex!important;flex-direction:column!important;gap:8px!important;margin-bottom:9px!important}
        #view-manager .wm-command-main,#view-manager .wm-priority{padding:11px!important;border-radius:11px!important}
        #view-manager .wm-action{padding:8px!important;gap:6px!important;border-radius:9px!important}
        #view-manager .wm-grid{display:flex!important;flex-direction:column!important;gap:8px!important;margin-bottom:9px!important}
        #view-manager .wm-card{padding:11px!important;border-radius:11px!important;margin:0!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
        #view-manager .wm-bars{height:135px!important;min-width:390px!important;grid-template-columns:repeat(12,26px)!important;gap:5px!important}
        #view-manager .wm-track{height:96px!important}
        #view-manager .wm-bar{width:15px!important}
      }
      @media(max-width:380px){#view-manager .wm-head h1{font-size:24px!important}}
    `;
    document.head.appendChild(style);
  }

  function loadManagerCore() {
    if (!isManager()) return removeManagerUI();
    if (document.getElementById(CORE_ID) || coreRequested) return;
    coreRequested = true;
    const script = document.createElement('script');
    script.id = CORE_ID;
    script.src = CORE_URL;
    script.onload = installManagerMobileFix;
    script.onerror = () => { coreRequested = false; console.error('DepoQR yönetici paneli yüklenemedi.'); };
    document.head.appendChild(script);
  }

  installGlobalMobileFix();

  const observer = new MutationObserver(() => {
    if (isManager()) loadManagerCore();
    else removeManagerUI();
  });
  observer.observe(document.documentElement, {attributes:true, attributeFilter:[ROLE_ATTR]});

  if (isManager()) loadManagerCore();
  else removeManagerUI();
})();
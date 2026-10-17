(() => {
  'use strict';

  // This loader is intentionally inert for field users. cloud-sync.js sets
  // window.DepoQRRole after Firebase authentication and loads this file again
  // for managers. This prevents the manager screen from leaking to saha users.
  if (window.DepoQRRole !== 'manager') return;

  const CORE = 'https://cdn.jsdelivr.net/gh/kokarec-adam/depo-qr-@6d806aa966fcf076ba962c48d5776487473d34e1/manager-dashboard.js';

  function installManagerEnhancements() {
    if (document.getElementById('dqManagerMobileFix')) return;

    const style = document.createElement('style');
    style.id = 'dqManagerMobileFix';
    style.textContent = `
      #view-manager .wm-action{cursor:pointer}
      #view-manager .wm-action:focus-visible{outline:3px solid #7db8e2;outline-offset:2px}
      #view-manager .wm-action .ico{transition:transform .18s ease}
      #view-manager .wm-action:hover .ico{transform:scale(1.08)}

      /* Manager page: keep the app shell compact on phones. */
      @media(max-width:740px){
        body{overflow-x:hidden}
        .topbar{position:static!important;height:68px!important;padding:0 10px!important}
        .topbar-left{min-width:0!important;gap:8px!important}
        .mobile-menu{width:46px!important;height:46px!important;flex:0 0 46px!important}
        .breadcrumb{font-size:12px!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:125px!important}
        .breadcrumb span{padding:0 4px!important}
        .topbar-actions{gap:6px!important;flex:0 0 auto!important}
        .topbar-actions .system-pill{display:none!important}
        .topbar-actions .icon-button{width:44px!important;height:44px!important;font-size:20px!important}
        .topbar-actions .top-add{width:44px!important;min-height:44px!important;height:44px!important;padding:0!important;font-size:0!important;border-radius:10px!important}
        .topbar-actions .top-add span{font-size:24px!important}
        .sidebar-bottom #exportBtn,.sidebar-bottom #importBtn{display:none!important}
        .page-content{padding:18px 10px 34px!important}

        #view-manager{padding:0 0 30px!important;overflow-x:hidden}
        #view-manager .wm-head{display:block!important;margin-bottom:10px!important}
        #view-manager .wm-eyebrow{font-size:8px!important;letter-spacing:.11em!important;gap:6px!important}
        #view-manager .wm-eyebrow i{width:20px!important;height:3px!important}
        #view-manager .wm-head h1{font-size:27px!important;line-height:1.12!important;margin:5px 0 4px!important;letter-spacing:-.03em!important}
        #view-manager .wm-sub{font-size:10px!important;line-height:1.35!important}

        #view-manager .wm-period{display:grid!important;grid-template-columns:40px minmax(0,1fr) 40px!important;gap:6px!important;width:100%!important;margin-top:12px!important}
        #view-manager .wm-nav{width:40px!important;height:40px!important}
        #view-manager .wm-mainperiod{height:40px!important;min-width:0!important;width:100%!important;font-size:11px!important}
        #view-manager .wm-menu{left:0!important;right:0!important;width:auto!important;max-height:52vh!important;overflow:auto!important}

        #view-manager .wm-banner{margin:9px 0 9px!important;padding:8px 10px!important;font-size:9px!important;line-height:1.35!important;gap:5px!important}
        #view-manager .wm-live{font-size:9px!important}
        #view-manager .wm-tabs{width:100%!important;max-width:none!important;margin:0 0 10px!important;padding:3px!important;gap:3px!important;border-radius:11px!important}
        #view-manager .wm-tab{flex:1 0 0!important;min-width:0!important;padding:9px 5px!important;font-size:9px!important}

        #view-manager .wm-hero{display:flex!important;flex-direction:column!important;gap:8px!important;margin-bottom:9px!important}
        #view-manager .wm-ai{min-height:0!important;padding:15px!important;border-radius:14px!important}
        #view-manager .wm-ai-kicker{font-size:8px!important}
        #view-manager .wm-ai h2{font-size:17px!important;line-height:1.22!important;margin:6px 0 7px!important}
        #view-manager .wm-ai p{font-size:10px!important;line-height:1.5!important}
        #view-manager .wm-ai-foot{font-size:8px!important;margin-top:9px!important}
        #view-manager .wm-alerts{gap:7px!important}
        #view-manager .wm-alert{min-height:0!important;padding:9px 10px!important;border-radius:10px!important}
        #view-manager .wm-alert-title{font-size:9px!important}
        #view-manager .wm-alert-text{font-size:8px!important;margin-top:3px!important}

        #view-manager .wm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-bottom:9px!important}
        #view-manager .wm-kpi{padding:11px!important;border-radius:10px!important}
        #view-manager .wm-kpi-label{font-size:8px!important}
        #view-manager .wm-kpi-value{font-size:20px!important;margin-top:5px!important}
        #view-manager .wm-kpi-foot{font-size:7px!important;margin-top:4px!important}
        #view-manager .wm-kpi:nth-child(5){grid-column:1/-1}

        #view-manager .wm-command{display:flex!important;flex-direction:column!important;gap:8px!important;margin-bottom:9px!important}
        #view-manager .wm-command-main,#view-manager .wm-priority{padding:11px!important;border-radius:11px!important}
        #view-manager .wm-command-title h3,#view-manager .wm-priority h3{font-size:12px!important}
        #view-manager .wm-command-title span{font-size:7px!important;padding:4px 6px!important}
        #view-manager .wm-actions{gap:6px!important;margin-top:8px!important}
        #view-manager .wm-action{padding:8px!important;gap:6px!important;border-radius:9px!important}
        #view-manager .wm-action .ico{width:25px!important;height:25px!important;min-width:25px!important;font-size:12px!important}
        #view-manager .wm-action b{font-size:8px!important;line-height:1.2!important}
        #view-manager .wm-action small{font-size:6.5px!important;line-height:1.2!important}
        #view-manager .wm-priority p{font-size:7px!important;margin:3px 0 6px!important}
        #view-manager .wm-priority-item{padding:6px 0!important;gap:6px!important}
        #view-manager .wm-priority-item strong{font-size:8px!important}
        #view-manager .wm-priority-item small{font-size:6.5px!important}
        #view-manager .wm-priority-item b{font-size:7px!important}

        #view-manager .wm-grid{display:flex!important;flex-direction:column!important;gap:8px!important;margin-bottom:9px!important}
        #view-manager .wm-card{padding:11px!important;border-radius:11px!important;margin:0!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
        #view-manager .wm-card h3{font-size:12px!important}
        #view-manager .wm-card-sub{font-size:7px!important;margin:3px 0 7px!important}
        #view-manager .wm-bars{height:135px!important;min-width:390px!important;grid-template-columns:repeat(12,26px)!important;gap:5px!important}
        #view-manager .wm-track{height:96px!important}
        #view-manager .wm-bar{width:15px!important}
        #view-manager .wm-bar-value,#view-manager .wm-bar-label{font-size:6.5px!important}
        #view-manager .wm-row{gap:6px!important;padding:7px 0!important}
        #view-manager .wm-name{font-size:8px!important}
        #view-manager .wm-meta{font-size:6.5px!important}
        #view-manager .wm-value{font-size:8px!important}
        #view-manager .wm-rank{font-size:7px!important}

        #view-manager .wm-health{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-bottom:9px!important}
        #view-manager .wm-health-card{padding:10px!important;border-radius:10px!important}
        #view-manager .wm-health-card strong{font-size:18px!important}
        #view-manager .wm-health-card span,#view-manager .wm-health-card b{font-size:7px!important;line-height:1.25!important}
        #view-manager .wm-health-card b{margin-top:5px!important}
        #view-manager .wm-section-title{font-size:16px!important;margin-bottom:4px!important}
        #view-manager .wm-intro{font-size:8px!important;margin-bottom:8px!important}
        #view-manager .wm-table{min-width:470px!important;font-size:8px!important}
        #view-manager .wm-table th{font-size:7px!important;padding:6px!important}
        #view-manager .wm-table td{font-size:8px!important;padding:7px 6px!important}
        #view-manager .wm-table td small{font-size:6.5px!important}
        #view-manager .wm-pill{font-size:6.5px!important;padding:3px 5px!important}
        #view-manager .wm-empty{font-size:8px!important;padding:14px!important}
      }

      @media(max-width:380px){
        .breadcrumb{max-width:105px!important}
        #view-manager .wm-head h1{font-size:24px!important}
        #view-manager .wm-actions{grid-template-columns:1fr!important}
        #view-manager .wm-action{padding:9px!important}
        #view-manager .wm-health{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('click', event => {
      const card = event.target.closest?.('#view-manager .wm-action');
      if (!card) return;
      const text = (card.textContent || '').toLocaleLowerCase('tr-TR');
      if (text.includes('kritik stok')) {
        goToManagerSection('inventory', el => el.classList.contains('wm-health-card') && /kritik stok/i.test(el.textContent));
      } else if (text.includes('hareketsiz stok')) {
        goToManagerSection('inventory', el => /Hareketsiz stok/i.test(el.textContent));
      } else if (text.includes('hızlı artış')) {
        goToManagerSection('overview', el => /Dikkat çeken değişimler/i.test(el.textContent));
      } else if (text.includes('transfer')) {
        goToManagerSection('operations', el => /Transfer akışları/i.test(el.textContent));
      }
    });
  }

  function goToManagerSection(tab, matcher) {
    const tabButton = document.querySelector(`#view-manager .wm-tab[data-tab="${tab}"]`);
    if (tabButton) tabButton.click();
    let tries = 0;
    const timer = setInterval(() => {
      const root = document.querySelector('#view-manager #wmBody');
      const target = root ? [...root.querySelectorAll('.wm-card, .wm-health-card, h2, h3')].find(matcher) : null;
      if (target || ++tries > 20) {
        clearInterval(timer);
        if (target) target.scrollIntoView({behavior:'smooth',block:'center'});
      }
    }, 50);
  }

  const core = document.createElement('script');
  core.src = CORE;
  core.onload = installManagerEnhancements;
  core.onerror = () => console.error('DepoQR yönetici paneli yüklenemedi.');
  document.head.appendChild(core);
})();
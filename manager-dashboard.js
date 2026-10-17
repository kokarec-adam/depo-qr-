(() => {
  'use strict';

  // Keep the tested manager dashboard as the source of truth and add
  // navigation for the four action cards without touching the stock logic.
  const CORE = 'https://cdn.jsdelivr.net/gh/kokarec-adam/depo-qr-@6d806aa966fcf076ba962c48d5776487473d34e1/manager-dashboard.js';

  function installActionLinks() {
    if (document.getElementById('dqManagerActionLinks')) return;

    const style = document.createElement('style');
    style.id = 'dqManagerActionLinks';
    style.textContent = `
      #view-manager .wm-action{cursor:pointer}
      #view-manager .wm-action:focus-visible{outline:3px solid #7db8e2;outline-offset:2px}
      #view-manager .wm-action .ico{transition:transform .18s ease}
      #view-manager .wm-action:hover .ico{transform:scale(1.08)}

      /* Mobile: spacious, single-purpose layout for small screens. */
      @media (max-width:600px){
        #view-manager{padding:10px 8px 80px!important;overflow-x:hidden}
        #view-manager .wm-head{gap:12px!important;margin-bottom:10px!important}
        #view-manager .wm-eyebrow{font-size:9px!important;letter-spacing:.12em!important}
        #view-manager .wm-head h1{font-size:22px!important;line-height:1.15!important;margin:4px 0!important}
        #view-manager .wm-sub{font-size:10px!important;margin:0!important;line-height:1.4!important}

        #view-manager .wm-period{display:grid!important;grid-template-columns:42px minmax(0,1fr) 42px!important;gap:6px!important;width:100%!important}
        #view-manager .wm-nav{min-height:42px!important}
        #view-manager .wm-mainperiod{min-height:42px!important;width:100%!important;font-size:11px!important;padding:0 8px!important}
        #view-manager .wm-menu{left:0!important;right:0!important;width:auto!important;max-height:55vh!important;overflow:auto!important}

        #view-manager .wm-banner{margin:0 0 10px!important;padding:10px 12px!important;font-size:10px!important;line-height:1.5!important;display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:wrap!important}
        #view-manager .wm-live{margin-left:auto!important}

        #view-manager .wm-tabs{display:flex!important;width:100%!important;max-width:none!important;overflow-x:auto!important;gap:4px!important;margin-bottom:12px!important;padding:4px!important;scrollbar-width:none!important}
        #view-manager .wm-tabs::-webkit-scrollbar{display:none}
        #view-manager .wm-tab{flex:0 0 auto!important;min-width:105px!important;padding:10px 11px!important;font-size:10px!important}

        #view-manager .wm-hero{display:flex!important;flex-direction:column!important;gap:10px!important;margin-bottom:10px!important}
        #view-manager .wm-ai{min-height:0!important;padding:17px 16px!important;border-radius:15px!important}
        #view-manager .wm-ai h2{font-size:18px!important;line-height:1.25!important;margin:7px 0 8px!important}
        #view-manager .wm-ai p{font-size:11px!important;line-height:1.55!important}
        #view-manager .wm-ai-foot{font-size:8px!important;margin-top:11px!important}
        #view-manager .wm-alerts{gap:8px!important}
        #view-manager .wm-alert{min-height:0!important;padding:11px 12px!important;border-radius:11px!important}
        #view-manager .wm-alert-title{font-size:10px!important}
        #view-manager .wm-alert-text{font-size:9px!important;margin-top:4px!important}

        #view-manager .wm-kpis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-bottom:10px!important}
        #view-manager .wm-kpi{padding:13px 12px!important;border-radius:11px!important;min-width:0!important}
        #view-manager .wm-kpi-label{font-size:9px!important}
        #view-manager .wm-kpi-value{font-size:22px!important;margin-top:6px!important}
        #view-manager .wm-kpi-foot{font-size:8px!important;margin-top:5px!important}
        #view-manager .wm-kpi:nth-child(5){grid-column:1/-1}

        #view-manager .wm-command{display:flex!important;flex-direction:column!important;gap:10px!important;margin-bottom:10px!important}
        #view-manager .wm-command-main,#view-manager .wm-priority{padding:14px!important;border-radius:12px!important}
        #view-manager .wm-command-title h3,#view-manager .wm-priority h3{font-size:14px!important}
        #view-manager .wm-command-title span{font-size:8px!important;padding:4px 6px!important}
        #view-manager .wm-actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-top:10px!important}
        #view-manager .wm-action{min-width:0!important;padding:9px!important;gap:7px!important;border-radius:10px!important}
        #view-manager .wm-action .ico{width:28px!important;height:28px!important;min-width:28px!important;font-size:13px!important}
        #view-manager .wm-action b{font-size:9px!important;line-height:1.25!important}
        #view-manager .wm-action small{font-size:7px!important;line-height:1.25!important}
        #view-manager .wm-priority p{font-size:8px!important;margin:4px 0 8px!important}
        #view-manager .wm-priority-item{padding:8px 0!important;gap:7px!important}
        #view-manager .wm-priority-item strong{font-size:9px!important}
        #view-manager .wm-priority-item small{font-size:7px!important}
        #view-manager .wm-priority-item b{font-size:8px!important}

        #view-manager .wm-grid{display:flex!important;flex-direction:column!important;gap:10px!important;margin-bottom:10px!important}
        #view-manager .wm-card{padding:14px!important;border-radius:12px!important;margin:0!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch!important}
        #view-manager .wm-card h3{font-size:14px!important;white-space:normal!important}
        #view-manager .wm-card-sub{font-size:8px!important;margin:4px 0 10px!important;line-height:1.45!important}

        #view-manager .wm-bars{height:155px!important;min-width:420px!important;grid-template-columns:repeat(12,28px)!important;gap:6px!important}
        #view-manager .wm-track{height:112px!important}
        #view-manager .wm-bar{width:17px!important}
        #view-manager .wm-bar-value{font-size:7px!important}
        #view-manager .wm-bar-label{font-size:7px!important}

        #view-manager .wm-row{gap:7px!important;padding:9px 0!important}
        #view-manager .wm-name{font-size:9px!important}
        #view-manager .wm-meta{font-size:7px!important}
        #view-manager .wm-value{font-size:9px!important}
        #view-manager .wm-rank{font-size:8px!important}
        #view-manager .wm-progress{height:3px!important;margin-top:5px!important}

        #view-manager .wm-health{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin-bottom:10px!important}
        #view-manager .wm-health-card{padding:12px!important;border-radius:11px!important}
        #view-manager .wm-health-card strong{font-size:20px!important}
        #view-manager .wm-health-card span,#view-manager .wm-health-card b{font-size:8px!important;line-height:1.3!important}
        #view-manager .wm-health-card b{margin-top:6px!important}

        #view-manager .wm-section-title{font-size:18px!important;margin-bottom:6px!important}
        #view-manager .wm-intro{font-size:9px!important;margin-bottom:10px!important;line-height:1.45!important}
        #view-manager .wm-table{min-width:500px!important;font-size:9px!important}
        #view-manager .wm-table th{font-size:8px!important;padding:7px!important}
        #view-manager .wm-table td{font-size:9px!important;padding:8px 7px!important}
        #view-manager .wm-table td small{font-size:7px!important}
        #view-manager .wm-pill{font-size:7px!important;padding:4px 6px!important}
        #view-manager .wm-empty{font-size:9px!important;padding:18px!important}
      }

      @media (max-width:380px){
        #view-manager{padding-left:6px!important;padding-right:6px!important}
        #view-manager .wm-kpi-value{font-size:20px!important}
        #view-manager .wm-actions{grid-template-columns:1fr!important}
        #view-manager .wm-action{padding:10px!important}
        #view-manager .wm-health{grid-template-columns:1fr!important}
        #view-manager .wm-tabs .wm-tab{min-width:98px!important}
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

    const findTarget = () => {
      const root = document.querySelector('#view-manager #wmBody');
      if (!root) return null;
      const candidates = root.querySelectorAll('.wm-card, .wm-health-card, h2, h3');
      return [...candidates].find(matcher) || null;
    };

    let tries = 0;
    const timer = setInterval(() => {
      const target = findTarget();
      if (target || ++tries > 20) {
        clearInterval(timer);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  const core = document.createElement('script');
  core.src = CORE;
  core.onload = () => {
    installActionLinks();
  };
  core.onerror = () => console.error('DepoQR yönetici paneli yüklenemedi.');
  document.head.appendChild(core);
})();

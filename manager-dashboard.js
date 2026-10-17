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

    // The selected tab re-renders its body, so wait for the new content.
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
    // The core creates #view-manager during boot. Install the action links
    // after the tested dashboard has loaded.
    installActionLinks();
  };
  core.onerror = () => console.error('DepoQR yönetici paneli yüklenemedi.');
  document.head.appendChild(core);
})();

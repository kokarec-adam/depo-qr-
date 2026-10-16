(() => {
  'use strict';
  const KEY = 'depoqr_v1';

  function loadData() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (d && Array.isArray(d.materials) && Array.isArray(d.depots) && Array.isArray(d.movements)) return d;
    } catch (_) {}
    return { materials: [], depots: [], movements: [] };
  }

  function cleanTopbarSearches() {
    const top = document.querySelector('.topbar-actions');
    if (!top) return;
    const searches = [...top.querySelectorAll('.search-wrap, .global-search')];
    if (searches.length > 1) searches.slice(1).forEach(el => el.remove());
    top.querySelectorAll('.search-wrap').forEach(el => el.remove());
  }

  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-sheetjs]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.XLSX));
        existing.addEventListener('error', reject);
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      s.async = true;
      s.dataset.sheetjs = '1';
      s.onload = () => window.XLSX ? resolve(window.XLSX) : reject(new Error('SheetJS yüklenemedi'));
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function exportExcelFixed() {
    const d = loadData();
    if (!d.materials.length && !d.depots.length && !d.movements.length) {
      alert('Excel aktarılacak kayıt bulunamadı. Önce malzeme kaydı oluşturun.');
      return;
    }
    try {
      const XLSX = await loadXLSX();
      const depotName = id => d.depots.find(x => x.id === id)?.name || id || '';
      const statusText = m => Number(m.stock) <= 0 ? 'Stokta yok' : (Number(m.minStock) > 0 && Number(m.stock) <= Number(m.minStock) ? 'Kritik stok' : 'Normal stok');
      const stockRows = d.materials.map(m => ({
        'Malzeme Kodu': m.id || '', 'Malzeme Adı': m.name || '', 'Kategori': m.category || '', 'Marka': m.brand || '',
        'Model / Ölçü': m.model || '', 'Birim': m.unit || '', 'Mevcut Stok': Number(m.stock) || 0, 'Minimum Stok': Number(m.minStock) || 0,
        'Durum': statusText(m), 'Depo Kodu': m.depotId || '', 'Depo': depotName(m.depotId), 'Raf': m.shelf || '', 'Göz': m.bin || '',
        'Konum': [m.depotId, m.shelf, m.bin].filter(Boolean).join('-'), 'Not': m.notes || ''
      }));
      const depotRows = d.depots.map(x => {
        const ms = d.materials.filter(m => m.depotId === x.id);
        return {'Depo Kodu': x.id, 'Depo': x.name, 'Açıklama': x.description || '', 'Malzeme Çeşidi': ms.length, 'Toplam Stok': ms.reduce((s,m) => s + (Number(m.stock)||0), 0), 'Kritik Kayıt': ms.filter(m => statusText(m) !== 'Normal stok').length};
      });
      const moveRows = d.movements.map(m => {
        const mat = d.materials.find(x => x.id === m.materialId);
        return {'Tarih': m.date || '', 'Hareket Kodu': m.id || '', 'Malzeme Kodu': m.materialId || '', 'Malzeme': mat?.name || '', 'İşlem': m.type || '', 'Miktar': Number(m.qty)||0, 'Kaynak Depo': depotName(m.from), 'Hedef Depo': depotName(m.to), 'Not': m.note || '', 'İşlemi Yapan': m.actor || ''};
      });
      const wb = XLSX.utils.book_new();
      const addSheet = (rows, name, widths) => {
        const ws = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([['Kayıt yok']]);
        if (widths) ws['!cols'] = widths.map(w => ({wch:w}));
        XLSX.utils.book_append_sheet(wb, ws, name);
      };
      const summary = [
        ['DEPOQR STOK RAPORU'],
        ['Rapor tarihi', new Date().toLocaleString('tr-TR')],
        ['Malzeme çeşidi', d.materials.length],
        ['Toplam stok', d.materials.reduce((s,m)=>s+(Number(m.stock)||0),0)],
        ['Kritik / stokta yok', d.materials.filter(m=>statusText(m)!=='Normal stok').length],
        ['Depo sayısı', d.depots.length],
        ['Stok hareketi', d.movements.length]
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summary);
      summaryWs['!cols'] = [{wch:28},{wch:34}];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Özet');
      addSheet(stockRows, 'Stok Listesi', [15,30,22,20,20,12,14,14,16,12,24,10,10,20,35]);
      addSheet(depotRows, 'Depolar', [14,24,36,16,16,14]);
      addSheet(moveRows, 'Stok Hareketleri', [22,16,16,30,14,12,22,22,32,20]);
      XLSX.writeFile(wb, 'DepoQR-Stok-Raporu-' + new Date().toISOString().slice(0,10) + '.xlsx');
    } catch (e) {
      console.error(e);
      alert('Excel oluşturulamadı. İnternet bağlantısını kontrol edip tekrar deneyin.');
    }
  }

  function install() {
    cleanTopbarSearches();
    const excel = document.getElementById('excelExportPro');
    if (excel && !excel.dataset.fixed) {
      excel.dataset.fixed = '1';
      const replacement = excel.cloneNode(true);
      replacement.id = 'excelExportPro';
      replacement.addEventListener('click', exportExcelFixed);
      excel.replaceWith(replacement);
    }
  }

  const observer = new MutationObserver(() => install());
  window.addEventListener('load', () => { install(); observer.observe(document.body, {childList:true, subtree:true}); });
})();

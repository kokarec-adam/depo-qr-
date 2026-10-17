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

  // --- Saha ilk sürüm: QR ile açılan malzeme kartında büyük ve basit stok işlemleri ---
  function installSahaActions() {
    const modal = document.getElementById('modalBackdrop');
    const eyebrow = document.getElementById('modalEyebrow');
    const body = document.getElementById('modalBody');
    if (!modal || !eyebrow || !body || !modal.classList.contains('open')) return;
    const label = String(eyebrow.textContent || '');
    if (!label.startsWith('MALZEME KARTI')) return;
    if (body.querySelector('.dq-field-actions[data-saha-v1="1"]')) return;

    const old = body.querySelector('.dq-field-actions');
    if (old) old.remove();

    if (!document.getElementById('dqSahaStyle')) {
      const s = document.createElement('style');
      s.id = 'dqSahaStyle';
      s.textContent = `
        .dq-field-actions{margin:0 0 18px;padding:14px;border:1px solid #263646;border-radius:14px;background:#0f1720}
        .dq-field-actions-title{font-size:11px;letter-spacing:.12em;color:#7f93a7;font-weight:800;margin-bottom:10px}
        .dq-field-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
        .dq-field-btn{min-height:78px;border:1px solid #304153;background:#16212d;color:#eef4f9;border-radius:11px;padding:9px 7px;font:700 13px/1.2 DM Sans,system-ui,sans-serif;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
        .dq-field-btn span{font-size:25px;line-height:1}.dq-field-btn:hover{border-color:#6fa7ff;transform:translateY(-1px)}
        .dq-field-btn.primary{background:#1b3049;border-color:#42678e}.dq-field-btn.warn{background:#30251b;border-color:#6d5130}.dq-field-btn.move{background:#241f34;border-color:#4e4770}.dq-field-btn.count{background:#19302b;border-color:#3e685e}
        .dq-saha-box{padding:4px 0}.dq-saha-current{display:flex;justify-content:space-between;gap:14px;padding:14px 16px;border:1px solid #dfe7ef;border-radius:12px;background:#f7f9fc;margin-bottom:16px}.dq-saha-current span{color:#6f7d8d;font-size:13px}.dq-saha-current strong{font-size:22px;color:#182432}.dq-saha-help{margin:-6px 0 16px;color:#718093;font-size:13px;line-height:1.45}.dq-saha-error{min-height:20px;margin-top:9px;color:#b42332;font-size:13px;font-weight:700}
        @media(max-width:700px){.dq-field-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dq-field-btn{min-height:88px;font-size:14px}.dq-field-actions{padding:12px}.modal{width:min(96vw,720px)}}
      `;
      document.head.appendChild(s);
    }

    const wrap = document.createElement('div');
    wrap.className = 'dq-field-actions';
    wrap.dataset.sahaV1 = '1';
    wrap.innerHTML = `
      <div class="dq-field-actions-title">SAHA HIZLI İŞLEMLERİ</div>
      <div class="dq-field-grid">
        <button type="button" class="dq-field-btn count" data-saha-op="count"><span>✓</span>Sayım</button>
        <button type="button" class="dq-field-btn primary" data-saha-op="in"><span>＋</span>Stok ekle</button>
        <button type="button" class="dq-field-btn warn" data-saha-op="out"><span>−</span>Stok çıkar</button>
        <button type="button" class="dq-field-btn move" data-saha-op="transfer"><span>↔</span>Depo taşı</button>
      </div>`;
    body.prepend(wrap);

    wrap.addEventListener('click', e => {
      const btn = e.target.closest('[data-saha-op]');
      if (!btn) return;
      openSahaOperation(btn.dataset.sahaOp, extractMaterialId(label));
    });
  }

  function extractMaterialId(label) {
    const m = String(label || '').match(/(MLZ-[A-Z0-9_-]+)/i);
    return m ? m[1] : '';
  }

  function sahaData() {
    try {
      const d = JSON.parse(localStorage.getItem('depoqr_v1') || 'null');
      if (d && Array.isArray(d.materials) && Array.isArray(d.depots) && Array.isArray(d.movements)) return d;
    } catch (_) {}
    return null;
  }

  function sahaEsc(v) {
    return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function sahaNum(v) {
    return new Intl.NumberFormat('tr-TR',{maximumFractionDigits:3}).format(Number(v)||0);
  }

  function sahaNextId(rows, prefix) {
    const max = Math.max(0, ...rows.map(x => Number((String(x.id || '').match(/(\d+)$/)||[])[1]) || 0));
    return prefix + String(max + 1).padStart(4,'0');
  }

  function openSahaOperation(op, materialId) {
    const d = sahaData();
    const mat = d?.materials.find(x => x.id === materialId);
    if (!d || !mat) { alert('Malzeme kaydı bulunamadı.'); return; }

    const titles = {count:'Saha sayımı',in:'Stok ekle',out:'Stok çıkar',transfer:'Depo taşı'};
    const eyebrow = {count:'SAHA SAYIMI',in:'SAHA STOK GİRİŞİ',out:'SAHA STOK ÇIKIŞI',transfer:'SAHA DEPO TAŞIMA'}[op];
    let body = '';

    if (op === 'count') {
      body = `<div class="dq-saha-box"><div class="dq-saha-current"><span>Sistemde görünen stok</span><strong>${sahaNum(mat.stock)} ${sahaEsc(mat.unit)}</strong></div><div class="dq-saha-help">Rafı fiziksel olarak say ve gördüğün gerçek miktarı yaz. Sistem farkı otomatik olarak düzeltme hareketi olarak kaydeder.</div><div class="field"><label for="dqSahaQty">Gerçek stok miktarı</label><input id="dqSahaQty" type="number" min="0" step="any" value="${sahaEsc(mat.stock)}" inputmode="decimal"></div><div class="field"><label for="dqSahaNote">Not</label><input id="dqSahaNote" type="text" maxlength="200" placeholder="İsteğe bağlı not"></div><div id="dqSahaError" class="dq-saha-error"></div></div>`;
    } else if (op === 'transfer') {
      const opts = d.depots.filter(x => x.id !== mat.depotId).map(x => `<option value="${sahaEsc(x.id)}">${sahaEsc(x.id)} · ${sahaEsc(x.name)}</option>`).join('');
      body = `<div class="dq-saha-box"><div class="dq-saha-current"><span>Taşınacak malzeme</span><strong>${sahaNum(mat.stock)} ${sahaEsc(mat.unit)}</strong></div><div class="dq-saha-help">İlk saha sürümünde malzeme kartının tamamı yeni depoya taşınır. Stok miktarı değişmez.</div><div class="field"><label for="dqSahaDepot">Hedef depo</label><select id="dqSahaDepot">${opts || '<option value="">Başka depo yok</option>'}</select></div><div class="field"><label for="dqSahaNote">Not</label><input id="dqSahaNote" type="text" maxlength="200" placeholder="İsteğe bağlı not"></div><div id="dqSahaError" class="dq-saha-error"></div></div>`;
    } else {
      body = `<div class="dq-saha-box"><div class="dq-saha-current"><span>Mevcut stok</span><strong>${sahaNum(mat.stock)} ${sahaEsc(mat.unit)}</strong></div><div class="field"><label for="dqSahaQty">Miktar</label><input id="dqSahaQty" type="number" min="0.001" step="any" required placeholder="0" inputmode="decimal"></div><div class="dq-saha-help">${op === 'out' ? 'Mevcut stoktan fazla miktar çıkarılamaz.' : 'Pozitif bir miktar gir.'}</div><div class="field"><label for="dqSahaNote">Not</label><input id="dqSahaNote" type="text" maxlength="200" placeholder="İsteğe bağlı not"></div><div id="dqSahaError" class="dq-saha-error"></div></div>`;
    }

    const modal = document.getElementById('modalBackdrop');
    const title = document.getElementById('modalTitle');
    const eb = document.getElementById('modalEyebrow');
    const mb = document.getElementById('modalBody');
    const mf = document.getElementById('modalFooter');
    if (!modal || !title || !eb || !mb || !mf) return;
    title.textContent = titles[op];
    eb.textContent = eyebrow;
    mb.innerHTML = body;
    mf.innerHTML = `<button class="secondary-button" id="dqSahaCancel">Vazgeç</button><button class="primary-button" id="dqSahaSave">✓ Kaydet</button>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    document.getElementById('dqSahaCancel').addEventListener('click', () => { document.getElementById('modalClose')?.click(); });
    document.getElementById('dqSahaSave').addEventListener('click', () => saveSahaOperation(op, materialId));
    const first = mb.querySelector('input,select');
    if (first) setTimeout(() => first.focus(), 50);
  }

  function saveSahaOperation(op, materialId) {
    const d = sahaData();
    const mat = d?.materials.find(x => x.id === materialId);
    if (!d || !mat) return;
    const err = document.getElementById('dqSahaError');
    const fail = msg => { if (err) err.textContent = msg; };
    const note = document.getElementById('dqSahaNote')?.value.trim() || '';
    const now = new Date().toISOString();
    const actor = 'Saha';
    const oldStock = Number(mat.stock) || 0;

    if (op === 'count') {
      const actual = Number(document.getElementById('dqSahaQty')?.value);
      if (!Number.isFinite(actual) || actual < 0) return fail('Geçerli bir stok miktarı gir.');
      const diff = actual - oldStock;
      mat.stock = actual;
      d.movements.push({id:sahaNextId(d.movements,'HRK-'),date:now,materialId:mat.id,type:'Düzeltme',qty:Math.abs(diff),from:diff<0?mat.depotId:'',to:diff>0?mat.depotId:'',note:note || `Saha sayımı: ${sahaNum(oldStock)} → ${sahaNum(actual)}`,actor});
    } else if (op === 'in') {
      const qty = Number(document.getElementById('dqSahaQty')?.value);
      if (!Number.isFinite(qty) || qty <= 0) return fail('Pozitif bir miktar gir.');
      mat.stock = oldStock + qty;
      d.movements.push({id:sahaNextId(d.movements,'HRK-'),date:now,materialId:mat.id,type:'Giriş',qty,from:'',to:mat.depotId,note,actor});
    } else if (op === 'out') {
      const qty = Number(document.getElementById('dqSahaQty')?.value);
      if (!Number.isFinite(qty) || qty <= 0) return fail('Pozitif bir miktar gir.');
      if (qty > oldStock) return fail(`Stok yetersiz. Mevcut: ${sahaNum(oldStock)} ${mat.unit}`);
      mat.stock = oldStock - qty;
      d.movements.push({id:sahaNextId(d.movements,'HRK-'),date:now,materialId:mat.id,type:'Çıkış',qty,from:mat.depotId,to:'',note,actor});
    } else if (op === 'transfer') {
      const target = document.getElementById('dqSahaDepot')?.value;
      if (!target || target === mat.depotId) return fail('Farklı bir hedef depo seç.');
      const from = mat.depotId;
      mat.depotId = target;
      d.movements.push({id:sahaNextId(d.movements,'HRK-'),date:now,materialId:mat.id,type:'Transfer',qty:oldStock,from,to:target,note:note || 'Saha depo taşıma',actor});
    }

    try {
      localStorage.setItem(KEY, JSON.stringify(d));
      document.getElementById('modalClose')?.click();
      window.location.reload();
    } catch (_) {
      fail('Kayıt yapılamadı. Telefonun depolama alanını kontrol et.');
    }
  }

  const sahaObserver = new MutationObserver(() => installSahaActions());
  window.addEventListener('load', () => {
    const modal = document.getElementById('modalBackdrop');
    if (modal) sahaObserver.observe(modal, {attributes:true, childList:true, subtree:true});
    setTimeout(installSahaActions, 700);
  });
})();

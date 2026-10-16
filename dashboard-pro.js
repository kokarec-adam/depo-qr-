(() => {
  'use strict';
  const KEY = 'depoqr_v1';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const num = v => new Intl.NumberFormat('tr-TR',{maximumFractionDigits:3}).format(Number(v)||0);
  const date = v => { const d=new Date(v); return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d); };
  const load = () => { try { const x=JSON.parse(localStorage.getItem(KEY)||'null'); if(x?.materials&&x?.depots&&x?.movements) return x; } catch(_){} return {materials:[],depots:[],movements:[]}; };
  const status = m => Number(m.stock)<=0?'zero':(Number(m.minStock)>0&&Number(m.stock)<=Number(m.minStock)?'critical':'normal');
  const depotName = (d,id) => d.find(x=>x.id===id)?.name || id || '—';

  function injectStyle(){
    if(document.getElementById('depoqr-pro-style')) return;
    const s=document.createElement('style'); s.id='depoqr-pro-style'; s.textContent=`
      .pro-dashboard{margin-top:24px;display:grid;gap:18px}
      .pro-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 2px}
      .pro-toolbar h2{margin:0;font-size:22px;color:#182b3f}.pro-toolbar p{margin:5px 0 0;color:#6f8195;font-size:14px}
      .excel-button{border:0;border-radius:12px;background:#0f6b4f;color:#fff;font-weight:800;font-size:15px;padding:14px 19px;cursor:pointer;box-shadow:0 8px 18px rgba(15,107,79,.15);display:flex;align-items:center;gap:9px}
      .excel-button:hover{transform:translateY(-1px);filter:brightness(1.03)}
      .pro-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
      .pro-panel{background:#fff;border:1px solid #dfe7ef;border-radius:18px;box-shadow:0 7px 24px rgba(24,43,63,.05);overflow:hidden}
      .pro-panel-head{padding:20px 22px;border-bottom:1px solid #e8edf3;display:flex;justify-content:space-between;align-items:center;gap:12px}
      .pro-panel-head h3{margin:0;font-size:18px;color:#1b3046}.pro-panel-head span{font-size:13px;color:#8191a2}
      .pro-table{width:100%;border-collapse:collapse}.pro-table th{padding:12px 18px;text-align:left;font-size:11px;letter-spacing:.08em;color:#8191a2;background:#f7f9fb}.pro-table td{padding:15px 18px;border-top:1px solid #edf1f5;font-size:14px;color:#2d4155}.pro-table tr:first-child td{border-top:0}
      .pro-name{font-weight:800;color:#1d3349}.pro-muted{display:block;color:#8494a5;font-size:12px;margin-top:3px}.pro-number{font-weight:900;font-size:16px}.pro-badge{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:12px;font-weight:800}.pro-badge.normal{background:#e8f7ef;color:#176b4a}.pro-badge.critical{background:#fff2d9;color:#9a6200}.pro-badge.zero{background:#fde8e8;color:#a33131}
      .pro-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.pro-mini{background:#fff;border:1px solid #dfe7ef;border-radius:16px;padding:17px 18px}.pro-mini small{display:block;color:#7b8da0;font-size:12px;font-weight:700}.pro-mini strong{display:block;margin-top:7px;font-size:24px;color:#1c3046}
      .pro-empty{padding:30px;text-align:center;color:#8494a5;font-size:14px}
      @media(max-width:1000px){.pro-grid{grid-template-columns:1fr}.pro-summary{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){.pro-toolbar{align-items:stretch;flex-direction:column}.excel-button{width:100%;justify-content:center}.pro-summary{grid-template-columns:1fr}.pro-table{min-width:620px}.pro-panel{overflow:auto}}
    `; document.head.appendChild(s);
  }

  function ensureUI(){
    injectStyle();
    const top=document.querySelector('.topbar-actions');
    if(top && !document.getElementById('excelExportPro')){
      const b=document.createElement('button'); b.id='excelExportPro'; b.className='excel-button'; b.innerHTML='▣ Excel indir'; b.title='Tüm stok ve hareket verilerini Excel olarak indir'; b.addEventListener('click',exportExcel); top.insertBefore(b,top.firstChild);
    }
    const dash=document.getElementById('view-dashboard');
    if(!dash || document.getElementById('proDashboard')) return;
    const section=document.createElement('section'); section.id='proDashboard'; section.className='pro-dashboard';
    section.innerHTML=`
      <div class="pro-toolbar"><div><h2>Yönetim Özeti</h2><p>Stok, depo ve kritik malzeme durumunu tek bakışta kontrol et.</p></div><span id="proUpdated"></span></div>
      <div class="pro-summary" id="proSummary"></div>
      <div class="pro-grid">
        <section class="pro-panel"><div class="pro-panel-head"><div><h3>Depo bazında stok</h3><span>Her lokasyondaki toplam miktar ve kritik kayıtlar</span></div></div><div class="table-wrap"><table class="pro-table"><thead><tr><th>DEPO</th><th>MALZEME</th><th>STOK</th><th>KRİTİK</th></tr></thead><tbody id="proDepotTable"></tbody></table></div></section>
        <section class="pro-panel"><div class="pro-panel-head"><div><h3>Kritik stoklar</h3><span>Öncelikli kontrol listesi</span></div></div><div class="table-wrap"><table class="pro-table"><thead><tr><th>MALZEME</th><th>STOK</th><th>MİN.</th><th>DURUM</th></tr></thead><tbody id="proCriticalTable"></tbody></table></div></section>
      </div>
      <section class="pro-panel"><div class="pro-panel-head"><div><h3>Son stok hareketleri</h3><span>En son giriş, çıkış ve transfer kayıtları</span></div></div><div class="table-wrap"><table class="pro-table"><thead><tr><th>TARİH</th><th>MALZEME</th><th>İŞLEM</th><th>MİKTAR</th><th>LOKASYON</th></tr></thead><tbody id="proMovementTable"></tbody></table></div></section>
    `;
    const stats=dash.querySelector('.stats-grid'); stats?.insertAdjacentElement('afterend',section);
  }

  function render(){
    const d=load(); ensureUI();
    const mats=d.materials||[], depots=d.depots||[], moves=d.movements||[];
    const total=mats.reduce((s,m)=>s+(Number(m.stock)||0),0), critical=mats.filter(m=>status(m)!=='normal'), zero=mats.filter(m=>status(m)==='zero');
    const cats=new Set(mats.map(m=>m.category).filter(Boolean));
    const summary=[['Malzeme çeşidi',mats.length],['Toplam stok',total],['Kritik / eksik',critical.length],['Kategori',cats.size]];
    document.getElementById('proSummary').innerHTML=summary.map(x=>`<div class="pro-mini"><small>${esc(x[0])}</small><strong>${num(x[1])}</strong></div>`).join('');
    document.getElementById('proUpdated').textContent='Güncellendi: '+new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(new Date());
    document.getElementById('proDepotTable').innerHTML=depots.map(x=>{const ms=mats.filter(m=>m.depotId===x.id);return `<tr><td><span class="pro-name">${esc(x.name)}</span><span class="pro-muted">${esc(x.id)}</span></td><td>${num(ms.length)}</td><td><span class="pro-number">${num(ms.reduce((s,m)=>s+(Number(m.stock)||0),0))}</span></td><td>${ms.filter(m=>status(m)!=='normal').length?`<span class="pro-badge critical">${ms.filter(m=>status(m)!=='normal').length}</span>`:'<span class="pro-badge normal">0</span>'}</td></tr>`}).join('') || '<tr><td colspan="4"><div class="pro-empty">Henüz depo kaydı yok.</div></td></tr>';
    const crit=[...critical].sort((a,b)=>(Number(a.stock)-Number(a.minStock))-(Number(b.stock)-Number(b.minStock))).slice(0,8);
    document.getElementById('proCriticalTable').innerHTML=crit.length?crit.map(m=>`<tr><td><span class="pro-name">${esc(m.name)}</span><span class="pro-muted">${esc(m.id)} · ${esc(depotName(depots,m.depotId))}</span></td><td class="pro-number">${num(m.stock)} ${esc(m.unit)}</td><td>${num(m.minStock)}</td><td><span class="pro-badge ${status(m)}">${status(m)==='zero'?'Stokta yok':'Kritik'}</span></td></tr>`).join(''):'<tr><td colspan="4"><div class="pro-empty">Kritik stok bulunmuyor. 👍</div></td></tr>';
    const recent=[...moves].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,8);
    document.getElementById('proMovementTable').innerHTML=recent.length?recent.map(m=>{const mat=mats.find(x=>x.id===m.materialId);const loc=m.type==='Transfer'?`${depotName(depots,m.from)} → ${depotName(depots,m.to)}`:(m.type==='Giriş'?depotName(depots,m.to):depotName(depots,m.from||mat?.depotId));return `<tr><td>${esc(date(m.date))}</td><td><span class="pro-name">${esc(mat?.name||m.materialId)}</span><span class="pro-muted">${esc(m.materialId)}</span></td><td><span class="pro-badge ${m.type==='Giriş'?'normal':m.type==='Çıkış'?'zero':'critical'}">${esc(m.type)}</span></td><td class="pro-number">${m.type==='Giriş'?'+':m.type==='Çıkış'?'-':''}${num(m.qty)} ${esc(mat?.unit||'')}</td><td>${esc(loc)}</td></tr>`}).join(''):'<tr><td colspan="5"><div class="pro-empty">Henüz hareket kaydı yok.</div></td></tr>';
  }

  async function exportExcel(){
    const d=load();
    try{
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
      const wb=XLSX.utils.book_new();
      const depotName=id=>d.depots.find(x=>x.id===id)?.name||id||'';
      const statusText=m=>Number(m.stock)<=0?'Stokta yok':(Number(m.minStock)>0&&Number(m.stock)<=Number(m.minStock)?'Kritik stok':'Normal stok');
      const stockRows=d.materials.map(m=>({
        'Malzeme Kodu':m.id,'Malzeme Adı':m.name,'Kategori':m.category,'Marka':m.brand,'Model / Ölçü':m.model,'Birim':m.unit,'Mevcut Stok':Number(m.stock)||0,'Minimum Stok':Number(m.minStock)||0,'Durum':statusText(m),'Depo Kodu':m.depotId,'Depo':depotName(m.depotId),'Raf':m.shelf,'Göz':m.bin,'Konum': [m.depotId,m.shelf,m.bin].filter(Boolean).join('-'),'Not':m.notes||''
      }));
      const depotRows=d.depots.map(x=>{const ms=d.materials.filter(m=>m.depotId===x.id);return {'Depo Kodu':x.id,'Depo':x.name,'Açıklama':x.description||'','Malzeme Çeşidi':ms.length,'Toplam Stok':ms.reduce((s,m)=>s+(Number(m.stock)||0),0),'Kritik Kayıt':ms.filter(m=>statusText(m)!=='Normal stok').length};});
      const moveRows=d.movements.map(m=>{const mat=d.materials.find(x=>x.id===m.materialId);return {'Tarih':date(m.date),'Hareket Kodu':m.id,'Malzeme Kodu':m.materialId,'Malzeme':mat?.name||'','İşlem':m.type,'Miktar':Number(m.qty)||0,'Kaynak Depo':depotName(m.from),'Hedef Depo':depotName(m.to),'Not':m.note||'','İşlemi Yapan':m.actor||''};});
      const summary=[['DEPOQR STOK RAPORU'],['Rapor tarihi',new Date().toLocaleString('tr-TR')],['Malzeme çeşidi',d.materials.length],['Toplam stok',d.materials.reduce((s,m)=>s+(Number(m.stock)||0),0)],['Kritik / stokta yok',d.materials.filter(m=>statusText(m)!=='Normal stok').length],['Depo sayısı',d.depots.length],[]];
      const add=(rows,name,widths)=>{const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=widths.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,name);};
      add(stockRows,'Stok Listesi',[15,30,22,20,20,12,14,14,16,12,24,10,10,20,35]);
      add(depotRows,'Depolar',[14,24,36,16,16,14]);
      add(moveRows,'Stok Hareketleri',[22,16,16,30,14,12,22,22,32,20]);
      const ws=XLSX.utils.aoa_to_sheet(summary);ws['!cols']=[{wch:24},{wch:34}];XLSX.utils.book_append_sheet(wb,ws,'Özet');
      XLSX.writeFile(wb,'DepoQR-Stok-Raporu-'+new Date().toISOString().slice(0,10)+'.xlsx',{compression:true});
    }catch(e){console.error(e);alert('Excel oluşturulamadı. İnternet bağlantısını kontrol edip tekrar deneyin.');}
  }

  function start(){ ensureUI(); render(); setInterval(render,2000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();

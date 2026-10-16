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
      .pro-dashboard{margin-top:24px;display:grid;gap:18px;animation:depoqrFadeUp .45s ease both}
      .pro-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 2px}
      .pro-toolbar h2{margin:0;font-size:25px;color:#182b3f}.pro-toolbar p{margin:5px 0 0;color:#6f8195;font-size:16px}
      .excel-button{border:0;border-radius:12px;background:#0f6b4f;color:#fff;font-weight:800;font-size:16px;padding:14px 19px;cursor:pointer;box-shadow:0 8px 18px rgba(15,107,79,.15);display:flex;align-items:center;gap:9px;transition:transform .18s ease,box-shadow .18s ease,filter .18s ease}.excel-button:hover{transform:translateY(-2px);filter:brightness(1.04);box-shadow:0 11px 24px rgba(15,107,79,.22)}.excel-button:active{transform:translateY(0) scale(.98)}
      .pro-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}
      .pro-panel{background:#fff;border:1px solid #dfe7ef;border-radius:18px;box-shadow:0 7px 24px rgba(24,43,63,.05);overflow:hidden;transition:transform .2s ease,box-shadow .2s ease}.pro-panel:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(24,43,63,.08)}
      .pro-panel-head{padding:20px 22px;border-bottom:1px solid #e8edf3;display:flex;justify-content:space-between;align-items:center;gap:12px}
      .pro-panel-head h3{margin:0;font-size:20px;color:#1b3046}.pro-panel-head span{font-size:14px;color:#8191a2}
      .pro-table{width:100%;border-collapse:collapse}.pro-table th{padding:12px 18px;text-align:left;font-size:11px;letter-spacing:.08em;color:#8191a2;background:#f7f9fb}.pro-table td{padding:15px 18px;border-top:1px solid #edf1f5;font-size:14px;color:#2d4155}.pro-table tr:first-child td{border-top:0}
      .pro-name{font-weight:800;color:#1d3349}.pro-muted{display:block;color:#8494a5;font-size:12px;margin-top:3px}.pro-number{font-weight:900;font-size:16px}.pro-badge{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:12px;font-weight:800}.pro-badge.normal{background:#e8f7ef;color:#176b4a}.pro-badge.critical{background:#fff2d9;color:#9a6200}.pro-badge.zero{background:#fde8e8;color:#a33131}
      .stats-grid .stat-card.critical-stat-clickable{cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}.stats-grid .stat-card.critical-stat-clickable:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(154,98,0,.13);border-color:#f0d8ad}.stats-grid .stat-card.critical-stat-clickable:focus-visible{outline:3px solid #e6a23c;outline-offset:3px}
      .pro-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.pro-mini[data-critical-open]{cursor:pointer;border-color:#f0d8ad;background:linear-gradient(135deg,#fff 0%,#fffaf0 100%)}.pro-mini[data-critical-open]:hover{transform:translateY(-3px);box-shadow:0 10px 22px rgba(154,98,0,.12)}.pro-mini[data-critical-open] small:after{content:' · Tıkla';color:#b87812;font-weight:800}.pro-mini{background:#fff;border:1px solid #dfe7ef;border-radius:16px;padding:17px 18px;transition:transform .2s ease,box-shadow .2s ease}.pro-mini:hover{transform:translateY(-3px);box-shadow:0 10px 22px rgba(24,43,63,.08)}.pro-mini small{display:block;color:#7b8da0;font-size:12px;font-weight:700}.pro-mini strong{display:block;margin-top:7px;font-size:27px;color:#1c3046}
      .pro-empty{padding:30px;text-align:center;color:#8494a5;font-size:14px}
      .global-search{position:relative;display:flex;align-items:center;gap:9px;width:min(340px,30vw);height:52px;padding:0 14px;background:#f7f9fb;border:2px solid #dfe7ef;border-radius:13px;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}.global-search:focus-within{border-color:#76a9f5;box-shadow:0 0 0 4px rgba(40,120,238,.11);transform:translateY(-1px)}.global-search-icon{font-size:24px;color:#6d8298}.global-search input{width:100%;border:0;outline:0;background:transparent;color:#2c4258;font-size:17px;font-weight:600}.global-search input::placeholder{color:#92a0ae}.global-search button{border:0;background:transparent;color:#5b7da4;font-size:20px;padding:5px;border-radius:8px}.global-search button:hover{background:#eaf2ff;color:#2878ee}
      .global-results{position:absolute;top:60px;right:0;width:360px;max-height:360px;overflow:auto;background:#fff;border:1px solid #dfe7ef;border-radius:14px;box-shadow:0 18px 45px rgba(22,42,64,.18);padding:7px;z-index:100;display:none}.global-results.show{display:block;animation:depoqrPop .16s ease both}.global-result{display:flex;align-items:center;gap:12px;width:100%;border:0;background:#fff;text-align:left;padding:12px;border-radius:10px;color:#20364c;transition:background .15s ease,transform .15s ease}.global-result:hover{background:#f3f7fc;transform:translateX(2px)}.global-result strong{display:block;font-size:15px}.global-result small{display:block;color:#8797a6;margin-top:2px}.global-empty{padding:18px;color:#8a99a8;text-align:center;font-size:14px}
      .depot-card[data-depot-open]{cursor:pointer;transition:background .18s ease,transform .18s ease,box-shadow .18s ease,border-color .18s ease}.depot-card[data-depot-open]:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(24,43,63,.11);border-color:#b9d1f5}.depot-card[data-depot-open]:focus-visible{outline:3px solid #76a9f5;outline-offset:3px}.depot-row{cursor:pointer;transition:background .18s ease,transform .18s ease,padding-left .18s ease}.depot-row:hover{background:#f7faff;transform:translateX(4px);padding-left:8px}.depot-row:active{transform:scale(.995)}
      .quick-panel{position:relative}.quick-panel .panel-heading{margin-bottom:16px}.quick-actions{gap:8px}.quick-action{padding:17px 10px;border:1px solid transparent;transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease}.quick-action:hover{background:#f6f9fd;border-color:#e0e8f1;transform:translateX(5px);box-shadow:0 6px 16px rgba(35,60,90,.06)}.quick-action:active{transform:scale(.985)}.quick-action strong{font-size:19px}.quick-action small{font-size:15px}.quick-icon{width:56px;height:56px;font-size:27px;transition:transform .2s ease}.quick-action:hover .quick-icon{transform:scale(1.07) rotate(-2deg)}
      .depot-inventory-backdrop{position:fixed;inset:0;background:rgba(10,22,35,.48);backdrop-filter:blur(4px);z-index:200;display:grid;place-items:center;padding:24px;animation:depoqrFade .2s ease}.depot-inventory-card{width:min(900px,100%);max-height:min(760px,90vh);overflow:hidden;background:#fff;border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.24);animation:depoqrPop .22s ease}.depot-inventory-head{display:flex;align-items:center;justify-content:space-between;padding:24px 28px;border-bottom:1px solid #e7edf3}.depot-inventory-head h2{margin:0;font:800 28px Manrope,sans-serif;color:#172b40}.depot-inventory-head p{margin:4px 0 0;color:#7b8c9d;font-size:15px}.depot-inventory-close{width:44px;height:44px;border:1px solid #dce5ed;background:#fff;border-radius:11px;font-size:28px;color:#61778b;transition:.18s}.depot-inventory-close:hover{background:#f2f6fa;transform:rotate(4deg)}.depot-inventory-body{padding:8px 28px 24px;overflow:auto;max-height:calc(min(760px,90vh) - 110px)}.depot-inventory-row{display:flex;align-items:center;gap:15px;padding:16px 4px;border-bottom:1px solid #edf1f5}.depot-inventory-row:last-child{border-bottom:0}.depot-inventory-art{width:48px;height:48px;border-radius:12px;background:#edf4ff;color:#3f7fe6;display:grid;place-items:center;font-size:22px;flex-shrink:0}.depot-inventory-main{flex:1}.depot-inventory-main strong{display:block;font-size:17px;color:#21374d}.depot-inventory-main small{display:block;color:#8999a8;margin-top:3px}.depot-inventory-stock{font:800 18px Manrope,sans-serif;color:#21374d;text-align:right}.depot-inventory-stock small{display:block;font:500 12px 'DM Sans',sans-serif;color:#8b99a7;margin-top:2px}
      button,.nav-item,.icon-button,.primary-button,.secondary-button,.small-icon-btn{transition:transform .16s ease,box-shadow .16s ease,background-color .16s ease,border-color .16s ease,color .16s ease}.primary-button:hover,.secondary-button:hover,.icon-button:hover,.small-icon-btn:hover{transform:translateY(-2px);box-shadow:0 7px 18px rgba(30,60,90,.10)}button:active,.nav-item:active{transform:scale(.98)}
      @keyframes depqorFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes depqorFade{from{opacity:0}to{opacity:1}}@keyframes depqorPop{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:none}}
      @media(max-width:1180px){.global-search{width:260px}.pro-grid{grid-template-columns:1fr}.pro-summary{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:760px){.global-search{display:none}.pro-toolbar{align-items:stretch;flex-direction:column}.excel-button{width:100%;justify-content:center}.pro-summary{grid-template-columns:1fr 1fr}.depot-inventory-backdrop{padding:10px}.depot-inventory-head{padding:19px}.depot-inventory-body{padding:8px 19px 20px}.depot-inventory-stock{font-size:16px}}
      @media(max-width:620px){.pro-summary{grid-template-columns:1fr}.pro-table{min-width:620px}.pro-panel{overflow:auto}.global-results{width:min(360px,calc(100vw - 30px));right:-8px}}
    `; document.head.appendChild(s);
  }

  function ensureUI(){
    injectStyle();
    const criticalStat=document.getElementById('statCritical')?.closest('.stat-card');
    if(criticalStat&&!criticalStat.dataset.criticalClickBound){
      criticalStat.dataset.criticalClickBound='1';
      criticalStat.classList.add('critical-stat-clickable');
      criticalStat.setAttribute('role','button');
      criticalStat.setAttribute('tabindex','0');
      criticalStat.setAttribute('aria-label','Kritik stok listesini aç');
      const open=()=>openCriticalInventory();
      criticalStat.addEventListener('click',open);
      criticalStat.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    }
    const top=document.querySelector('.topbar-actions');
    if(top && !document.getElementById('globalMaterialSearch')){
      const wrap=document.createElement('div'); wrap.className='global-search'; wrap.id='globalMaterialSearch';
      wrap.innerHTML='<span class="global-search-icon">⌕</span><input id="globalSearchInput" type="search" placeholder="Malzeme ara..." autocomplete="off" aria-label="Malzeme ara"><button id="globalSearchClear" type="button" aria-label="Aramayı temizle">×</button><div class="global-results" id="globalSearchResults"></div>';
      top.insertBefore(wrap,top.firstChild);
      const input=wrap.querySelector('#globalSearchInput'), results=wrap.querySelector('#globalSearchResults');
      const search=()=>{const q=input.value.trim().toLocaleLowerCase('tr-TR'); if(!q){results.classList.remove('show');results.innerHTML='';return;} const d=load(), list=d.materials.filter(m=>[m.name,m.id,m.category,m.brand,m.model,m.shelf,m.bin].join(' ').toLocaleLowerCase('tr-TR').includes(q)).slice(0,8); results.innerHTML=list.length?list.map(m=>`<button class="global-result" data-global-material="${esc(m.id)}"><span class="depot-inventory-art">⌕</span><span><strong>${esc(m.name)}</strong><small>${esc(m.id)} · ${esc(depotName(d.depots,m.depotId))} · ${esc([m.shelf,m.bin].filter(Boolean).join('-')||'Konum yok')}</small></span></button>`).join(''):'<div class="global-empty">Bu isim veya kodla malzeme bulunamadı.</div>'; results.classList.add('show');};
      input.addEventListener('input',search); input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=results.querySelector('[data-global-material]');if(first) first.click(); else {document.querySelector('[data-view="materials"]')?.click(); const target=document.getElementById('materialSearch');if(target){target.value=input.value;target.dispatchEvent(new Event('input',{bubbles:true}));}}} if(e.key==='Escape'){results.classList.remove('show');}});
      wrap.querySelector('#globalSearchClear').addEventListener('click',()=>{input.value='';results.classList.remove('show');results.innerHTML='';input.focus();});
      results.addEventListener('click',e=>{const b=e.target.closest('[data-global-material]');if(!b)return; const id=b.dataset.globalMaterial; results.classList.remove('show'); input.value=''; document.querySelector('[data-view="materials"]')?.click(); setTimeout(()=>{const row=document.querySelector(`[data-action="view"][data-id="${CSS.escape(id)}"]`); if(row)row.click();},80);});
      document.addEventListener('click',e=>{if(!wrap.contains(e.target))results.classList.remove('show');});
    }
    if(top && !document.getElementById('excelExportPro')){
      const b=document.createElement('button'); b.id='excelExportPro'; b.className='excel-button'; b.innerHTML='▣ Excel indir'; b.title='Tüm stok ve hareket verilerini Excel olarak indir'; b.addEventListener('click',exportExcel); top.insertBefore(b,top.querySelector('.system-pill')||top.firstChild);
    }
    const dash=document.getElementById('view-dashboard');
    if(!dash || document.getElementById('proDashboard')) return;
    const section=document.createElement('section'); section.id='proDashboard'; section.className='pro-dashboard';
    section.innerHTML=`
      <div class="pro-toolbar"><div><h2>Yönetim Özeti</h2><p>Stok, depo ve kritik malzeme durumunu tek bakışta kontrol et.</p></div><span id="proUpdated"></span></div>
      <div class="pro-summary" id="proSummary"></div>
      <div class="pro-grid">
        <section class="pro-panel"><div class="pro-panel-head"><div><h3>Depo bazında stok</h3><span>Her lokasyondaki toplam miktar ve kritik kayıtlar</span></div></div><div class="table-wrap"><table class="pro-table"><thead><tr><th>DEPO</th><th>MALZEME</th><th>STOK</th><th>KRİTİK</th></tr></thead><tbody id="proDepotTable"></tbody></table></div></section>
      </div>
      <section class="pro-panel"><div class="pro-panel-head"><div><h3>Son stok hareketleri</h3><span>En son giriş, çıkış ve transfer kayıtları</span></div></div><div class="table-wrap"><table class="pro-table"><thead><tr><th>TARİH</th><th>MALZEME</th><th>İŞLEM</th><th>MİKTAR</th><th>LOKASYON</th></tr></thead><tbody id="proMovementTable"></tbody></table></div></section>
    `;
    const stats=dash.querySelector('.stats-grid'); stats?.insertAdjacentElement('afterend',section);
    bindDepotRows();
  }

  function bindDepotRows(){
    if(document.documentElement.dataset.depotClickDelegation === '1') return;
    document.documentElement.dataset.depotClickDelegation = '1';
    const activate = row => {
      const id = row.dataset.depotId || row.dataset.depotOpen || (row.querySelector('.depot-main small')?.textContent || '').split('·')[0].trim() || row.querySelector('.depot-code')?.textContent?.trim();
      if(id) openDepotInventory(id);
    };
    document.addEventListener('click', event => {
      const editButton=event.target.closest('[data-depot-edit]');
      if(editButton) return;
      const row = event.target.closest('#dashboardDepots .depot-row, #depotCards .depot-card[data-depot-open]');
      if(row) { event.preventDefault(); activate(row); }
    });
    document.addEventListener('keydown', event => {
      const row = event.target.closest('#dashboardDepots .depot-row, #depotCards .depot-card[data-depot-open]');
      if(row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); activate(row); }
    });
  }

  function openDepotInventory(id){
    const d=load(), depot=d.depots.find(x=>x.id===id); if(!depot)return;
    const mats=d.materials.filter(m=>m.depotId===id).sort((a,b)=>a.name.localeCompare(b.name,'tr'));
    const old=document.getElementById('depotInventoryOverlay'); old?.remove();
    const overlay=document.createElement('div');overlay.id='depotInventoryOverlay';overlay.className='depot-inventory-backdrop';
    const rows=mats.length?mats.map(m=>`<div class="depot-inventory-row"><div class="depot-inventory-art">▤</div><div class="depot-inventory-main"><strong>${esc(m.name)}</strong><small>${esc(m.id)} · ${esc([m.shelf,m.bin].filter(Boolean).join('-')||'Konum yok')} · ${esc(m.category||'Kategorisiz')}</small></div><div class="depot-inventory-stock">${num(m.stock)}<small>${esc(m.unit||'Birim')}</small></div></div>`).join(''):'<div class="global-empty" style="padding:55px 10px">Bu depoda henüz malzeme bulunmuyor.</div>';
    overlay.innerHTML=`<section class="depot-inventory-card" role="dialog" aria-modal="true" aria-label="${esc(depot.name)} stokları"><header class="depot-inventory-head"><div><h2>${esc(depot.name)}</h2><p>${esc(depot.id)} · ${mats.length} malzeme çeşidi · ${num(mats.reduce((s,m)=>s+(Number(m.stock)||0),0))} toplam stok</p></div><button class="depot-inventory-close" type="button" aria-label="Kapat">×</button></header><div class="depot-inventory-body">${rows}</div></section>`;
    document.body.appendChild(overlay);
    const close=()=>overlay.remove(); overlay.querySelector('.depot-inventory-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    document.addEventListener('keydown',function escClose(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',escClose);}});
  }

  function openCriticalInventory(){
    const d=load(), mats=(d.materials||[]), depots=d.depots||[];
    const crit=mats.filter(m=>status(m)!=='normal').sort((a,b)=>(Number(a.stock)-Number(a.minStock))-(Number(b.stock)-Number(b.minStock)));
    const old=document.getElementById('criticalInventoryOverlay');old?.remove();
    const overlay=document.createElement('div');overlay.id='criticalInventoryOverlay';overlay.className='depot-inventory-backdrop';
    const rows=crit.length?'<div class="table-wrap"><table class="pro-table"><thead><tr><th>MALZEME</th><th>DEPO</th><th>MEVCUT</th><th>MİNİMUM</th><th>DURUM</th></tr></thead><tbody>'+crit.map(m=>'<tr><td><span class="pro-name">'+esc(m.name)+'</span><span class="pro-muted">'+esc(m.id)+'</span></td><td>'+esc(depotName(depots,m.depotId))+'</td><td class="pro-number">'+num(m.stock)+' '+esc(m.unit||'')+'</td><td>'+num(m.minStock)+' '+esc(m.unit||'')+'</td><td><span class="pro-badge '+status(m)+'">'+(status(m)==='zero'?'Stokta yok':'Kritik')+'</span></td></tr>').join('')+'</tbody></table></div>':'<div class="pro-empty" style="padding:40px">Kritik stok kaydı bulunamadı.</div>';
    overlay.innerHTML='<section class="depot-inventory-card" role="dialog" aria-modal="true" aria-label="Kritik stoklar"><header class="depot-inventory-head"><div><h2>⚠ Kritik stoklar</h2><p>'+crit.length+' malzeme kontrol gerektiriyor</p></div><button class="depot-inventory-close" type="button" aria-label="Kapat">×</button></header><div class="depot-inventory-body">'+rows+'</div></section>';
    document.body.appendChild(overlay);
    const close=()=>overlay.remove();overlay.querySelector('.depot-inventory-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  }

  function render(){
    const d=load(); ensureUI(); bindDepotRows();
    const mats=d.materials||[], depots=d.depots||[], moves=d.movements||[];
    const total=mats.reduce((s,m)=>s+(Number(m.stock)||0),0), critical=mats.filter(m=>status(m)!=='normal');
    const cats=new Set(mats.map(m=>m.category).filter(Boolean));
    const summary=[['Malzeme çeşidi',mats.length],['Toplam stok',total],['Kritik / eksik',critical.length],['Kategori',cats.size]];
    document.getElementById('proSummary').innerHTML=summary.map(x=>`<div class="pro-mini" ${x[0]==='Kritik / eksik'?'data-critical-open role="button" tabindex="0" aria-label="Kritik stokları göster"':''}><small>${esc(x[0])}</small><strong>${num(x[1])}</strong></div>`).join('');
    const criticalCard=document.querySelector('#proSummary [data-critical-open]');
    if(criticalCard&&!criticalCard.dataset.bound){criticalCard.dataset.bound='1';const open=()=>openCriticalInventory();criticalCard.addEventListener('click',open);criticalCard.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});}
    document.getElementById('proUpdated').textContent='Güncellendi: '+new Intl.DateTimeFormat('tr-TR',{hour:'2-digit',minute:'2-digit'}).format(new Date());
    document.getElementById('proDepotTable').innerHTML=depots.map(x=>{const ms=mats.filter(m=>m.depotId===x.id);return `<tr><td><span class="pro-name">${esc(x.name)}</span><span class="pro-muted">${esc(x.id)}</span></td><td>${num(ms.length)}</td><td><span class="pro-number">${num(ms.reduce((s,m)=>s+(Number(m.stock)||0),0))}</span></td><td>${ms.filter(m=>status(m)!=='normal').length?`<span class="pro-badge critical">${ms.filter(m=>status(m)!=='normal').length}</span>`:'<span class="pro-badge normal">0</span>'}</td></tr>`}).join('') || '<tr><td colspan="4"><div class="pro-empty">Henüz depo kaydı yok.</div></td></tr>';

    const recent=[...moves].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,8);
    document.getElementById('proMovementTable').innerHTML=recent.length?recent.map(m=>{const mat=mats.find(x=>x.id===m.materialId);const loc=m.type==='Transfer'?`${depotName(depots,m.from)} → ${depotName(depots,m.to)}`:(m.type==='Giriş'?depotName(depots,m.to):depotName(depots,m.from||mat?.depotId));return `<tr><td>${esc(date(m.date))}</td><td><span class="pro-name">${esc(mat?.name||m.materialId)}</span><span class="pro-muted">${esc(m.materialId)}</span></td><td><span class="pro-badge ${m.type==='Giriş'?'normal':m.type==='Çıkış'?'zero':'critical'}">${esc(m.type)}</span></td><td class="pro-number">${m.type==='Giriş'?'+':m.type==='Çıkış'?'-':''}${num(m.qty)} ${esc(mat?.unit||'')}</td><td>${esc(loc)}</td></tr>`}).join(''):'<tr><td colspan="5"><div class="pro-empty">Henüz hareket kaydı yok.</div></td></tr>';
    bindDepotRows();
  }

  async function exportExcel(){
    const d=load();
    try{
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
      const wb=XLSX.utils.book_new(); const depotName=id=>d.depots.find(x=>x.id===id)?.name||id||''; const statusText=m=>Number(m.stock)<=0?'Stokta yok':(Number(m.minStock)>0&&Number(m.stock)<=Number(m.minStock)?'Kritik stok':'Normal stok');
      const stockRows=d.materials.map(m=>({'Malzeme Kodu':m.id,'Malzeme Adı':m.name,'Kategori':m.category,'Marka':m.brand,'Model / Ölçü':m.model,'Birim':m.unit,'Mevcut Stok':Number(m.stock)||0,'Minimum Stok':Number(m.minStock)||0,'Durum':statusText(m),'Depo Kodu':m.depotId,'Depo':depotName(m.depotId),'Raf':m.shelf,'Göz':m.bin,'Konum':[m.depotId,m.shelf,m.bin].filter(Boolean).join('-'),'Not':m.notes||''}));
      const depotRows=d.depots.map(x=>{const ms=d.materials.filter(m=>m.depotId===x.id);return {'Depo Kodu':x.id,'Depo':x.name,'Açıklama':x.description||'','Malzeme Çeşidi':ms.length,'Toplam Stok':ms.reduce((s,m)=>s+(Number(m.stock)||0),0),'Kritik Kayıt':ms.filter(m=>statusText(m)!=='Normal stok').length};});
      const moveRows=d.movements.map(m=>{const mat=d.materials.find(x=>x.id===m.materialId);return {'Tarih':date(m.date),'Hareket Kodu':m.id,'Malzeme Kodu':m.materialId,'Malzeme':mat?.name||'','İşlem':m.type,'Miktar':Number(m.qty)||0,'Kaynak Depo':depotName(m.from),'Hedef Depo':depotName(m.to),'Not':m.note||'','İşlemi Yapan':m.actor||''};});
      const summary=[['DEPOQR STOK RAPORU'],['Rapor tarihi',new Date().toLocaleString('tr-TR')],['Malzeme çeşidi',d.materials.length],['Toplam stok',d.materials.reduce((s,m)=>s+(Number(m.stock)||0),0)],['Kritik / stokta yok',d.materials.filter(m=>statusText(m)!=='Normal stok').length],['Depo sayısı',d.depots.length],[]];
      const add=(rows,name,widths)=>{const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=widths.map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws,name);};
      add(stockRows,'Stok Listesi',[15,30,22,20,20,12,14,14,16,12,24,10,10,20,35]); add(depotRows,'Depolar',[14,24,36,16,16,14]); add(moveRows,'Stok Hareketleri',[22,16,16,30,14,12,22,22,32,20]);
      const ws=XLSX.utils.aoa_to_sheet(summary);ws['!cols']=[{wch:24},{wch:34}];XLSX.utils.book_append_sheet(wb,ws,'Özet');
      XLSX.writeFile(wb,'DepoQR-Stok-Raporu-'+new Date().toISOString().slice(0,10)+'.xlsx',{compression:true});
    }catch(e){console.error(e);alert('Excel oluşturulamadı. İnternet bağlantısını kontrol edip tekrar deneyin.');}
  }

  function start(){ ensureUI(); render(); setInterval(render,2000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();

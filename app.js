(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'depoqr_v1';
  const DEPOT_DEFAULTS = [
    {id:'D01',name:'Ara Depo',description:'Merkezi malzeme ve sarf alanı',kind:'warehouse'},
    {id:'D02',name:'Mekanik Atölye',description:'Mekanik bakım ve atölye malzemeleri',kind:'workshop'},
    {id:'D03',name:'Oda Dolabı',description:'Kişisel dolap / ofis malzemeleri',kind:'cabinet'},
    {id:'D99',name:'Test Deposu',description:'Deneme kayıtları ve QR sistemi testleri',kind:'test'}
  ];
  const DEMO_MATERIALS = [
    {id:'MLZ-0001',name:'Rulman 6204',category:'Mekanik',brand:'SKF / eşdeğer',model:'6204-2RS',unit:'Adet',stock:8,minStock:3,depotId:'D02',shelf:'A',bin:'03',notes:'Demo kayıt — gerçek envanter değildir',createdAt:'2026-10-16T08:30:00.000Z'},
    {id:'MLZ-0002',name:'Altı köşe cıvata M8×30',category:'Bağlantı elemanı',brand:'Genel',model:'M8×30',unit:'Adet',stock:145,minStock:30,depotId:'D01',shelf:'B',bin:'06',notes:'Demo kayıt — gerçek envanter değildir',createdAt:'2026-10-16T08:20:00.000Z'},
    {id:'MLZ-0003',name:'Kesme diski 115 mm',category:'Sarf malzeme',brand:'Demo',model:'115 × 1.0 mm',unit:'Adet',stock:2,minStock:10,depotId:'D02',shelf:'C',bin:'02',notes:'Demo kayıt — gerçek envanter değildir',createdAt:'2026-10-15T15:10:00.000Z'},
    {id:'MLZ-0004',name:'Kablo bağı 200 mm',category:'Elektrik sarf',brand:'Genel',model:'200 mm',unit:'Paket',stock:0,minStock:2,depotId:'D01',shelf:'A',bin:'11',notes:'Demo kayıt — gerçek envanter değildir',createdAt:'2026-10-15T12:15:00.000Z'},
    {id:'MLZ-0005',name:'Nitril iş eldiveni',category:'İş güvenliği',brand:'Demo',model:'L beden',unit:'Çift',stock:24,minStock:8,depotId:'D03',shelf:'D',bin:'01',notes:'Demo kayıt — gerçek envanter değildir',createdAt:'2026-10-14T09:00:00.000Z'},
    {id:'MLZ-0006',name:'PTFE teflon bant',category:'Tesisat',brand:'Demo',model:'12 mm',unit:'Adet',stock:6,minStock:4,depotId:'D99',shelf:'T',bin:'01',notes:'Test deposu demo kaydı',createdAt:'2026-10-14T08:00:00.000Z'}
  ];
  const DEMO_MOVEMENTS = [
    {id:'HRK-0003',date:'2026-10-16T10:20:00.000Z',materialId:'MLZ-0001',type:'Giriş',qty:4,from:'',to:'D02',note:'Başlangıç demo hareketi',actor:'Demo'},
    {id:'HRK-0002',date:'2026-10-16T09:45:00.000Z',materialId:'MLZ-0003',type:'Çıkış',qty:2,from:'D02',to:'',note:'Başlangıç demo hareketi',actor:'Demo'},
    {id:'HRK-0001',date:'2026-10-15T14:10:00.000Z',materialId:'MLZ-0002',type:'Giriş',qty:145,from:'',to:'D01',note:'Demo başlangıç stoku',actor:'Demo'}
  ];
  let data = loadData();
  // İlk açılışta demo verisini ortak tarayıcı deposuna yaz; dashboard ve ana ekran aynı kayıtları okusun.
  try { if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.warn('Başlangıç verisi kaydedilemedi.', e); }
  let toastTimer, qrScanner = null;
  let nextMaterialNumber = Math.max(0, ...data.materials.map(m => Number((m.id.match(/(\d+)$/)||[])[1]) || 0)) + 1;
  let nextMovementNumber = Math.max(0, ...data.movements.map(m => Number((m.id.match(/(\d+)$/)||[])[1]) || 0)) + 1;
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj && Array.isArray(obj.materials) && Array.isArray(obj.depots) && Array.isArray(obj.movements)) return obj;
      }
    } catch (e) { console.warn('DepoQR kaydı okunamadı.', e); }
    return {depots:DEPOT_DEFAULTS.map(x=>({...x})),materials:DEMO_MATERIALS.map(x=>({...x})),movements:DEMO_MOVEMENTS.map(x=>({...x})),seeded:true};
  }
  function saveData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
    catch (e) { showToast('Tarayıcıya kayıt yapılamadı. Depolama alanını kontrol et.', true); return false; }
  }
  function esc(v) { return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function num(v) { return new Intl.NumberFormat('tr-TR',{maximumFractionDigits:3}).format(Number(v)||0); }
  function dateTime(v) { if(!v) return '—'; const d = new Date(v); if(Number.isNaN(d.getTime())) return '—'; return new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d); }
  function shortDate(v) { if(!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'short',year:'numeric'}).format(d); }
  function depotName(id) { const d=data.depots.find(x=>x.id===id); return d ? d.name : 'Tanımsız depo'; }
  function depotCode(id) { return data.depots.find(x=>x.id===id)?.id || id || '—'; }
  function material(id) { return data.materials.find(m=>m.id===id); }
  function locationText(m) { return [depotCode(m.depotId),m.shelf,m.bin].filter(Boolean).join('-') || 'Konum belirtilmedi'; }
  function statusOf(m) { const stock=Number(m.stock)||0, min=Number(m.minStock)||0; if(stock<=0)return 'zero'; if(min>0&&stock<=min)return 'critical'; return 'normal'; }
  function statusHTML(m) { const s=statusOf(m); return '<span class="status '+s+'">'+({normal:'Normal stok',critical:'Kritik stok',zero:'Stokta yok'}[s])+'</span>'; }
  function iconFor(m) { const c=(m.category||'').toLocaleLowerCase('tr-TR'); if(c.includes('mekanik')||c.includes('bağlantı'))return '⚙'; if(c.includes('elektrik')||c.includes('kablo'))return '⌁'; if(c.includes('güvenlik')||c.includes('eldiven'))return '⛨'; if(c.includes('tesisat'))return '⌇'; return '▤'; }
  function showToast(message, error=false) { const el=$('toast'); el.textContent=message; el.classList.toggle('error',error); el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3500); }
  function getDepotMaterials(id) { return data.materials.filter(m=>m.depotId===id); }
  function depotTotal(id) { return getDepotMaterials(id).reduce((s,m)=>s+(Number(m.stock)||0),0); }
  function goView(view) {
    document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id==='view-'+view));
    document.querySelectorAll('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
    const titles={dashboard:'Genel Bakış',materials:'Malzemeler',movements:'Stok Hareketleri',depots:'Depolar',labels:'QR Etiketleri'};
    $('crumbTitle').textContent=titles[view]||'Genel Bakış'; $('sidebar').classList.remove('open');
    if(view==='dashboard')renderDashboard(); if(view==='materials')renderMaterials(); if(view==='movements')renderMovements(); if(view==='depots')renderDepots(); if(view==='labels')renderLabelOptions();
  }
  function renderDashboard() {
    $('statMaterials').textContent=num(data.materials.length);
    $('statUnits').textContent=num(data.materials.reduce((s,m)=>s+(Number(m.stock)||0),0));
    $('statCritical').textContent=num(data.materials.filter(m=>statusOf(m)!=='normal').length);
    $('statDepots').textContent=num(data.depots.length);
    $('navMaterialCount').textContent=data.materials.length;
    $('todayDate').textContent=new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date());
    $('dashboardDepots').innerHTML=data.depots.map((d,i)=>'<div class="depot-row" data-depot-id="'+esc(d.id)+'" role="button" tabindex="0" aria-label="'+esc(d.name)+' deposundaki malzemeleri gör"><div class="depot-icon">'+({D01:'▥',D02:'⚙',D03:'▣',D99:'⌘'}[d.id]||'▥')+'</div><div class="depot-main"><strong>'+esc(d.name)+'</strong><small>'+esc(d.id)+' · '+esc(d.description||'Depo lokasyonu')+'</small></div><div class="depot-amount">'+num(depotTotal(d.id))+'<small>'+getDepotMaterials(d.id).length+' malzeme çeşidi</small></div></div>').join('')||'<div class="empty-state"><strong>Henüz depo yok</strong></div>';
    const openDashboardDepot = id => {
      const d=data.depots.find(x=>x.id===id); if(!d) return;
      const ms=getDepotMaterials(id).slice().sort((a,b)=>a.name.localeCompare(b.name,'tr'));
      const body=ms.length
        ? '<div class="table-wrap"><table><thead><tr><th>MALZEME</th><th>KOD</th><th>RAF / GÖZ</th><th>STOK</th><th>DURUM</th></tr></thead><tbody>'+ms.map(m=>'<tr><td><strong>'+esc(m.name)+'</strong><br><small>'+esc(m.category||'Kategorisiz')+'</small></td><td><code class="code-chip">'+esc(m.id)+'</code></td><td>'+esc([m.shelf,m.bin].filter(Boolean).join(' / ')||'Belirtilmedi')+'</td><td><strong>'+num(m.stock)+' '+esc(m.unit||'')+'</strong></td><td>'+statusHTML(m)+'</td></tr>').join('')+'</tbody></table></div>'
        : '<div class="empty-state"><strong>Bu depoda malzeme yok</strong><p>Bu depoya malzeme ekleyebilir veya mevcut bir malzemenin konumunu değiştirebilirsin.</p></div>';
      showModal(d.name+' — Malzemeler',d.id+' · DEPO ENVANTERİ',body,'<button class="secondary-button" data-modal-close>Kapat</button><button class="primary-button" id="addMaterialToDepot">＋ Bu depoya malzeme ekle</button>');
      $('addMaterialToDepot').addEventListener('click',()=>{closeModal();materialForm(null);setTimeout(()=>{const select=$('mDepot');if(select)select.value=id;},0);});
    };
    const depotList=$('dashboardDepots');
    depotList.querySelectorAll('.depot-row').forEach(row=>{
      row.style.cursor='pointer';
      row.addEventListener('click',()=>openDashboardDepot(row.dataset.depotId));
      row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openDashboardDepot(row.dataset.depotId);}});
    });
    const rows=[...data.materials].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,5);
    $('recentTable').innerHTML=rows.length?rows.map(m=>'<tr><td>'+materialCell(m)+'</td><td><code class="code-chip">'+esc(m.id)+'</code></td><td><span class="loc-text">'+esc(depotName(m.depotId))+'<br>'+esc(locationText(m))+'</span></td><td><span class="stock-value">'+num(m.stock)+' '+esc(m.unit)+'</span></td><td>'+statusHTML(m)+'</td><td><div class="row-actions">'+actionButtons(m)+'</div></td></tr>').join(''):'<tr><td class="empty-row" colspan="6">Henüz malzeme eklenmedi. İlk stok kartını oluşturabilirsin.</td></tr>';
  }
  function materialCell(m) { return '<div class="material-cell"><div class="material-thumb">'+iconFor(m)+'</div><div><span class="material-name">'+esc(m.name)+'</span><span class="material-sub">'+esc(m.brand||m.category||'Malzeme')+'</span></div></div>'; }
  function actionButtons(m) { return '<button class="small-icon-btn" data-action="view" data-id="'+esc(m.id)+'" title="Malzeme kartını aç" aria-label="Malzeme kartını aç">↗</button><button class="small-icon-btn" data-action="qr" data-id="'+esc(m.id)+'" title="QR etiketi" aria-label="QR etiketi">▦</button><button class="small-icon-btn delete-material-btn" data-action="delete" data-id="'+esc(m.id)+'" title="Malzemeyi sil" aria-label="Malzemeyi sil">🗑</button>'; }
  function renderFilterOptions() {
    const options=data.depots.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.id)+' · '+esc(d.name)+'</option>').join('');
    const old=$('depotFilter').value; $('depotFilter').innerHTML='<option value="">Tüm depolar</option>'+options; if(data.depots.some(d=>d.id===old))$('depotFilter').value=old;
  }
  function renderMaterials() {
    $('navMaterialCount').textContent=data.materials.length; renderFilterOptions();
    const q=$('materialSearch').value.trim().toLocaleLowerCase('tr-TR'), dep=$('depotFilter').value, st=$('stockFilter').value;
    const list=data.materials.filter(m=>{
      const hay=[m.name,m.id,m.category,m.brand,m.model,m.shelf,m.bin,locationText(m)].join(' ').toLocaleLowerCase('tr-TR');
      return (!q||hay.includes(q))&&(!dep||m.depotId===dep)&&(!st||(st==='critical'&&statusOf(m)==='critical')||(st==='zero'&&statusOf(m)==='zero')||(st==='normal'&&statusOf(m)==='normal'));
    }).sort((a,b)=>a.name.localeCompare(b.name,'tr'));
    $('materialsTable').innerHTML=list.length?list.map(m=>'<tr><td>'+materialCell(m)+'</td><td><code class="code-chip">'+esc(m.id)+'</code></td><td>'+esc(m.category||'—')+'</td><td><span class="loc-text">'+esc(depotName(m.depotId))+'<br>'+esc(locationText(m))+'</span></td><td><span class="stock-value">'+num(m.stock)+' '+esc(m.unit)+'</span></td><td>'+statusHTML(m)+'</td><td><div class="row-actions">'+actionButtons(m)+'<button class="small-icon-btn" data-action="edit" data-id="'+esc(m.id)+'" title="Düzenle" aria-label="Düzenle">✎</button></div></td></tr>').join(''):'<tr><td class="empty-row" colspan="7">'+(data.materials.length?'Filtreyle eşleşen malzeme bulunamadı.':'Henüz kayıt yok. Yeni malzeme ekleyerek başlayabilirsin.')+'</td></tr>';
    $('materialsResultCount').textContent=list.length+' / '+data.materials.length+' kayıt';
  }
  function renderMovements() {
    const q=$('movementSearch').value.trim().toLocaleLowerCase('tr-TR'), type=$('movementTypeFilter').value;
    const rows=data.movements.filter(m=>{const mat=material(m.materialId); const hay=[mat?.name,m.materialId,m.id,m.note,m.actor].join(' ').toLocaleLowerCase('tr-TR');return (!q||hay.includes(q))&&(!type||m.type===type)}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    $('movementTable').innerHTML=rows.length?rows.map(m=>{const mat=material(m.materialId);const dest=m.type==='Transfer'?depotName(m.from)+' → '+depotName(m.to):m.type==='Giriş'?depotName(m.to):depotName(m.from||m.to);return '<tr><td>'+esc(dateTime(m.date))+'</td><td><div class="material-name">'+esc(mat?.name||m.materialId)+'</div><span class="material-sub">'+esc(m.materialId)+'</span></td><td><span class="status '+(m.type==='Giriş'?'normal':m.type==='Çıkış'?'zero':'critical')+'">'+esc(m.type)+'</span></td><td><strong>'+ (m.type==='Giriş'?'+':m.type==='Çıkış'?'-':'') +num(m.qty)+'</strong> '+esc(mat?.unit||'')+'</td><td>'+esc(dest)+'</td><td>'+esc(m.note||'—')+'</td></tr>'}).join(''):'<tr><td class="empty-row" colspan="6">Bu filtrede hareket kaydı bulunamadı.</td></tr>';
    $('movementResultCount').textContent=rows.length+' hareket';
  }
  function renderDepots() {
    $('depotCards').innerHTML=data.depots.map(d=>{const ms=getDepotMaterials(d.id), critical=ms.filter(m=>statusOf(m)!=='normal').length;return '<article class="depot-card" data-depot-open="'+esc(d.id)+'" role="button" tabindex="0" aria-label="'+esc(d.name)+' deposundaki malzemeleri gör"><div class="depot-card-top"><div class="depot-card-icon">'+({D01:'▥',D02:'⚙',D03:'▣',D99:'⌘'}[d.id]||'▥')+'</div><div class="depot-card-info"><h3>'+esc(d.name)+'</h3><p>'+esc(d.description||'Depo açıklaması eklenmedi')+'</p></div><code class="depot-code">'+esc(d.id)+'</code></div><div class="depot-card-stats"><div><small>Toplam stok birimi</small><strong>'+num(depotTotal(d.id))+'</strong></div><div><small>Malzeme çeşidi</small><strong>'+num(ms.length)+'</strong></div></div><div class="depot-card-bottom"><small>'+critical+' kritik stok kaydı</small><button class="text-button" data-depot-edit="'+esc(d.id)+'">Depoyu düzenle →</button></div></article>'}).join('')||'<div class="empty-state">Depo tanımlanmadı.</div>';
  }
  function renderLabelOptions() {
    const select=$('labelMaterial'), current=select.value;
    select.innerHTML=data.materials.length?data.materials.slice().sort((a,b)=>a.name.localeCompare(b.name,'tr')).map(m=>'<option value="'+esc(m.id)+'">'+esc(m.id)+' · '+esc(m.name)+'</option>').join(''):'<option value="">Önce malzeme ekle</option>';
    if(data.materials.some(m=>m.id===current))select.value=current;
  }
  function showModal(title, eyebrow, body, buttons) {
    $('modalTitle').textContent=title; $('modalEyebrow').textContent=eyebrow||'İŞLEM'; $('modalBody').innerHTML=body;
    $('modalFooter').innerHTML=buttons||'<button class="secondary-button" data-modal-close>Vazgeç</button>';
    $('modalBackdrop').classList.add('open'); $('modalBackdrop').setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
    const first=$('modalBody').querySelector('input,select,textarea'); if(first) setTimeout(()=>first.focus(),50);
  }
  function closeModal() { $('modalBackdrop').classList.remove('open'); $('modalBackdrop').setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function closeAnd(callback) { closeModal(); if(callback)callback(); }
  function field(label,id,control,full=false,help='') { return '<div class="field'+(full?' full':'')+'"><label for="'+id+'">'+label+'</label>'+control+(help?'<div class="field-help">'+help+'</div>':'')+'</div>'; }
  function depotOptions(value='') {return data.depots.map(d=>'<option value="'+esc(d.id)+'" '+(value===d.id?'selected':'')+'>'+esc(d.id)+' · '+esc(d.name)+'</option>').join('');}
  function materialForm(existing=null) {
    const m=existing||{name:'',category:'',brand:'',model:'',unit:'Adet',stock:0,minStock:0,depotId:'D99',shelf:'',bin:'',notes:''}, editing=!!existing;
    const depotDefault=data.depots.some(d=>d.id===m.depotId)?m.depotId:(data.depots[0]?.id||'');
    const body='<form id="materialForm" class="form-grid">'+
      '<div class="field full"><div class="form-section-title">TEMEL BİLGİLER</div></div>'+
      field('Malzeme adı <span class="req">*</span>','mName','<input id="mName" name="name" required maxlength="120" placeholder="Örn. Rulman 6204" value="'+esc(m.name)+'">',true)+
      field('Malzeme kodu','mCode','<input id="mCode" name="code" value="'+esc(existing?.id||'Otomatik oluşturulacak')+'" readonly><div class="field-help">Benzersiz kod sistem tarafından üretilir.</div>')+
      field('Kategori <span class="req">*</span>','mCategory','<input id="mCategory" name="category" required maxlength="80" placeholder="Mekanik, sarf, bağlantı..." value="'+esc(m.category)+'">')+
      field('Birim','mUnit','<select id="mUnit" name="unit">'+['Adet','Paket','Kutu','Metre','Kilogram','Litre','Çift','Takım','Rulo','Set'].map(u=>'<option '+(m.unit===u?'selected':'')+'>'+u+'</option>').join('')+'</select>')+
      field('Marka','mBrand','<input id="mBrand" name="brand" maxlength="80" placeholder="Marka (varsa)" value="'+esc(m.brand)+'">')+
      field('Model / ölçü / parça no','mModel','<input id="mModel" name="model" maxlength="100" placeholder="Örn. 6204-2RS" value="'+esc(m.model)+'">')+
      '<div class="field full"><div class="form-section-title" style="margin-top:8px">STOK VE LOKASYON</div></div>'+
      field('Depo <span class="req">*</span>','mDepot','<select id="mDepot" name="depotId" required>'+depotOptions(depotDefault)+'</select>')+
      field('Mevcut stok','mStock','<input id="mStock" name="stock" type="number" min="0" step="any" required value="'+esc(m.stock)+'">',false,'İlk stok miktarı bu kart için açılış miktarıdır.')+
      field('Minimum stok uyarısı','mMinStock','<input id="mMinStock" name="minStock" type="number" min="0" step="any" required value="'+esc(m.minStock)+'">')+
      field('Raf kodu','mShelf','<input id="mShelf" name="shelf" maxlength="20" placeholder="Örn. A" value="'+esc(m.shelf)+'">')+
      field('Göz / kutu numarası','mBin','<input id="mBin" name="bin" maxlength="20" placeholder="Örn. 03" value="'+esc(m.bin)+'">')+
      field('Açıklama / not','mNotes','<textarea id="mNotes" name="notes" maxlength="500" placeholder="Teknik bilgi, ölçü, uyumluluk...">'+esc(m.notes)+'</textarea>',true)+
      '</form>';
    showModal(editing?'Malzemeyi düzenle':'Yeni malzeme',editing?m.id+' KART DÜZENLEME':'YENİ STOK KARTI',body,'<button class="secondary-button" data-modal-close>Vazgeç</button><button class="primary-button" id="saveMaterialBtn">✓ '+(editing?'Değişiklikleri kaydet':'Malzemeyi kaydet')+'</button>');
    $('saveMaterialBtn').addEventListener('click',()=>saveMaterial(existing?.id||null));
    $('materialForm').addEventListener('submit',e=>{e.preventDefault();saveMaterial(existing?.id||null)});
  }
  function saveMaterial(editId) {
    const form=$('materialForm'); if(!form.reportValidity())return;
    const f=new FormData(form), stock=Number(f.get('stock')), minStock=Number(f.get('minStock'));
    if(!Number.isFinite(stock)||stock<0||!Number.isFinite(minStock)||minStock<0){showToast('Stok ve minimum stok negatif olamaz.',true);return;}
    const current=editId?material(editId):null;
    const obj={id:editId||'MLZ-'+String(nextMaterialNumber).padStart(4,'0'),name:String(f.get('name')).trim(),category:String(f.get('category')).trim(),brand:String(f.get('brand')).trim(),model:String(f.get('model')).trim(),unit:String(f.get('unit')),stock,minStock,depotId:String(f.get('depotId')),shelf:String(f.get('shelf')).trim(),bin:String(f.get('bin')).trim(),notes:String(f.get('notes')).trim(),createdAt:current?.createdAt||new Date().toISOString()};
    if(!obj.name||!obj.category){showToast('Malzeme adı ve kategori zorunludur.',true);return;}
    if(current) {
      // Treat stock edits as auditable corrections rather than silently changing inventory.
      if(Number(current.stock)!==stock) data.movements.push({id:'HRK-'+String(nextMovementNumber++).padStart(4,'0'),date:new Date().toISOString(),materialId:editId,type:'Düzeltme',qty:Math.abs(stock-Number(current.stock)),from:stock<Number(current.stock)?current.depotId:'',to:stock>Number(current.stock)?obj.depotId:'',note:'Malzeme kartında stok düzeltmesi',actor:'Depo yöneticisi'});
      Object.assign(current,obj);
    } else {data.materials.push(obj);nextMaterialNumber++;}
    saveData();closeModal();renderAll();showToast(current?'Malzeme kartı güncellendi.':'Malzeme '+obj.id+' koduyla eklendi.');
  }
  function movementForm(initialType='Giriş', preselected='') {
    if(!data.materials.length){showToast('Önce bir malzeme kartı oluştur.',true);materialForm();return;}
    const body='<form id="movementForm" class="form-grid">'+
      field('İşlem türü','mvType','<select id="mvType">'+['Giriş','Çıkış','Transfer','Düzeltme'].map(t=>'<option '+(initialType===t?'selected':'')+'>'+t+'</option>').join('')+'</select>',true)+
      field('Malzeme <span class="req">*</span>','mvMaterial','<select id="mvMaterial" required>'+data.materials.slice().sort((a,b)=>a.name.localeCompare(b.name,'tr')).map(m=>'<option value="'+esc(m.id)+'" '+(m.id===preselected?'selected':'')+'>'+esc(m.id)+' · '+esc(m.name)+' (Stok: '+num(m.stock)+')</option>').join('')+'</select>',true)+
      field('Miktar <span class="req">*</span>','mvQty','<input id="mvQty" type="number" min="0.001" step="any" required placeholder="0">')+
      field('İşlem deposu','mvDepot','<select id="mvDepot">'+depotOptions(preselected?material(preselected)?.depotId:'')+'</select>')+
      field('Hedef depo (yalnız transfer)','mvTarget','<select id="mvTarget">'+depotOptions('')+'</select>',true)+
      field('İşlem notu','mvNote','<input id="mvNote" maxlength="200" placeholder="Örn. bakım işi, sayım, teslim...">',true)+
      '</form><div class="form-note">Stok giriş/çıkışı ve transfer kaydedilince hareket tarihçesine eklenir.</div>';
    showModal('Stok hareketi','STOK HAREKETİ',body,'<button class="secondary-button" data-modal-close>Vazgeç</button><button class="primary-button" id="saveMovementBtn">✓ Hareketi kaydet</button>');
    const sync=()=>{const typ=$('mvType').value; $('mvTarget').parentElement.style.display=typ==='Transfer'?'':'none';$('mvDepot').parentElement.querySelector('label').textContent=typ==='Giriş'?'Giriş deposu':typ==='Çıkış'?'Çıkış deposu':'Kaynak depo';};
    $('mvType').addEventListener('change',sync);$('mvMaterial').addEventListener('change',()=>{const m=material($('mvMaterial').value);if(m)$('mvDepot').value=m.depotId;});sync();
    $('saveMovementBtn').addEventListener('click',saveMovement);
    $('movementForm').addEventListener('submit',e=>{e.preventDefault();saveMovement()});
  }
  function saveMovement() {
    const form=$('movementForm');if(!form.reportValidity())return;
    const type=$('mvType').value, id=$('mvMaterial').value, qty=Number($('mvQty').value), from=$('mvDepot').value, to=type==='Transfer'?$('mvTarget').value:(type==='Giriş'?from:''), mat=material(id), note=$('mvNote').value.trim();
    if(!mat||!Number.isFinite(qty)||qty<=0){showToast('Malzeme ve pozitif miktar seçmelisin.',true);return;}
    if(type==='Çıkış'&&mat.stock<qty){showToast('Çıkış miktarı mevcut stoktan fazla olamaz.',true);return;}
    if(type==='Transfer'&&from===to){showToast('Kaynak ve hedef depo farklı olmalı.',true);return;}
    if(type==='Transfer'&&mat.depotId!==from){showToast('Bu test sürümünde her malzeme tek konumda tutulur. Önce malzemenin mevcut deposunu kaynak seç.',true);return;}
    if(type==='Transfer'&&Number(mat.stock)<qty){showToast('Transfer miktarı mevcut stoktan fazla olamaz.',true);return;}
    if(type==='Giriş'){mat.stock=Number(mat.stock)+qty;mat.depotId=to;}
    else if(type==='Çıkış'){mat.stock=Number(mat.stock)-qty;}
    else if(type==='Transfer'){mat.stock=Number(mat.stock)-qty; // one-location stock card; target becomes the destination for the transferred quantity
      const remainder=mat.stock;
      if(remainder>0){ const copy={...mat,id:'MLZ-'+String(nextMaterialNumber++).padStart(4,'0'),stock:qty,depotId:to,createdAt:new Date().toISOString(),notes:(mat.notes?mat.notes+' | ':'')+'Transfer ile oluşturulan konum kartı'};data.materials.push(copy); }
      else mat.depotId=to;
    } else if(type==='Düzeltme'){const newStock=Number(prompt('Yeni gerçek stok miktarını gir:',String(mat.stock)));if(!Number.isFinite(newStock)||newStock<0){showToast('Geçerli bir miktar girilmedi.',true);return;}const diff=newStock-Number(mat.stock);mat.stock=newStock;data.movements.push({id:'HRK-'+String(nextMovementNumber++).padStart(4,'0'),date:new Date().toISOString(),materialId:id,type,qty:Math.abs(diff),from:diff<0?mat.depotId:'',to:diff>0?mat.depotId:'',note:note||'Sayım düzeltmesi',actor:'Depo yöneticisi'});nextMovementNumber--; // avoid double-increment below
    }
    data.movements.push({id:'HRK-'+String(nextMovementNumber++).padStart(4,'0'),date:new Date().toISOString(),materialId:id,type,qty,from:type==='Giriş'?'':from,to:type==='Çıkış'?'':to,note,actor:'Depo yöneticisi'});
    saveData();closeModal();renderAll();showToast('Stok hareketi kaydedildi.');
  }
  function depotForm(existing=null) {
    const d=existing||{id:'',name:'',description:''}, editing=!!existing;
    const body='<form id="depotForm" class="form-grid">'+
      field('Depo adı <span class="req">*</span>','dName','<input id="dName" required maxlength="90" placeholder="Örn. Hidrolik oda" value="'+esc(d.name)+'">',true)+
      field('Depo kodu <span class="req">*</span>','dCode','<input id="dCode" required maxlength="8" pattern="[A-Za-z0-9-]+" placeholder="Örn. D04" value="'+esc(d.id)+'" '+(editing?'readonly':'')+'>',false,editing?'Var olan depo kodu değiştirilemez.':'Kısa, benzersiz kod kullan.')+
      field('Açıklama','dDescription','<textarea id="dDescription" maxlength="200" placeholder="Deponun kullanım amacı...">'+esc(d.description)+'</textarea>',true)+
      '</form>';
    showModal(editing?'Depoyu düzenle':'Yeni depo','DEPO TANIMI',body,'<button class="secondary-button" data-modal-close>Vazgeç</button><button class="primary-button" id="saveDepotBtn">✓ Kaydet</button>');
    $('saveDepotBtn').addEventListener('click',()=>{const f=$('depotForm');if(!f.reportValidity())return;const id=$('dCode').value.trim().toUpperCase(),name=$('dName').value.trim();if(!editing&&data.depots.some(x=>x.id.toUpperCase()===id)){showToast('Bu depo kodu zaten kullanılıyor.',true);return;}if(!name||!id){showToast('Depo adı ve kodu zorunlu.',true);return;}if(editing){d.name=name;d.description=$('dDescription').value.trim();}else{data.depots.push({id,name,description:$('dDescription').value.trim(),kind:'custom'});}saveData();closeModal();renderAll();showToast(editing?'Depo güncellendi.':'Depo '+id+' oluşturuldu.');});
  }
  function openDetail(id) {
    const m=material(id);if(!m){showToast('Bu kodla eşleşen malzeme bulunamadı.',true);return;}
    const body='<div class="detail-top"><div class="detail-art">'+iconFor(m)+'</div><div class="detail-heading"><h3>'+esc(m.name)+'</h3><p><code class="code-chip">'+esc(m.id)+'</code> · '+esc(m.category||'Kategorisiz')+'</p></div>'+statusHTML(m)+'</div>'+
      '<div class="detail-stock"><span>Mevcut stok</span><strong>'+num(m.stock)+' <span style="font:500 12px DM Sans,sans-serif">'+esc(m.unit)+'</span></strong></div>'+
      '<div class="detail-grid">'+[['Depo',depotName(m.depotId)+' ('+m.depotId+')'],['Raf / göz',locationText(m)],['Minimum stok',num(m.minStock)+' '+m.unit],['Marka',m.brand||'Belirtilmedi'],['Model / ölçü',m.model||'Belirtilmedi'],['Kart oluşturma',dateTime(m.createdAt)]].map(([l,v])=>'<div class="detail-item"><small>'+l+'</small><strong>'+esc(v)+'</strong></div>').join('')+'</div>'+
      (m.notes?'<div class="detail-notes"><strong>Not:</strong> '+esc(m.notes)+'</div>':'');
    showModal(m.name,'MALZEME KARTI · '+m.id,body,'<button class="secondary-button" data-modal-close>Kapat</button><button class="secondary-button" id="detailQR">▦ QR etiketi</button><button class="secondary-button" id="detailMove">↔ Stok hareketi</button><button class="secondary-button" id="detailDelete" style="color:#b42332;border-color:#f0c7cc">🗑 Sil</button><button class="primary-button" id="detailEdit">✎ Düzenle</button>');
    $('detailQR').addEventListener('click',()=>closeAnd(()=>generateLabelsFor([m.id],1)));
    $('detailMove').addEventListener('click',()=>closeAnd(()=>movementForm('Giriş',m.id)));
    $('detailEdit').addEventListener('click',()=>closeAnd(()=>materialForm(m)));
    $('detailDelete').addEventListener('click',()=>deleteMaterial(m.id));
  }
  function generateLabelsFor(ids,copies=1) {
    const mats=ids.map(material).filter(Boolean);if(!mats.length){showToast('Etiket için kayıtlı bir malzeme seç.',true);return;}
    const total=mats.reduce((s,m)=>s+copies,0);if(total>60){showToast('Tek seferde en fazla 60 etiket üretilebilir.',true);return;}
    $('printRoot').innerHTML='<div class="print-label-grid">'+mats.flatMap(m=>Array.from({length:copies},()=>'<div class="qr-label"><div class="qr-render" data-qr="'+esc(m.id)+'"></div><strong>'+esc(m.name)+'</strong><code>'+esc(m.id)+'</code><small>'+esc(depotName(m.depotId))+' · '+esc(locationText(m))+'</small></div>')).join('')+'</div>';
    const output=$('labelOutput');output.innerHTML='<div class="label-output">'+mats.flatMap(m=>Array.from({length:copies},()=>'<div class="qr-label"><div class="qr-render" data-qr="'+esc(m.id)+'"></div><strong>'+esc(m.name)+'</strong><code>'+esc(m.id)+'</code><small>'+esc(depotName(m.depotId))+' · '+esc(locationText(m))+'</small></div>')).join('')+'</div>';
    goView('labels');
    drawQrs();
    if(!$('downloadLabels')){
      const b=document.createElement('button');
      b.id='downloadLabels'; b.className='secondary-button'; b.textContent='⇩ İndir';
      $('printLabels').parentElement.appendChild(b);
      b.addEventListener('click',downloadCurrentQR);
    }
    showToast(total+' QR etiket önizlemesi oluşturuldu.');
  }
  function downloadCurrentQR(){
    const label=$('printRoot').querySelector('.qr-label');
    const canvas=label?.querySelector('canvas');
    const img=label?.querySelector('img');
    if(!canvas && !img){showToast('Önce QR etiketi oluştur.',true);return;}
    const a=document.createElement('a');
    a.href=canvas?canvas.toDataURL('image/png'):img.src;
    a.download='depoqr-'+(label.querySelector('code')?.textContent||'etiket')+'.png';
    document.body.appendChild(a);a.click();a.remove();
    showToast('QR etiketi PNG olarak indirildi.');
  }
  function drawQrs() {
    const all=[...document.querySelectorAll('#printRoot .qr-render'),...document.querySelectorAll('#labelOutput .qr-render')];
    all.forEach(el=>{el.innerHTML='';const code=el.dataset.qr;const payload=location.origin+location.pathname+'?mlz='+encodeURIComponent(code);if(window.QRCode){new QRCode(el,{text:payload,width:108,height:108,colorDark:'#182432',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});}else{el.textContent=code;el.style.fontSize='10px';el.style.overflowWrap='anywhere';}});
  }
  function findByCode(code) {
    const raw=String(code||'').trim();if(!raw)return;
    let id=raw;
    try {const u=new URL(raw,location.href);id=u.searchParams.get('mlz')||u.searchParams.get('code')||raw;}catch(_){}
    id=decodeURIComponent(id).trim();
    const m=data.materials.find(x=>x.id.toLocaleLowerCase('tr-TR')===id.toLocaleLowerCase('tr-TR'));
    if(m){$('scanOverlay').hidden=true;if(qrScanner){qrScanner.stop().catch(()=>{});qrScanner=null;}openDetail(m.id);return true;}
    showToast('Malzeme bulunamadı: '+id+'. Kayıt bu tarayıcıda olmayabilir.',true);return false;
  }
  async function openScanner() {
    $('scanOverlay').hidden=false;$('manualCode').value='';
    if(!window.isSecureContext){$('scanHelp').textContent='Kamera için siteyi HTTPS üzerinden (GitHub Pages) aç. Şimdilik kodu elle girebilirsin.';return;}
    if(qrScanner){try{await qrScanner.stop();}catch(_){}qrScanner=null;}
    if(!window.Html5Qrcode){try{await loadScript('https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js');}catch(e){$('scanHelp').textContent='Kamera tarayıcı kütüphanesi yüklenemedi. Kodu elle girebilirsin.';return;}}
    try{
      qrScanner=new Html5Qrcode('qr-reader');
      await qrScanner.start({facingMode:'environment'},{fps:10,qrbox:{width:220,height:220}},txt=>{if(findByCode(txt)){qrScanner=null;}},()=>{});
      $('scanHelp').textContent='QR kodunu kamera alanının içinde tut.';
    }catch(e){$('scanHelp').textContent='Kamera açılamadı. İzin ver veya kodu elle gir. ('+(e?.message||'kamera hatası')+')';qrScanner=null;}
  }
  function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('script error'));document.head.appendChild(s);});}
  function stopScanner(){if(qrScanner){const q=qrScanner;qrScanner=null;q.stop().catch(()=>{}).finally(()=>q.clear().catch(()=>{}));}$('scanOverlay').hidden=true;}
  function exportData() {
    const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString(),format:'DepoQR yedek v1'},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='depoqr-yedek-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('Yedek dosyası indirildi.');
  }
  function importData(file) {
    if(!file)return;const reader=new FileReader();
    reader.onload=()=>{try{const obj=JSON.parse(reader.result);if(!obj||!Array.isArray(obj.materials)||!Array.isArray(obj.depots)||!Array.isArray(obj.movements))throw new Error('Beklenen depo yedek yapısı bulunamadı.');
      if(!confirm('Mevcut tarayıcı kayıtları seçilen yedekle değiştirilecek. Devam edilsin mi?'))return;
      data={depots:obj.depots,materials:obj.materials,movements:obj.movements};nextMaterialNumber=Math.max(0,...data.materials.map(m=>Number((m.id.match(/(\d+)$/)||[])[1])||0))+1;nextMovementNumber=Math.max(0,...data.movements.map(m=>Number((m.id.match(/(\d+)$/)||[])[1])||0))+1;saveData();renderAll();showToast('Yedek içe aktarıldı.');
    }catch(e){showToast('Yedek dosyası okunamadı: '+e.message,true);}};
    reader.onerror=()=>showToast('Dosya okunamadı.',true);reader.readAsText(file);
  }
  function deleteMaterial(id){
    const m=material(id); if(!m){showToast('Malzeme kaydı bulunamadı.',true);return;}
    const related=data.movements.filter(x=>x.materialId===id).length;
    const warning=Number(m.stock)>0?' Bu malzemenin mevcut stoğu '+num(m.stock)+' '+(m.unit||'')+'.':'';
    const history=related?' İlişkili '+related+' stok hareketi kaydı da silinecek.':'';
    if(!confirm('"'+m.name+'" ('+m.id+') malzemesini kalıcı olarak silmek istiyor musun?'+warning+history+' Bu işlem geri alınamaz.'))return;
    data.materials=data.materials.filter(x=>x.id!==id);
    data.movements=data.movements.filter(x=>x.materialId!==id);
    saveData();closeModal();renderAll();showToast('Malzeme ve ilişkili hareket kayıtları silindi.');
  }
  function renderAll(){renderDashboard();renderMaterials();renderMovements();renderDepots();renderLabelOptions();}
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]');if(nav){goView(nav.dataset.view);return;}
    const go=e.target.closest('[data-goto]');if(go){goView(go.dataset.goto);return;}
    const act=e.target.closest('[data-action]');if(act){const m=material(act.dataset.id);if(act.dataset.action==='view')openDetail(act.dataset.id);else if(act.dataset.action==='edit')materialForm(m);else if(act.dataset.action==='qr')generateLabelsFor([act.dataset.id],1);else if(act.dataset.action==='delete')deleteMaterial(act.dataset.id);return;}
    if(e.target.closest('[data-modal-close]'))closeModal();
    const editDepot=e.target.closest('[data-depot-edit]');if(editDepot){e.stopPropagation();depotForm(data.depots.find(d=>d.id===editDepot.dataset.depotEdit));return;}
  });
  $('modalClose').addEventListener('click',closeModal);$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();stopScanner();$('sidebar').classList.remove('open');}});
  $('topAddBtn').addEventListener('click',()=>materialForm());$('materialsAdd').addEventListener('click',()=>materialForm());$('quickAdd').addEventListener('click',()=>materialForm());
  $('quickMove').addEventListener('click',()=>movementForm());$('movementAdd').addEventListener('click',()=>movementForm());$('quickQR').addEventListener('click',()=>{goView('labels');if(data.materials.length)generateLabelsFor([data.materials[0].id],1);});
  $('quickScan').addEventListener('click',openScanner);$('scanBtn').addEventListener('click',openScanner);$('scanClose').addEventListener('click',stopScanner);$('findCodeBtn').addEventListener('click',()=>findByCode($('manualCode').value));$('manualCode').addEventListener('keydown',e=>{if(e.key==='Enter')findByCode(e.target.value)});
  $('materialSearch').addEventListener('input',renderMaterials);$('depotFilter').addEventListener('change',renderMaterials);$('stockFilter').addEventListener('change',renderMaterials);
  $('clearFilters').addEventListener('click',()=>{$('materialSearch').value='';$('depotFilter').value='';$('stockFilter').value='';renderMaterials();});
  $('movementSearch').addEventListener('input',renderMovements);$('movementTypeFilter').addEventListener('change',renderMovements);$('addDepotBtn').addEventListener('click',()=>depotForm());
  $('generateLabels').addEventListener('click',()=>{const id=$('labelMaterial').value,c=Number($('labelCopies').value);if(!Number.isInteger(c)||c<1||c>60){showToast('Etiket adedi 1–60 arasında tam sayı olmalı.',true);return;}generateLabelsFor([id],c);});
  $('printLabels').addEventListener('click',()=>{if(!$('printRoot').querySelector('.qr-label')){showToast('Önce QR etiketleri oluştur.',true);return;}drawQrs();setTimeout(()=>window.print(),250);});
  $('exportBtn').addEventListener('click',exportData);$('importBtn').addEventListener('click',()=>$('importFile').click());$('importFile').addEventListener('change',e=>{importData(e.target.files[0]);e.target.value='';});
  $('mobileMenu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
  $('todayDate').textContent=new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date());
  // A URL QR can deep-link to a material card on this device.
  renderAll();
  const param=new URLSearchParams(location.search).get('mlz');if(param)setTimeout(()=>openDetail(param),300);
})();
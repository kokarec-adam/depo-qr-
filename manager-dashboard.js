(() => {
  'use strict';
  const KEY='depoqr_v1';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(Number(v)||0);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
  const monthKey=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`};
  const thisMonth=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`};
  let selectedMonth=thisMonth();
  const materialName=(data,id)=>data.materials.find(m=>m.id===id)?.name||id||'Bilinmeyen malzeme';
  const depotName=(data,id)=>data.depots.find(d=>d.id===id)?.name||id||'Belirtilmemiş';
  const monthLabel=key=>{const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));};
  const shiftMonth=(key,delta)=>{const [y,m]=key.split('-').map(Number);const d=new Date(y,m-1+delta,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};

  const ensureStyle=()=>{
    if($('#dqManagerStyle'))return;
    const s=document.createElement('style');s.id='dqManagerStyle';s.textContent=`
      #view-manager{display:none}.view.active#view-manager{display:block}
      .dq-manager-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
      .dq-month-picker{position:relative;display:flex;align-items:center;gap:8px}
      .dq-month-btn{display:flex;align-items:center;gap:10px;min-width:180px;justify-content:center;padding:13px 16px;border:1px solid #c9d6e4;border-radius:13px;background:#fff;color:#17304a;font:800 15px/1 DM Sans,system-ui,sans-serif;box-shadow:0 4px 16px rgba(20,48,74,.08);cursor:pointer;transition:.18s}
      .dq-month-btn:hover{border-color:#6a9ed3;box-shadow:0 6px 20px rgba(43,93,139,.14);transform:translateY(-1px)}
      .dq-month-btn .cal{font-size:18px;color:#4b8fd3}.dq-month-input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
      .dq-month-nav{width:38px;height:38px;border:1px solid #d4dfeb;background:#fff;border-radius:10px;color:#31516e;font-size:18px;cursor:pointer}.dq-month-nav:hover{background:#eef5fb}
      .dq-selected-note{margin:0 0 18px;padding:11px 14px;border-radius:11px;background:#eaf3fc;border:1px solid #cfe2f5;color:#315b80;font-size:13px;font-weight:700}
      .dq-ai-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(290px,.65fr);gap:18px;margin-bottom:18px}
      .dq-ai-card{background:linear-gradient(145deg,#10283e,#173b59);border:1px solid #2d5e87;border-radius:18px;padding:25px;position:relative;overflow:hidden;box-shadow:0 10px 30px rgba(23,62,94,.12)}
      .dq-ai-card:after{content:'AI';position:absolute;right:-8px;top:-28px;font-size:130px;font-weight:900;color:rgba(139,197,255,.06);letter-spacing:-.08em}
      .dq-ai-kicker{position:relative;z-index:1;color:#9bd0ff;font-size:11px;font-weight:900;letter-spacing:.16em}.dq-ai-card h2{position:relative;z-index:1;color:#fff;font-size:27px;margin:9px 0 12px;line-height:1.2}.dq-ai-card p{position:relative;z-index:1;color:#e4f0fa;line-height:1.7;margin:0;max-width:780px;font-size:15px}.dq-period{position:relative;z-index:1;color:#a9c4da;font-size:12px;margin-top:16px}
      .dq-alerts{display:grid;gap:10px}.dq-alert{background:#fff;border:1px solid #d8e2ec;border-radius:14px;padding:16px;box-shadow:0 5px 18px rgba(24,54,79,.06)}.dq-alert b{display:block;margin-bottom:7px;color:#17304a;font-size:15px}.dq-alert span{color:#52687b;font-size:13px;line-height:1.55}.dq-alert.red{border-left:4px solid #e06b68}.dq-alert.amber{border-left:4px solid #e0a33d}.dq-alert.blue{border-left:4px solid #5b99d6}
      .dq-manager-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.dq-metric{background:#fff;border:1px solid #d8e2ec;border-radius:15px;padding:18px;box-shadow:0 5px 18px rgba(24,54,79,.05)}.dq-metric small{display:block;color:#5b7185;font-weight:800;margin-bottom:9px;font-size:12px}.dq-metric strong{display:block;color:#142f49;font-size:30px;line-height:1.1}.dq-metric em{display:block;color:#5687b6;font-style:normal;font-size:12px;font-weight:700;margin-top:7px}
      .dq-analysis-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}.dq-panel{background:#fff;border:1px solid #d8e2ec;border-radius:16px;padding:20px;box-shadow:0 5px 18px rgba(24,54,79,.05)}.dq-panel h3{margin:0 0 5px;color:#17304a;font-size:18px}.dq-panel>p{margin:0 0 16px;color:#65798b;font-size:13px}
      .dq-rank{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:11px;padding:13px 0;border-bottom:1px solid #e7edf3}.dq-rank:last-child{border-bottom:0}.dq-rank-num{color:#7190aa;font-weight:900}.dq-rank-name{color:#1b3a56;font-weight:800}.dq-rank-name small{display:block;color:#718699;font-weight:600;margin-top:3px;font-size:11px}.dq-rank-val{color:#173f62;font-weight:900}.dq-bar{height:6px;border-radius:99px;background:#e7eef5;margin-top:8px;overflow:hidden}.dq-bar i{display:block;height:100%;background:linear-gradient(90deg,#4b90d2,#77b7ee);border-radius:99px}
      .dq-depot-row{display:flex;justify-content:space-between;gap:15px;padding:14px 0;border-bottom:1px solid #e7edf3}.dq-depot-row:last-child{border-bottom:0}.dq-depot-row span{color:#4d6579;font-weight:700}.dq-depot-row strong{color:#173f62}.dq-empty{padding:28px;color:#718699;text-align:center;background:#f7fafc;border-radius:10px}.dq-manager-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 9px;border:1px solid #385b7e;border-radius:99px;color:#8fc0ff;font-size:11px;font-weight:900;background:#16283a;margin-top:5px}
      .dq-history{display:flex;align-items:center;gap:8px;margin-bottom:18px}.dq-history strong{color:#17304a;font-size:13px}.dq-history span{color:#6b8092;font-size:12px}
      @media(max-width:1000px){.dq-ai-hero,.dq-analysis-grid{grid-template-columns:1fr}.dq-manager-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dq-manager-heading{align-items:flex-start;flex-direction:column}.dq-month-picker{width:100%}.dq-month-btn{flex:1}}
      @media(max-width:620px){.dq-manager-grid{grid-template-columns:1fr}.dq-ai-card{padding:20px}.dq-ai-card h2{font-size:22px}.dq-month-nav{width:42px;height:42px}.dq-month-btn{min-width:0;font-size:14px}}
    `;document.head.appendChild(s);
  };

  function addNav(){
    const nav=document.querySelector('.nav-list');if(!nav||nav.querySelector('[data-view="manager"]'))return;
    const b=document.createElement('button');b.className='nav-item';b.dataset.view='manager';b.innerHTML='<span class="nav-icon">✦</span> Yönetici Analizi';nav.appendChild(b);
    b.addEventListener('click',()=>{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-manager'));document.querySelectorAll('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x===b));const c=document.getElementById('crumbTitle');if(c)c.textContent='Yönetici Analizi';render();document.getElementById('sidebar')?.classList.remove('open')});
  }

  function addView(){
    if($('#view-manager'))return;const wrap=document.querySelector('.page-content');if(!wrap)return;
    const v=document.createElement('section');v.className='view';v.id='view-manager';
    v.innerHTML='<div class="page-heading compact-heading dq-manager-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> YÖNETİCİ KONTROL MERKEZİ</div><h1>Yönetici Analizi</h1><p class="subheading">Gerçek stok hareketlerinden otomatik çıkarılan dönemsel kullanım özeti.</p></div><div class="dq-month-picker"><button type="button" class="dq-month-nav" id="dqPrevMonth" aria-label="Önceki ay">‹</button><label class="dq-month-btn"><span class="cal">▣</span><span id="dqMonthLabel">—</span><input id="dqMonthInput" class="dq-month-input" type="month" aria-label="Analiz ayını seç"></label><button type="button" class="dq-month-nav" id="dqNextMonth" aria-label="Sonraki ay">›</button></div></div><div id="dqManagerContent"></div>';
    wrap.appendChild(v);
    const input=$('#dqMonthInput');
    input.value=selectedMonth;
    input.addEventListener('change',()=>{if(input.value){selectedMonth=input.value;render();}});
    const picker=$('.dq-month-btn');
    picker.addEventListener('click',e=>{if(e.target===input)return;try{input.showPicker?.()}catch{input.focus();input.click();}});
    $('#dqPrevMonth').addEventListener('click',()=>{selectedMonth=shiftMonth(selectedMonth,-1);input.value=selectedMonth;render();});
    $('#dqNextMonth').addEventListener('click',()=>{selectedMonth=shiftMonth(selectedMonth,1);input.value=selectedMonth;render();});
  }

  function render(){
    const data=read();if(!data||!Array.isArray(data.materials)||!Array.isArray(data.movements))return;
    const moves=data.movements.filter(m=>monthKey(m.date||m.createdAt||new Date())===selectedMonth);
    const exits=moves.filter(m=>m.type==='Çıkış'),entries=moves.filter(m=>m.type==='Giriş'),transfers=moves.filter(m=>m.type==='Transfer');
    const totalOut=exits.reduce((s,m)=>s+(Number(m.qty)||0),0),totalIn=entries.reduce((s,m)=>s+(Number(m.qty)||0),0);
    const critical=data.materials.filter(m=>(Number(m.stock)||0)<=Math.max(0,Number(m.minStock)||0));
    const usage={};exits.forEach(m=>{usage[m.materialId]=(usage[m.materialId]||0)+(Number(m.qty)||0)});
    const top=Object.entries(usage).sort((a,b)=>b[1]-a[1]).slice(0,6),max=top[0]?.[1]||1;
    const depotUsage={};exits.forEach(m=>{const d=m.from||m.depotId||'—';depotUsage[d]=(depotUsage[d]||0)+(Number(m.qty)||0)});
    const depots=Object.entries(depotUsage).sort((a,b)=>b[1]-a[1]);
    const topMat=top[0],topDepot=depots[0];
    const label=monthLabel(selectedMonth),isCurrent=selectedMonth===thisMonth();
    const criticalNames=critical.slice(0,3).map(m=>m.name).join(', ');
    let insight;
    if(totalOut===0){insight=`${label} döneminde kayıtlı stok çıkışı bulunmuyor. O aya ait saha hareketleri eklendikçe analiz otomatik güncellenecek.`;}
    else{insight=`${label} döneminde ${n(totalOut)} birim stok çıkışı gerçekleşti. En yoğun tüketim ${topMat?`“${esc(materialName(data,topMat[0]))}” (${n(topMat[1])} birim)`:'belirli bir malzemede'} gerçekleşti. ${topDepot?`En yoğun kullanım noktası ${esc(depotName(data,topDepot[0]))} (${n(topDepot[1])} birim çıkış).`:''}`;}
    $('#dqMonthLabel').textContent=label;
    $('#dqMonthInput').value=selectedMonth;
    $('#dqManagerContent').innerHTML=`
      <div class="dq-selected-note">📅 Şu anda <strong>${esc(label)}</strong> verilerine bakıyorsun. Bu seçim yalnızca analiz dönemini değiştirir; stokların kendisini değiştirmez.</div>
      <div class="dq-ai-hero">
        <section class="dq-ai-card"><div class="dq-ai-kicker">✦ OTOMATİK DEPO ANALİZİ</div><h2>${esc(label)} döneminde depoda ne oldu?</h2><p>${insight}</p><div class="dq-period">Analiz kaynağı: DepoQR stok hareketleri · ${moves.length} hareket incelendi</div></section>
        <div class="dq-alerts">
          <div class="dq-alert ${critical.length?'red':'blue'}"><b>${critical.length?'⚠️ Kritik stok':'✓ Kritik stok durumu'}</b><span>${critical.length?`${n(critical.length)} malzeme şu an minimum seviyede. ${esc(criticalNames)}${critical.length>3?' ve diğerleri.':''}`:'Şu anda minimum seviyenin altında veya eşit stok bulunmuyor.'}</span></div>
          <div class="dq-alert amber"><b>↔ Transfer</b><span>${esc(label)} döneminde ${n(transfers.length)} depo transferi kaydedildi.</span></div>
        </div>
      </div>
      <div class="dq-manager-grid">
        <div class="dq-metric"><small>Dönem çıkışı</small><strong>${n(totalOut)}</strong><em>birim</em></div>
        <div class="dq-metric"><small>Dönem girişi</small><strong>${n(totalIn)}</strong><em>birim</em></div>
        <div class="dq-metric"><small>Hareket sayısı</small><strong>${n(moves.length)}</strong><em>giriş + çıkış + transfer</em></div>
        <div class="dq-metric"><small>Mevcut kritik stok</small><strong>${n(critical.length)}</strong><em>${isCurrent?'bugünkü durum':'şu anki durum'}</em></div>
      </div>
      <div class="dq-analysis-grid">
        <section class="dq-panel"><h3>En çok kullanılan malzemeler</h3><p>${esc(label)} dönemindeki stok çıkışlarına göre sıralandı.</p>${top.length?top.map((x,i)=>`<div class="dq-rank"><span class="dq-rank-num">${String(i+1).padStart(2,'0')}</span><div class="dq-rank-name">${esc(materialName(data,x[0]))}<small>${esc(x[0])}</small><div class="dq-bar"><i style="width:${Math.max(5,Math.round(x[1]/max*100))}%"></i></div></div><span class="dq-rank-val">${n(x[1])}</span></div>`).join(''):'<div class="dq-empty">Bu dönemde henüz çıkış hareketi yok.</div>'}</section>
        <section class="dq-panel"><h3>Nerede kullanıldı?</h3><p>${esc(label)} dönemindeki çıkışların kaynak deposuna göre dağılımı.</p>${depots.length?depots.slice(0,6).map(x=>`<div class="dq-depot-row"><span>${esc(depotName(data,x[0]))}</span><strong>${n(x[1])} birim</strong></div>`).join(''):'<div class="dq-empty">Bu dönemde kullanım verisi yok.</div>'}</section>
      </div>`;
  }

  function boot(){
    ensureStyle();addNav();addView();
    const p=document.querySelector('.user-panel');
    if(p){const strong=p.querySelector('strong'),small=p.querySelector('small');if(strong)strong.textContent='Depo yöneticisi';if(small)small.innerHTML='Yönetici <span class="dq-manager-badge">✦ YÖNETİCİ</span>'}
    render();setInterval(()=>{if($('#view-manager')?.classList.contains('active'))render()},3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
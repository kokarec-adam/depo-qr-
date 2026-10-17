(() => {
  'use strict';
  const KEY='depoqr_v1';
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(Number(v)||0);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}};
  const monthKey=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`};
  const currentMonth=()=>monthKey(new Date());
  const materialName=(data,id)=>data.materials.find(m=>m.id===id)?.name||id||'Bilinmeyen malzeme';
  const depotName=(data,id)=>data.depots.find(d=>d.id===id)?.name||id||'Belirtilmemiş';
  const ensureStyle=()=>{
    if($('#dqManagerStyle'))return;
    const s=document.createElement('style');s.id='dqManagerStyle';s.textContent=`
      #view-manager{display:none}.view.active#view-manager{display:block}
      .dq-ai-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:18px;margin-bottom:18px}
      .dq-ai-card{background:linear-gradient(145deg,#142538,#101923);border:1px solid #29445f;border-radius:18px;padding:24px;position:relative;overflow:hidden}
      .dq-ai-card:after{content:'AI';position:absolute;right:-8px;top:-25px;font-size:130px;font-weight:900;color:rgba(112,169,255,.045);letter-spacing:-.08em}
      .dq-ai-kicker{color:#7cb1ff;font-size:11px;font-weight:900;letter-spacing:.16em}.dq-ai-card h2{font-size:26px;margin:8px 0}.dq-ai-card p{color:#9aabba;line-height:1.65;margin:0;max-width:780px}.dq-period{color:#7890a7;font-size:12px;margin-top:14px}
      .dq-alerts{display:grid;gap:10px}.dq-alert{background:#111b25;border:1px solid #273746;border-radius:14px;padding:14px}.dq-alert b{display:block;margin-bottom:4px}.dq-alert span{color:#91a0ae;font-size:13px;line-height:1.5}.dq-alert.red{border-color:#634041}.dq-alert.amber{border-color:#665032}
      .dq-manager-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.dq-metric{background:#111a23;border:1px solid #253442;border-radius:15px;padding:17px}.dq-metric small{display:block;color:#8292a2;font-weight:700;margin-bottom:8px}.dq-metric strong{font-size:27px}.dq-metric em{display:block;color:#6f9fd3;font-style:normal;font-size:12px;margin-top:6px}
      .dq-analysis-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px}.dq-panel{background:#111a23;border:1px solid #253442;border-radius:16px;padding:18px}.dq-panel h3{margin:0 0 4px;font-size:17px}.dq-panel>p{margin:0 0 15px;color:#8292a2;font-size:13px}
      .dq-rank{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #202d39}.dq-rank:last-child{border-bottom:0}.dq-rank-num{color:#64778a;font-weight:900}.dq-rank-name{font-weight:800}.dq-rank-name small{display:block;color:#778a9c;font-weight:500;margin-top:3px}.dq-rank-val{font-weight:900}.dq-bar{height:5px;border-radius:99px;background:#202d39;margin-top:7px;overflow:hidden}.dq-bar i{display:block;height:100%;background:#5d91c9;border-radius:99px}
      .dq-depot-row{display:flex;justify-content:space-between;gap:15px;padding:12px 0;border-bottom:1px solid #202d39}.dq-depot-row:last-child{border-bottom:0}.dq-depot-row span{color:#8d9cab}.dq-empty{padding:24px;color:#7f8f9e;text-align:center}.dq-manager-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 9px;border:1px solid #385b7e;border-radius:99px;color:#8fc0ff;font-size:11px;font-weight:900;background:#16283a;margin-top:5px}
      @media(max-width:1000px){.dq-ai-hero,.dq-analysis-grid{grid-template-columns:1fr}.dq-manager-grid{grid-template-columns:repeat(2,minmax(0,1fr)}}
      @media(max-width:620px){.dq-manager-grid{grid-template-columns:1fr}.dq-ai-card{padding:19px}.dq-ai-card h2{font-size:22px}}
    `;document.head.appendChild(s);
  };
  function addNav(){
    const nav=document.querySelector('.nav-list');if(!nav||nav.querySelector('[data-view="manager"]'))return;
    const b=document.createElement('button');b.className='nav-item';b.dataset.view='manager';b.innerHTML='<span class="nav-icon">✦</span> Yönetici Analizi';nav.appendChild(b);
    b.addEventListener('click',()=>{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-manager'));document.querySelectorAll('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x===b));const c=document.getElementById('crumbTitle');if(c)c.textContent='Yönetici Analizi';render();document.getElementById('sidebar')?.classList.remove('open')});
  }
  function addView(){
    if($('#view-manager'))return;const wrap=document.querySelector('.page-content');if(!wrap)return;
    const v=document.createElement('section');v.className='view';v.id='view-manager';v.innerHTML='<div class="page-heading compact-heading"><div><div class="eyebrow"><span class="eyebrow-line"></span> YÖNETİCİ KONTROL MERKEZİ</div><h1>Yönetici Analizi</h1><p class="subheading">Gerçek stok hareketlerinden otomatik çıkarılan aylık kullanım özeti.</p></div><div class="heading-date" id="dqManagerDate"></div></div><div id="dqManagerContent"></div>';wrap.appendChild(v);
  }
  function render(){
    const data=read();if(!data||!Array.isArray(data.materials)||!Array.isArray(data.movements))return;const now=new Date(),mk=currentMonth();
    const moves=data.movements.filter(m=>monthKey(m.date||m.createdAt||now)===mk),exits=moves.filter(m=>m.type==='Çıkış'),entries=moves.filter(m=>m.type==='Giriş'),transfers=moves.filter(m=>m.type==='Transfer');
    const totalOut=exits.reduce((s,m)=>s+(Number(m.qty)||0),0),totalIn=entries.reduce((s,m)=>s+(Number(m.qty)||0),0);
    const critical=data.materials.filter(m=>(Number(m.stock)||0)<=Math.max(0,Number(m.minStock)||0));const usage={};exits.forEach(m=>{usage[m.materialId]=(usage[m.materialId]||0)+(Number(m.qty)||0)});const top=Object.entries(usage).sort((a,b)=>b[1]-a[1]).slice(0,6);const max=top[0]?.[1]||1;const depotUsage={};exits.forEach(m=>{const d=m.from||m.depotId||'—';depotUsage[d]=(depotUsage[d]||0)+(Number(m.qty)||0)});const depots=Object.entries(depotUsage).sort((a,b)=>b[1]-a[1]);const topMat=top[0],topDepot=depots[0];
    const monthName=new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric'}).format(now);const criticalNames=critical.slice(0,3).map(m=>m.name).join(', ');
    const insight=totalOut===0?'Bu ay henüz stok çıkışı kaydedilmemiş. Saha hareketleri geldikçe kullanım analizi burada otomatik oluşacak.':`${monthName} döneminde ${n(totalOut)} birim stok çıkışı gerçekleşti. En yoğun tüketim ${topMat?`“${esc(materialName(data,topMat[0]))}” (${n(topMat[1])} birim)`:'belirli bir malzemede'} tarafında. ${topDepot?`En yoğun lokasyon ${esc(depotName(data,topDepot[0]))} (${n(topDepot[1])} birim çıkış).`:''}`;
    $('#dqManagerDate').textContent=monthName;$('#dqManagerContent').innerHTML=`<div class="dq-ai-hero"><section class="dq-ai-card"><div class="dq-ai-kicker">✦ OTOMATİK DEPO ANALİZİ</div><h2>Bu ay depoda ne oluyor?</h2><p>${insight}</p><div class="dq-period">Analiz kaynağı: DepoQR stok hareketleri · ${moves.length} hareket incelendi</div></section><div class="dq-alerts"><div class="dq-alert ${critical.length?'red':'amber'}"><b>${critical.length?'⚠️ Kritik stok':'✓ Kritik stok yok'}</b><span>${critical.length?`${n(critical.length)} malzeme minimum seviyede. ${esc(criticalNames)}${critical.length>3?' ve diğerleri.':''}`:'Mevcut stoklar tanımlı minimum seviyelerin üzerinde.'}</span></div><div class="dq-alert"><b>↔ Transfer</b><span>Bu ay ${n(transfers.length)} depo transferi kaydedildi.</span></div></div></div><div class="dq-manager-grid"><div class="dq-metric"><small>Bu ay çıkış</small><strong>${n(totalOut)}</strong><em>birim</em></div><div class="dq-metric"><small>Bu ay giriş</small><strong>${n(totalIn)}</strong><em>birim</em></div><div class="dq-metric"><small>Hareket sayısı</small><strong>${n(moves.length)}</strong><em>giriş + çıkış + transfer</em></div><div class="dq-metric"><small>Kritik malzeme</small><strong>${n(critical.length)}</strong><em>kontrol gerekli</em></div></div><div class="dq-analysis-grid"><section class="dq-panel"><h3>En çok kullanılan malzemeler</h3><p>Bu ayki stok çıkışlarına göre sıralandı.</p>${top.length?top.map((x,i)=>`<div class="dq-rank"><span class="dq-rank-num">0${i+1}</span><div class="dq-rank-name">${esc(materialName(data,x[0]))}<small>${esc(x[0])}</small><div class="dq-bar"><i style="width:${Math.max(5,Math.round(x[1]/max*100))}%"></i></div></div><span class="dq-rank-val">${n(x[1])}</span></div>`).join(''):'<div class="dq-empty">Bu ay henüz çıkış hareketi yok.</div>'}</section><section class="dq-panel"><h3>Nerede kullanıldı?</h3><p>Çıkış hareketlerindeki kaynak depoya göre.</p>${depots.length?depots.slice(0,6).map(x=>`<div class="dq-depot-row"><span>${esc(depotName(data,x[0]))}</span><strong>${n(x[1])} birim</strong></div>`).join(''):'<div class="dq-empty">Henüz kullanım verisi yok.</div>'}</section></div>`;
  }
  function boot(){ensureStyle();addNav();addView();const p=document.querySelector('.user-panel');if(p){const strong=p.querySelector('strong'),small=p.querySelector('small');if(strong)strong.textContent='Depo yöneticisi';if(small)small.innerHTML='Yönetici <span class="dq-manager-badge">✦ YÖNETİCİ</span>'}setInterval(()=>{if($('#view-manager')?.classList.contains('active'))render()},3000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

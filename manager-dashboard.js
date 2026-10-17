(() => {
  'use strict';

  const KEY = 'depoqr_v1';
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const n = v => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Number(v) || 0);
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  const monthKey = value => { const d = new Date(value); if (Number.isNaN(d.getTime())) return ''; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  const monthLabel = key => { const [y,m] = key.split('-').map(Number); return new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)); };
  const shiftMonth = (key, delta) => { const [y,m] = key.split('-').map(Number); const d = new Date(y,m-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  const materialName = (data,id) => data.materials.find(m => m.id === id)?.name || id || 'Bilinmeyen malzeme';
  const depotName = (data,id) => data.depots.find(d => d.id === id)?.name || id || 'Belirtilmemiş';
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  let selectedMonth = thisMonth();
  let pickerYear = Number(selectedMonth.slice(0,4));

  function ensureStyle() {
    if ($('#dqManagerStyle')) return;
    const s = document.createElement('style');
    s.id = 'dqManagerStyle';
    s.textContent = `
      #view-manager.dq-manager-view{display:none!important;font-family:Inter,DM Sans,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18324a}
      .view.active#view-manager.dq-manager-view{display:block!important}
      #view-manager .dq-manager-heading{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:24px!important;margin-bottom:24px!important}
      #view-manager .dq-eyebrow{display:flex;align-items:center;gap:9px;color:#397fc2;font-size:12px;font-weight:900;letter-spacing:.13em;margin-bottom:9px}
      #view-manager .dq-eyebrow i{width:28px;height:4px;border-radius:8px;background:#4b96df;display:block}
      #view-manager .dq-manager-heading h1{margin:0!important;color:#102b45!important;font-size:42px!important;line-height:1.05!important;letter-spacing:-.035em!important}
      #view-manager .dq-manager-heading .subheading{margin:9px 0 0!important;color:#71869a!important;font-size:15px!important;line-height:1.5!important}
      #view-manager .dq-period-picker{position:relative;display:flex;align-items:center;gap:8px;z-index:50}
      #view-manager .dq-period-button{height:48px;min-width:190px;padding:0 16px;border:1px solid #d7e2ec;border-radius:13px;background:#fff;color:#17334d;display:flex;align-items:center;justify-content:center;gap:9px;font:800 15px/1 Inter,DM Sans,system-ui,sans-serif;cursor:pointer;box-shadow:0 5px 18px rgba(25,58,88,.07);transition:.18s}
      #view-manager .dq-period-button:hover,#view-manager .dq-period-button.open{border-color:#6ba4d8;box-shadow:0 8px 24px rgba(48,108,164,.15);transform:translateY(-1px)}
      #view-manager .dq-period-button .calendar{font-size:18px;color:#3987cc}
      #view-manager .dq-period-nav{width:38px;height:38px;border:1px solid #d7e2ec;background:#fff;border-radius:10px;color:#45647e;font-size:23px;line-height:1;cursor:pointer}
      #view-manager .dq-period-nav:hover{background:#edf5fb;color:#1d6eae}
      #view-manager .dq-period-menu{position:absolute;right:0;top:57px;width:300px;padding:16px;background:#fff;border:1px solid #d7e2ec;border-radius:16px;box-shadow:0 18px 45px rgba(18,47,74,.18);display:none;z-index:100}
      #view-manager .dq-period-menu.open{display:block}
      #view-manager .dq-year-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}
      #view-manager .dq-year-row strong{font-size:16px;color:#17334d}
      #view-manager .dq-year-row button{width:32px;height:32px;border:1px solid #dce6ef;background:#f7fafc;border-radius:8px;color:#42627c;cursor:pointer;font-size:18px}
      #view-manager .dq-month-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
      #view-manager .dq-month-option{border:1px solid #e0e8ef;background:#f8fafc;color:#49657c;border-radius:9px;padding:10px 5px;font:700 12px Inter,DM Sans,system-ui,sans-serif;cursor:pointer}
      #view-manager .dq-month-option:hover{border-color:#75a9d4;background:#edf6fd;color:#176aa6}
      #view-manager .dq-month-option.selected{background:#1f78b9;border-color:#1f78b9;color:#fff;box-shadow:0 4px 10px rgba(31,120,185,.22)}
      #view-manager .dq-month-option.current:not(.selected){border-color:#8dbce0;color:#176aa6}
      #view-manager .dq-period-menu small{display:block;color:#7b8fa1;font-size:11px;margin-top:12px;text-align:center}
      #view-manager .dq-selected-note{display:flex;align-items:center;gap:9px;margin-bottom:18px;padding:11px 14px;background:#eef7fd;border:1px solid #d6eafa;border-radius:11px;color:#41647e;font-size:13px}
      #view-manager .dq-selected-note strong{color:#176da8}
      #view-manager .dq-dashboard-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(270px,.55fr);gap:18px;margin-bottom:18px}
      #view-manager .dq-ai-card{position:relative;overflow:hidden;min-height:205px;padding:27px 30px;border-radius:20px;background:linear-gradient(135deg,#123c62 0%,#176aa0 100%);box-shadow:0 12px 30px rgba(24,91,139,.17);color:#fff}
      #view-manager .dq-ai-card:after{content:'AI';position:absolute;right:-10px;bottom:-48px;color:rgba(255,255,255,.07);font-size:150px;font-weight:900;line-height:1;pointer-events:none}
      #view-manager .dq-ai-kicker{position:relative;z-index:1;color:#b9ddfa;font-size:11px;font-weight:900;letter-spacing:.15em}
      #view-manager .dq-ai-card h2{position:relative;z-index:1;margin:10px 0 12px;color:#fff!important;font-size:25px!important;line-height:1.2!important;letter-spacing:-.02em!important}
      #view-manager .dq-ai-card p{position:relative;z-index:1;max-width:860px;margin:0;color:#edf7ff!important;font-size:15px!important;line-height:1.7!important}
      #view-manager .dq-period-meta{position:relative;z-index:1;margin-top:18px;color:#c3e0f5;font-size:12px}
      #view-manager .dq-alert-column{display:grid;gap:12px}
      #view-manager .dq-alert{min-height:92px;padding:16px 18px;border:1px solid #dce5ed;border-left:5px solid #4a94d3;border-radius:15px;background:#fff;box-shadow:0 6px 18px rgba(26,57,84,.06)}
      #view-manager .dq-alert.red{border-left-color:#df6262}.dq-alert.amber{border-left-color:#e2a343}
      #view-manager .dq-alert-title{display:flex;align-items:center;gap:7px;margin-bottom:7px;color:#17344d;font-size:14px;font-weight:900}
      #view-manager .dq-alert-text{color:#5c7184;font-size:12px;line-height:1.55}
      #view-manager .dq-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}
      #view-manager .dq-metric{position:relative;overflow:hidden;padding:19px 20px;border:1px solid #dce5ed;border-radius:15px;background:#fff;box-shadow:0 6px 18px rgba(26,57,84,.05)}
      #view-manager .dq-metric:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#5a9bd5}
      #view-manager .dq-metric:nth-child(2):before{background:#55ae82}.dq-metric:nth-child(3):before{background:#8b78c7}.dq-metric:nth-child(4):before{background:#df6969}
      #view-manager .dq-metric-label{color:#61788c;font-size:12px;font-weight:800}
      #view-manager .dq-metric-value{margin-top:9px;color:#15334d;font-size:30px;font-weight:900;line-height:1}
      #view-manager .dq-metric-foot{margin-top:7px;color:#7a8fa0;font-size:11px}
      #view-manager .dq-panels{display:grid;grid-template-columns:1.08fr .92fr;gap:18px}
      #view-manager .dq-panel{border:1px solid #dce5ed;border-radius:17px;background:#fff;padding:21px 22px;box-shadow:0 6px 18px rgba(26,57,84,.05)}
      #view-manager .dq-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:15px;margin-bottom:15px}
      #view-manager .dq-panel h3{margin:0;color:#17344d!important;font-size:18px!important;line-height:1.2!important}
      #view-manager .dq-panel-sub{margin:5px 0 0;color:#738798;font-size:12px;line-height:1.4}
      #view-manager .dq-rank{display:grid;grid-template-columns:35px minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #edf1f4}
      #view-manager .dq-rank:last-child{border-bottom:0}
      #view-manager .dq-rank-num{color:#7890a3;font-weight:900;font-size:12px}
      #view-manager .dq-rank-name{color:#27465f;font-weight:800;font-size:13px}
      #view-manager .dq-rank-code{display:block;margin-top:3px;color:#8a9aaa;font-size:10px;font-weight:600}
      #view-manager .dq-rank-value{color:#176da8;font-weight:900;font-size:13px}
      #view-manager .dq-bar{height:6px;margin-top:8px;background:#e8eff5;border-radius:99px;overflow:hidden}
      #view-manager .dq-bar i{display:block;height:100%;background:linear-gradient(90deg,#438bc8,#70b3e7);border-radius:99px}
      #view-manager .dq-depot{display:flex;justify-content:space-between;align-items:center;gap:15px;padding:14px 0;border-bottom:1px solid #edf1f4}
      #view-manager .dq-depot:last-child{border-bottom:0}
      #view-manager .dq-depot-name{color:#36566e;font-weight:800;font-size:13px}.dq-depot-value{color:#176da8;font-weight:900;font-size:13px}
      #view-manager .dq-empty{padding:25px 10px;text-align:center;color:#8193a1;background:#f7fafc;border-radius:10px;font-size:12px}
      #view-manager .dq-current-tag{padding:5px 8px;border-radius:99px;background:#edf7fd;color:#2777b1;font-size:10px;font-weight:900}
      @media(max-width:1050px){#view-manager .dq-dashboard-grid,#view-manager .dq-panels{grid-template-columns:1fr}#view-manager .dq-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:680px){#view-manager .dq-manager-heading{align-items:stretch!important;flex-direction:column!important}#view-manager .dq-period-picker{justify-content:flex-end}#view-manager .dq-period-menu{right:0;left:auto;width:min(300px,calc(100vw - 42px))}#view-manager .dq-metrics{grid-template-columns:1fr}#view-manager .dq-ai-card{padding:22px}.dq-ai-card h2{font-size:21px!important}}
    `;
    document.head.appendChild(s);
  }

  function closePicker(){ $('#dqPeriodMenu')?.classList.remove('open'); $('#dqPeriodButton')?.classList.remove('open'); }

  function renderMonthMenu(){
    const menu=$('#dqPeriodMenu'); if(!menu)return;
    menu.innerHTML=`<div class="dq-year-row"><button type="button" id="dqYearPrev">‹</button><strong>${pickerYear}</strong><button type="button" id="dqYearNext">›</button></div><div class="dq-month-grid">${months.map((m,i)=>{const key=`${pickerYear}-${String(i+1).padStart(2,'0')}`;return `<button type="button" class="dq-month-option ${key===selectedMonth?'selected':''} ${key===thisMonth()?'current':''}" data-month="${key}">${m}</button>`;}).join('')}</div><small>İstediğin ayı seç. Dashboard yalnızca analiz dönemini değiştirir.</small>`;
    $('#dqYearPrev').onclick=()=>{pickerYear--;renderMonthMenu();};
    $('#dqYearNext').onclick=()=>{pickerYear++;renderMonthMenu();};
    menu.querySelectorAll('[data-month]').forEach(btn=>btn.onclick=()=>{selectedMonth=btn.dataset.month;pickerYear=Number(selectedMonth.slice(0,4));closePicker();render();});
  }

  function togglePicker(){
    const menu=$('#dqPeriodMenu'),button=$('#dqPeriodButton'); if(!menu||!button)return;
    const open=!menu.classList.contains('open'); menu.classList.toggle('open',open); button.classList.toggle('open',open);
    if(open){pickerYear=Number(selectedMonth.slice(0,4));renderMonthMenu();}
  }

  function addNav(){
    const nav=$('.nav-list'); if(!nav||nav.querySelector('[data-view="manager"]'))return;
    const b=document.createElement('button'); b.className='nav-item'; b.dataset.view='manager'; b.innerHTML='<span class="nav-icon">✦</span> Yönetici Analizi'; nav.appendChild(b);
    b.onclick=()=>{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-manager'));document.querySelectorAll('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x===b));const c=$('#crumbTitle');if(c)c.textContent='Yönetici Analizi';render();$('#sidebar')?.classList.remove('open');};
  }

  function addView(){
    if($('#view-manager'))return;
    const wrap=$('.page-content'); if(!wrap)return;
    const v=document.createElement('section'); v.className='view dq-manager-view'; v.id='view-manager';
    v.innerHTML=`<div class="page-heading compact-heading dq-manager-heading"><div><div class="dq-eyebrow"><i></i> YÖNETİCİ KONTROL MERKEZİ</div><h1>Yönetici Analizi</h1><p class="subheading">Depo hareketlerini dönem seçerek tek ekranda analiz et.</p></div><div class="dq-period-picker"><button type="button" class="dq-period-nav" id="dqPrevMonth" aria-label="Önceki ay">‹</button><button type="button" class="dq-period-button" id="dqPeriodButton"><span class="calendar">▣</span><span id="dqMonthLabel">${esc(monthLabel(selectedMonth))}</span><span>⌄</span></button><button type="button" class="dq-period-nav" id="dqNextMonth" aria-label="Sonraki ay">›</button><div class="dq-period-menu" id="dqPeriodMenu"></div></div></div><div id="dqManagerContent"></div>`;
    wrap.appendChild(v);
    $('#dqPeriodButton').onclick=togglePicker;
    $('#dqPrevMonth').onclick=()=>{selectedMonth=shiftMonth(selectedMonth,-1);pickerYear=Number(selectedMonth.slice(0,4));render();};
    $('#dqNextMonth').onclick=()=>{selectedMonth=shiftMonth(selectedMonth,1);pickerYear=Number(selectedMonth.slice(0,4));render();};
    document.addEventListener('click',e=>{if(!e.target.closest('.dq-period-picker'))closePicker();});
  }

  function render(){
    const data=read(); if(!data||!Array.isArray(data.materials)||!Array.isArray(data.movements))return;
    const moves=data.movements.filter(m=>monthKey(m.date||m.createdAt)===selectedMonth);
    const exits=moves.filter(m=>m.type==='Çıkış'), entries=moves.filter(m=>m.type==='Giriş'), transfers=moves.filter(m=>m.type==='Transfer');
    const totalOut=exits.reduce((s,m)=>s+(Number(m.qty)||0),0), totalIn=entries.reduce((s,m)=>s+(Number(m.qty)||0),0);
    const critical=data.materials.filter(m=>(Number(m.stock)||0)<=Math.max(0,Number(m.minStock)||0));
    const usage={}; exits.forEach(m=>{usage[m.materialId]=(usage[m.materialId]||0)+(Number(m.qty)||0);});
    const top=Object.entries(usage).sort((a,b)=>b[1]-a[1]).slice(0,6), max=top[0]?.[1]||1;
    const depotUsage={}; exits.forEach(m=>{const id=m.from||m.depotId||'—';depotUsage[id]=(depotUsage[id]||0)+(Number(m.qty)||0);});
    const depots=Object.entries(depotUsage).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const topMat=top[0], topDepot=depots[0];
    const label=monthLabel(selectedMonth), current=selectedMonth===thisMonth();
    const criticalNames=critical.slice(0,3).map(m=>m.name).join(', ');
    const insight=totalOut===0?`${label} döneminde kayıtlı stok çıkışı bulunmuyor. O aya ait hareketler eklendikçe analiz otomatik güncellenecek.`:`${label} döneminde toplam ${n(totalOut)} birim stok çıkışı gerçekleşti. En yoğun tüketim ${topMat?`“${esc(materialName(data,topMat[0]))}” (${n(topMat[1])} birim)`:'belirli bir malzemede'} gerçekleşti${topDepot?`. En yoğun kullanım ${esc(depotName(data,topDepot[0]))} deposunda (${n(topDepot[1])} birim).`:'.'}`;
    $('#dqMonthLabel').textContent=label;
    $('#dqManagerContent').innerHTML=`
      <div class="dq-selected-note">📅 <span><strong>${esc(label)}</strong> dönemi seçili. Bu seçim yalnızca raporu değiştirir; stok miktarlarını değiştirmez.</span>${current?'<span class="dq-current-tag">GÜNCEL AY</span>':''}</div>
      <div class="dq-dashboard-grid">
        <section class="dq-ai-card"><div class="dq-ai-kicker">✦ OTOMATİK DEPO ANALİZİ</div><h2>${esc(label)} döneminde depoda ne oldu?</h2><p>${insight}</p><div class="dq-period-meta">Gerçek DepoQR hareketleri · ${moves.length} hareket incelendi</div></section>
        <div class="dq-alert-column"><div class="dq-alert ${critical.length?'red':''}"><div class="dq-alert-title">${critical.length?'⚠️':'✓'} Kritik stok</div><div class="dq-alert-text">${critical.length?`${n(critical.length)} malzeme şu an minimum seviyede: ${esc(criticalNames)}${critical.length>3?' ve diğerleri.':''}`:'Şu anda minimum seviyenin altında veya eşit stok bulunmuyor.'}</div></div><div class="dq-alert amber"><div class="dq-alert-title">↔ Transfer</div><div class="dq-alert-text">${esc(label)} döneminde <strong>${n(transfers.length)}</strong> depo transferi kaydedildi.</div></div></div>
      </div>
      <div class="dq-metrics"><div class="dq-metric"><div class="dq-metric-label">Dönem çıkışı</div><div class="dq-metric-value">${n(totalOut)}</div><div class="dq-metric-foot">birim malzeme çıkışı</div></div><div class="dq-metric"><div class="dq-metric-label">Dönem girişi</div><div class="dq-metric-value">${n(totalIn)}</div><div class="dq-metric-foot">birim malzeme girişi</div></div><div class="dq-metric"><div class="dq-metric-label">Hareket sayısı</div><div class="dq-metric-value">${n(moves.length)}</div><div class="dq-metric-foot">giriş + çıkış + transfer</div></div><div class="dq-metric"><div class="dq-metric-label">Kritik malzeme</div><div class="dq-metric-value">${n(critical.length)}</div><div class="dq-metric-foot">${current?'bugünkü':'şu anki'} stok durumu</div></div></div>
      <div class="dq-panels"><section class="dq-panel"><div class="dq-panel-head"><div><h3>En çok kullanılan malzemeler</h3><p class="dq-panel-sub">${esc(label)} dönemindeki stok çıkışlarına göre.</p></div></div>${top.length?top.map((x,i)=>`<div class="dq-rank"><span class="dq-rank-num">${String(i+1).padStart(2,'0')}</span><div><div class="dq-rank-name">${esc(materialName(data,x[0]))}</div><span class="dq-rank-code">${esc(x[0])}</span><div class="dq-bar"><i style="width:${Math.max(5,Math.round(x[1]/max*100))}%"></i></div></div><span class="dq-rank-value">${n(x[1])} adet</span></div>`).join(''):'<div class="dq-empty">Bu dönemde henüz stok çıkışı yok.</div>'}</section><section class="dq-panel"><div class="dq-panel-head"><div><h3>Nerede kullanıldı?</h3><p class="dq-panel-sub">Çıkışların kaynak deposuna göre dağılımı.</p></div></div>${depots.length?depots.map(x=>`<div class="dq-depot"><span class="dq-depot-name">${esc(depotName(data,x[0]))}</span><strong class="dq-depot-value">${n(x[1])} adet</strong></div>`).join(''):'<div class="dq-empty">Bu dönemde kullanım verisi yok.</div>'}</section></div>`;
  }

  function boot(){ensureStyle();addNav();addView();if($('#view-manager')?.classList.contains('active'))render();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  new MutationObserver(()=>{if(!$('#view-manager')){addNav();addView();}}).observe(document.body,{childList:true,subtree:true});
})();
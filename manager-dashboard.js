(() => {
  'use strict';

  const KEY = 'depoqr_v1';
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number(v) || 0;
  const fmt = v => new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(num(v));
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const now = new Date();
  const monthKey = d => { const x = new Date(d); if(Number.isNaN(x.getTime())) return ''; return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`; };
  const currentMonth = () => `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const shiftMonth = (key, delta) => { const [y,m]=key.split('-').map(Number); const d=new Date(y,m-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
  const monthLabel = key => { const [y,m]=key.split('-').map(Number); return new Intl.DateTimeFormat('tr-TR',{month:'long',year:'numeric'}).format(new Date(y,m-1,1)); };
  const matName = (d,id) => d.materials.find(x=>x.id===id)?.name || id || 'Bilinmeyen';
  const depotName = (d,id) => d.depots.find(x=>x.id===id)?.name || id || 'Belirtilmemiş';
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  let selectedMonth = currentMonth();
  let pickerYear = Number(selectedMonth.slice(0,4));
  let activeTab = 'overview';

  function styles(){
    if($('#dqManagerProStyle')) return;
    const s=document.createElement('style'); s.id='dqManagerProStyle';
    s.textContent=`
      #view-manager.dq-manager-view{display:none!important;font-family:Inter,DM Sans,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17344d}
      .view.active#view-manager.dq-manager-view{display:block!important}
      #view-manager *{box-sizing:border-box}
      #view-manager .dq-head{display:flex;justify-content:space-between;align-items:flex-end;gap:22px;margin-bottom:22px}
      #view-manager .dq-eyebrow{display:flex;align-items:center;gap:9px;color:#3c83c3;font-size:11px;font-weight:900;letter-spacing:.14em;margin-bottom:8px}
      #view-manager .dq-eyebrow i{display:block;width:27px;height:4px;border-radius:99px;background:#4b98df}
      #view-manager h1{margin:0;color:#102c45;font-size:42px;line-height:1.04;letter-spacing:-.04em}
      #view-manager .dq-sub{margin:9px 0 0;color:#71879a;font-size:14px;line-height:1.5}
      #view-manager .dq-period{position:relative;display:flex;align-items:center;gap:7px;z-index:100}
      #view-manager .dq-period button{font-family:inherit;cursor:pointer}
      #view-manager .dq-period-main{height:48px;min-width:190px;padding:0 15px;border:1px solid #d6e1ea;border-radius:13px;background:#fff;color:#17344d;font-weight:850;box-shadow:0 5px 18px rgba(26,57,84,.06)}
      #view-manager .dq-period-main:hover{border-color:#70a9d9;box-shadow:0 8px 22px rgba(43,105,160,.13)}
      #view-manager .dq-period-nav{width:38px;height:38px;border:1px solid #d7e2ec;border-radius:10px;background:#fff;color:#49667d;font-size:21px}
      #view-manager .dq-period-nav:hover{background:#edf6fd;color:#176da8}
      #view-manager .dq-period-menu{display:none;position:absolute;right:0;top:57px;width:310px;padding:15px;background:#fff;border:1px solid #d7e2ec;border-radius:16px;box-shadow:0 20px 50px rgba(18,47,74,.18)}
      #view-manager .dq-period-menu.open{display:block}
      #view-manager .dq-year{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.dq-year strong{color:#17344d}.dq-year button{width:31px;height:31px;border:1px solid #dce6ef;background:#f7fafc;border-radius:8px;color:#49667d;font-size:18px}
      #view-manager .dq-months{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.dq-month{padding:10px 4px;border:1px solid #e0e8ef;border-radius:9px;background:#f8fafc;color:#4d677d;font:750 12px Inter,DM Sans,system-ui,sans-serif}.dq-month:hover{background:#edf6fd;border-color:#72a9d7;color:#176da8}.dq-month.sel{background:#1f78b9;border-color:#1f78b9;color:#fff}.dq-month-menu-note{display:block;margin-top:11px;text-align:center;color:#7d90a0;font-size:10px}
      #view-manager .dq-tabs{display:flex;gap:4px;padding:5px;margin-bottom:18px;background:#eaf0f5;border:1px solid #dce5ed;border-radius:13px;width:max-content;max-width:100%;overflow:auto}
      #view-manager .dq-tab{border:0;border-radius:9px;background:transparent;color:#5b7184;padding:10px 15px;font:800 12px Inter,DM Sans,system-ui,sans-serif;white-space:nowrap}.dq-tab:hover{color:#176da8}.dq-tab.active{background:#fff;color:#176da8;box-shadow:0 3px 10px rgba(27,70,104,.09)}
      #view-manager .dq-banner{display:flex;align-items:center;gap:10px;margin-bottom:18px;padding:11px 14px;background:#eef7fd;border:1px solid #d7eafa;border-radius:11px;color:#41647e;font-size:12px}.dq-banner strong{color:#176da8}
      #view-manager .dq-hero{display:grid;grid-template-columns:minmax(0,1.42fr) minmax(285px,.58fr);gap:17px;margin-bottom:17px}
      #view-manager .dq-ai{position:relative;overflow:hidden;min-height:215px;padding:27px 29px;border-radius:20px;background:linear-gradient(135deg,#103653,#176fa9);box-shadow:0 12px 30px rgba(22,83,126,.16);color:#fff}.dq-ai:after{content:'AI';position:absolute;right:-5px;bottom:-47px;font-size:150px;font-weight:900;line-height:1;color:rgba(255,255,255,.065);pointer-events:none}.dq-ai-kicker{position:relative;z-index:1;color:#b9ddfa;font-size:11px;font-weight:900;letter-spacing:.15em}.dq-ai h2{position:relative;z-index:1;margin:9px 0 11px;color:#fff;font-size:25px;line-height:1.2}.dq-ai p{position:relative;z-index:1;max-width:850px;margin:0;color:#edf7ff;font-size:15px;line-height:1.7}.dq-ai-foot{position:relative;z-index:1;margin-top:17px;color:#c8e3f6;font-size:11px}
      #view-manager .dq-alerts{display:grid;gap:11px}.dq-alert{min-height:101px;padding:15px 17px;border:1px solid #dbe5ed;border-left:5px solid #4a95d3;border-radius:14px;background:#fff;box-shadow:0 6px 18px rgba(26,57,84,.055)}.dq-alert.red{border-left-color:#dd6262}.dq-alert.amber{border-left-color:#e0a03d}.dq-alert.green{border-left-color:#55a47a}.dq-alert-title{margin-bottom:7px;color:#18374f;font-size:13px;font-weight:900}.dq-alert-text{color:#607587;font-size:11px;line-height:1.55}
      #view-manager .dq-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:17px}.dq-kpi{position:relative;padding:17px 18px;border:1px solid #dce5ed;border-radius:14px;background:#fff;box-shadow:0 5px 17px rgba(26,57,84,.045);overflow:hidden}.dq-kpi:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:#4d95d2}.dq-kpi:nth-child(2):before{background:#55a57b}.dq-kpi:nth-child(3):before{background:#8a73c7}.dq-kpi:nth-child(4):before{background:#dc6868}.dq-kpi:nth-child(5):before{background:#d49b40}.dq-kpi-label{color:#63798b;font-size:11px;font-weight:850}.dq-kpi-value{margin-top:8px;color:#15334c;font-size:28px;font-weight:900;line-height:1}.dq-kpi-foot{margin-top:7px;color:#8092a1;font-size:10px}
      #view-manager .dq-grid2{display:grid;grid-template-columns:1.05fr .95fr;gap:17px;margin-bottom:17px}.dq-card{border:1px solid #dce5ed;border-radius:16px;background:#fff;padding:20px 21px;box-shadow:0 6px 18px rgba(26,57,84,.045)}.dq-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px}.dq-card h3{margin:0;color:#17344d;font-size:17px}.dq-card-sub{margin:5px 0 0;color:#74899a;font-size:11px;line-height:1.45}
      #view-manager .dq-bars{display:grid;grid-template-columns:repeat(6,1fr);align-items:end;gap:11px;height:180px;padding-top:10px}.dq-bar-col{display:flex;flex-direction:column;justify-content:flex-end;height:100%;text-align:center}.dq-bar-value{color:#397eae;font-size:10px;font-weight:850;margin-bottom:5px}.dq-bar-track{height:125px;display:flex;align-items:flex-end;justify-content:center}.dq-bar-fill{width:26px;min-height:2px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,#62abe1,#2e7fb9)}.dq-bar-label{margin-top:7px;color:#718697;font-size:10px;font-weight:750}
      #view-manager .dq-list{display:grid;gap:1px}.dq-row{display:grid;grid-template-columns:35px minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #edf1f4}.dq-row:last-child{border-bottom:0}.dq-rank{color:#8195a5;font-size:11px;font-weight:900}.dq-row-name{color:#294a63;font-size:12px;font-weight:850}.dq-row-meta{display:block;margin-top:3px;color:#8999a7;font-size:10px;font-weight:600}.dq-row-value{color:#176da8;font-size:12px;font-weight:900}.dq-progress{height:5px;margin-top:7px;background:#e8eff4;border-radius:99px;overflow:hidden}.dq-progress i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#438dca,#77b7e8)}
      #view-manager .dq-table{width:100%;border-collapse:collapse;font-size:11px}.dq-table th{text-align:left;padding:9px 8px;color:#8193a1;font-size:10px;border-bottom:1px solid #e3eaf0}.dq-table td{padding:10px 8px;color:#35536a;border-bottom:1px solid #edf1f4}.dq-table td strong{color:#1a405d}.dq-table tr:last-child td{border-bottom:0}.dq-pill{display:inline-flex;padding:4px 7px;border-radius:99px;font-size:9px;font-weight:900}.dq-pill.a{background:#e8f4fc;color:#1d70a9}.dq-pill.b{background:#eef7ef;color:#42845e}.dq-pill.c{background:#f5f2fb;color:#7560a6}.dq-pill.red{background:#fdeeee;color:#c04e4e}.dq-pill.amber{background:#fff6e5;color:#a96e15}.dq-pill.green{background:#eaf7ef;color:#3f855e}
      #view-manager .dq-health{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:17px}.dq-health-box{padding:15px;border:1px solid #dce5ed;border-radius:13px;background:#fff}.dq-health-box strong{display:block;color:#17344d;font-size:24px}.dq-health-box span{display:block;margin-top:5px;color:#728697;font-size:10px}.dq-health-box b{display:block;margin-top:9px;font-size:10px}.dq-health-box.good b{color:#4d976e}.dq-health-box.warn b{color:#b77920}.dq-health-box.bad b{color:#c75454}
      #view-manager .dq-section-title{margin:0 0 14px;color:#17344d;font-size:20px}.dq-section-intro{margin:-6px 0 17px;color:#74899a;font-size:12px;line-height:1.5}
      #view-manager .dq-empty{padding:24px;text-align:center;border-radius:11px;background:#f7fafc;color:#8193a1;font-size:11px}
      @media(max-width:1100px){#view-manager .dq-kpis{grid-template-columns:repeat(3,1fr)}#view-manager .dq-hero,#view-manager .dq-grid2{grid-template-columns:1fr}}
      @media(max-width:720px){#view-manager h1{font-size:34px}.dq-head{align-items:stretch!important;flex-direction:column}.dq-period{justify-content:flex-end}.dq-period-menu{right:0;width:min(310px,calc(100vw - 40px))}.dq-kpis{grid-template-columns:repeat(2,1fr)!important}.dq-health{grid-template-columns:1fr!important}.dq-bars{gap:5px!important}.dq-bar-fill{width:20px!important}}
      @media(max-width:480px){#view-manager .dq-kpis{grid-template-columns:1fr!important}.dq-tabs{width:100%!important}.dq-tab{flex:1}.dq-period{justify-content:stretch}.dq-period-main{flex:1;min-width:0!important}}
    `; document.head.appendChild(s);
  }

  function periodMenu(){
    const menu=$('#dqPeriodMenu'); if(!menu)return;
    menu.innerHTML=`<div class="dq-year"><button type="button" id="dqYearPrev">‹</button><strong>${pickerYear}</strong><button type="button" id="dqYearNext">›</button></div><div class="dq-months">${months.map((m,i)=>{const k=`${pickerYear}-${String(i+1).padStart(2,'0')}`;return `<button type="button" class="dq-month ${k===selectedMonth?'sel':''}" data-k="${k}">${m}</button>`}).join('')}</div><small class="dq-month-menu-note">Seçilen dönem yalnızca analizleri değiştirir; stok miktarını değiştirmez.</small>`;
    $('#dqYearPrev').onclick=()=>{pickerYear--;periodMenu()}; $('#dqYearNext').onclick=()=>{pickerYear++;periodMenu()};
    menu.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{selectedMonth=b.dataset.k;pickerYear=Number(selectedMonth.slice(0,4));menu.classList.remove('open');render()});
  }
  function togglePeriod(){const m=$('#dqPeriodMenu');if(!m)return;const open=!m.classList.contains('open');m.classList.toggle('open',open);$('#dqPeriodMain')?.classList.toggle('open',open);if(open){pickerYear=Number(selectedMonth.slice(0,4));periodMenu()}}
  function setMonth(delta){selectedMonth=shiftMonth(selectedMonth,delta);pickerYear=Number(selectedMonth.slice(0,4));render()}

  function movementData(data){
    return (Array.isArray(data?.movements)?data.movements:[]).map(x=>({...x,qty:Math.abs(num(x.qty)),date:x.date||x.createdAt||x.timestamp||''})).filter(x=>x.date);
  }
  function monthMoves(data,key){return movementData(data).filter(x=>monthKey(x.date)===key)}
  function isOut(m){return /çıkış|cikis|tüket|tuket|sarf|veri/i.test(String(m.type||''))}
  function isIn(m){return /giriş|giris|alım|alim|gelen/i.test(String(m.type||''))}
  function isTransfer(m){return /transfer|taşı|tasi|depo değiş/i.test(String(m.type||''))}
  function outgoing(data,key){return monthMoves(data,key).filter(isOut)}
  function incoming(data,key){return monthMoves(data,key).filter(isIn)}

  function aggregateIssues(data,moves){
    const map=new Map(); moves.forEach(m=>{if(!isOut(m))return; const k=m.materialId||m.material||m.id; const cur=map.get(k)||{id:k,qty:0,count:0};cur.qty+=m.qty;cur.count++;map.set(k,cur)});
    return [...map.values()].sort((a,b)=>b.qty-a.qty);
  }
  function aggregateDepots(data,moves){
    const map=new Map(); moves.forEach(m=>{if(!isOut(m))return; const k=m.from||m.depotId||m.depot||m.location||''; if(!k)return; const cur=map.get(k)||{id:k,qty:0,count:0};cur.qty+=m.qty;cur.count++;map.set(k,cur)});return [...map.values()].sort((a,b)=>b.qty-a.qty);
  }
  function currentStock(data){return (data.materials||[]).map(m=>({...m,stock:num(m.stock),minStock:num(m.minStock)}));}

  function abc(data, moves){
    const rows=aggregateIssues(data,moves); const total=rows.reduce((s,x)=>s+x.qty,0); let cum=0;
    return rows.map(x=>{cum+=x.qty;const pct=total?cum/total:1;return {...x,share:total?x.qty/total:0,abc:pct<=.8?'A':pct<=.95?'B':'C'}});
  }
  function riskRows(data){
    const out6=[]; for(let i=1;i<=3;i++)out6.push(monthMoves(data,shiftMonth(selectedMonth,-i)).filter(isOut));
    const usage=new Map(); out6.forEach(ms=>ms.forEach(m=>{const k=m.materialId||m.material;usage.set(k,(usage.get(k)||0)+m.qty)}));
    return currentStock(data).map(m=>{const u=usage.get(m.id)||0;const monthly=u/3;const coverage=monthly>0?m.stock/monthly:Infinity;const critical=m.stock<=m.minStock;return {...m,monthly,coverage,critical}}).filter(x=>x.critical||x.monthly>0).sort((a,b)=>(a.critical?-1:0)-(b.critical?-1:0)||a.coverage-b.coverage);
  }
  function deadStock(data){
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-60);const used=new Set(movementData(data).filter(m=>isOut(m)&&new Date(m.date)>=cutoff).map(m=>m.materialId||m.material));return currentStock(data).filter(m=>m.stock>0&&!used.has(m.id));
  }
  function unusual(data){
    const cur=aggregateIssues(data,outgoing(data,selectedMonth)); const prev=aggregateIssues(data,outgoing(data,shiftMonth(selectedMonth,-1)));const pm=new Map(prev.map(x=>[x.id,x.qty]));return cur.map(x=>{const p=pm.get(x.id)||0;return {...x,prev:p,change:p?((x.qty-p)/p)*100:null}}).filter(x=>x.change!==null&&x.change>=40).sort((a,b)=>b.change-a.change).slice(0,5);
  }
  function trend(data){const arr=[];for(let i=5;i>=0;i--){const k=shiftMonth(selectedMonth,-i);arr.push({key:k,label:new Intl.DateTimeFormat('tr-TR',{month:'short'}).format(new Date(Number(k.slice(0,4)),Number(k.slice(5))-1,1)),qty:outgoing(data,k).reduce((s,m)=>s+m.qty,0)})}return arr}

  function aiSummary(data){
    const out=outgoing(data,selectedMonth), total=out.reduce((s,m)=>s+m.qty,0), top=aggregateIssues(data,out)[0], depot=aggregateDepots(data,out)[0], critical=currentStock(data).filter(m=>m.stock<=m.minStock).length, odd=unusual(data)[0], dead=deadStock(data).length;
    if(!out.length)return `${monthLabel(selectedMonth)} döneminde kayıtlı stok çıkışı bulunmuyor. Bu dönem için tüketim trendi, ABC sınıflaması ve kullanım karşılaştırması oluşturulamaz.`;
    let text=`${monthLabel(selectedMonth)} döneminde ${fmt(total)} birim stok çıkışı gerçekleşti.`;
    if(top)text+=` En yüksek tüketim “${matName(data,top.id)}” malzemesinde (${fmt(top.qty)} birim).`;
    if(depot)text+=` En yoğun kullanım ${depotName(data,depot.id)} bölgesinde (${fmt(depot.qty)} birim).`;
    if(critical)text+=` Şu an ${fmt(critical)} malzeme minimum stok seviyesinde veya altında.`;
    if(odd)text+=` ${matName(data,odd.id)} kullanımında önceki aya göre %${fmt(odd.change)} artış dikkat çekiyor.`;
    if(dead)text+=` Ayrıca ${fmt(dead)} malzeme son 60 günde hiç tüketilmemiş görünüyor.`;
    return text;
  }

  function overview(data){
    const moves=monthMoves(data,selectedMonth), out=moves.filter(isOut), inn=moves.filter(isIn), transfers=moves.filter(isTransfer), stocks=currentStock(data), critical=stocks.filter(m=>m.stock<=m.minStock), dead=deadStock(data), issues=aggregateIssues(data,out), depots=aggregateDepots(data,out), tr=trend(data), max=Math.max(1,...tr.map(x=>x.qty));
    return `<div class="dq-hero"><div class="dq-ai"><div class="dq-ai-kicker">✦ YÖNETİCİ ÖZETİ</div><h2>${esc(monthLabel(selectedMonth))} — Operasyonun kısa resmi</h2><p>${esc(aiSummary(data))}</p><div class="dq-ai-foot">${fmt(moves.length)} hareket analiz edildi · Veriler DepoQR stok hareketlerinden hesaplandı</div></div><div class="dq-alerts">
      <div class="dq-alert ${critical.length?'red':'green'}"><div class="dq-alert-title">${critical.length?'🔴 Kritik stok':'🟢 Stok durumu'}</div><div class="dq-alert-text">${critical.length?`${fmt(critical.length)} malzeme minimum seviyede veya altında. İlk kontrol: ${esc(critical[0]?.name||'—')}.`:'Minimum stok seviyesinde veya altında malzeme görünmüyor.'}</div></div>
      <div class="dq-alert ${dead.length?'amber':'green'}"><div class="dq-alert-title">${dead.length?'🟠 Hareketsiz stok':'🟢 Hareketsiz stok'}</div><div class="dq-alert-text">${dead.length?`${fmt(dead.length)} malzeme 60 gündür tüketilmemiş ve mevcut stoğu var.`:'60 gündür tüketilmeyen mevcut stok bulunmuyor.'}</div></div>
    </div></div>
    <div class="dq-kpis"><div class="dq-kpi"><div class="dq-kpi-label">Bu ay çıkış</div><div class="dq-kpi-value">${fmt(out.reduce((s,m)=>s+m.qty,0))}</div><div class="dq-kpi-foot">tüketim / sarf</div></div><div class="dq-kpi"><div class="dq-kpi-label">Bu ay giriş</div><div class="dq-kpi-value">${fmt(inn.reduce((s,m)=>s+m.qty,0))}</div><div class="dq-kpi-foot">stoğa alınan</div></div><div class="dq-kpi"><div class="dq-kpi-label">Hareket</div><div class="dq-kpi-value">${fmt(moves.length)}</div><div class="dq-kpi-foot">giriş + çıkış + transfer</div></div><div class="dq-kpi"><div class="dq-kpi-label">Kritik malzeme</div><div class="dq-kpi-value">${fmt(critical.length)}</div><div class="dq-kpi-foot">mevcut stok durumuna göre</div></div><div class="dq-kpi"><div class="dq-kpi-label">Transfer</div><div class="dq-kpi-value">${fmt(transfers.length)}</div><div class="dq-kpi-foot">bu dönemde kayıtlı</div></div></div>
    <div class="dq-grid2"><div class="dq-card"><div class="dq-card-head"><div><h3>Tüketim trendi</h3><p class="dq-card-sub">Seçilen ay dahil son 6 aylık gerçek çıkış miktarı.</p></div></div><div class="dq-bars">${tr.map(x=>`<div class="dq-bar-col"><div class="dq-bar-value">${fmt(x.qty)}</div><div class="dq-bar-track"><i class="dq-bar-fill" style="height:${Math.max(2,(x.qty/max)*100)}%"></i></div><div class="dq-bar-label">${esc(x.label)}</div></div>`).join('')}</div></div><div class="dq-card"><div class="dq-card-head"><div><h3>En çok kullanılanlar</h3><p class="dq-card-sub">Çıkış miktarına göre ilk 5 malzeme.</p></div></div><div class="dq-list">${issues.slice(0,5).map((x,i)=>`<div class="dq-row"><div class="dq-rank">${String(i+1).padStart(2,'0')}</div><div><div class="dq-row-name">${esc(matName(data,x.id))}</div><div class="dq-row-meta">${esc(x.id)}</div><div class="dq-progress"><i style="width:${issues[0]?Math.max(3,(x.qty/issues[0].qty)*100):0}%"></i></div></div><div class="dq-row-value">${fmt(x.qty)}</div></div>`).join('')||'<div class="dq-empty">Bu dönemde çıkış hareketi yok.</div>'}</div></div></div>
    <div class="dq-grid2"><div class="dq-card"><div class="dq-card-head"><div><h3>Depo tüketim karşılaştırması</h3><p class="dq-card-sub">Çıkış hareketlerinin kaynak depo dağılımı.</p></div></div>${depots.slice(0,6).map(x=>`<div class="dq-row" style="grid-template-columns:minmax(0,1fr) auto"><div class="dq-row-name">${esc(depotName(data,x.id))}<div class="dq-progress"><i style="width:${depots[0]?Math.max(3,x.qty/depots[0].qty*100):0}%"></i></div></div><div class="dq-row-value">${fmt(x.qty)} birim</div></div>`).join('')||'<div class="dq-empty">Depo bazlı çıkış bulunmuyor.</div>'}</div><div class="dq-card"><div class="dq-card-head"><div><h3>Dikkat çeken değişimler</h3><p class="dq-card-sub">Önceki aya göre ≥ %40 artan tüketimler.</p></div></div>${unusual(data).map(x=>`<div class="dq-row" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="dq-row-name">${esc(matName(data,x.id))}</div><div class="dq-row-meta">Önceki: ${fmt(x.prev)} · Bu ay: ${fmt(x.qty)}</div></div><div class="dq-pill red">+%${fmt(x.change)}</div></div>`).join('')||'<div class="dq-empty">Önceki aya göre belirgin artış bulunmadı.</div>'}</div></div>`;
  }

  function inventoryTab(data){
    const rows=abc(data,outgoing(data,selectedMonth)), risks=riskRows(data), dead=deadStock(data), a=rows.filter(x=>x.abc==='A').length,b=rows.filter(x=>x.abc==='B').length,c=rows.filter(x=>x.abc==='C').length;
    return `<h2 class="dq-section-title">Stok zekâsı</h2><p class="dq-section-intro">Kurumsal WMS'lerde kullanılan ABC sınıflaması, çevrim sayımı, stok kapsama ve hareketsiz stok göstergelerini DepoQR'un mevcut verilerine uyarladık. ABC burada tüketim miktarına göre hesaplanır; stok miktarı değiştirilmez.</p>
      <div class="dq-health"><div class="dq-health-box good"><strong>${fmt(a)}</strong><span>A sınıfı · yüksek tüketim</span><b>Öncelikli sayım</b></div><div class="dq-health-box warn"><strong>${fmt(b)}</strong><span>B sınıfı · orta tüketim</span><b>Düzenli sayım</b></div><div class="dq-health-box good"><strong>${fmt(c)}</strong><span>C sınıfı · düşük tüketim</span><b>Daha seyrek sayım</b></div></div>
      <div class="dq-grid2"><div class="dq-card"><div class="dq-card-head"><div><h3>ABC tüketim sınıflaması</h3><p class="dq-card-sub">A: ilk %80 · B: sonraki %15 · C: kalan %5 yaklaşımı.</p></div></div><table class="dq-table"><thead><tr><th>Malzeme</th><th>Tüketim</th><th>Pay</th><th>Sınıf</th></tr></thead><tbody>${rows.slice(0,12).map(x=>`<tr><td><strong>${esc(matName(data,x.id))}</strong><br><small>${esc(x.id)}</small></td><td>${fmt(x.qty)}</td><td>${(x.share*100).toFixed(1)}%</td><td><span class="dq-pill ${x.abc.toLowerCase()}">${x.abc}</span></td></tr>`).join('')||'<tr><td colspan="4">Veri yok.</td></tr>'}</tbody></table></div>
      <div class="dq-card"><div class="dq-card-head"><div><h3>Stok kapsama & yeniden sipariş</h3><p class="dq-card-sub">Son 3 aylık tüketim hızından yaklaşık kapsama hesabı.</p></div></div><table class="dq-table"><thead><tr><th>Malzeme</th><th>Stok</th><th>Kapsama</th><th>Durum</th></tr></thead><tbody>${risks.slice(0,10).map(x=>`<tr><td><strong>${esc(x.name)}</strong></td><td>${fmt(x.stock)}</td><td>${Number.isFinite(x.coverage)?`${x.coverage.toFixed(1)} ay`:'—'}</td><td><span class="dq-pill ${x.critical?'red':x.coverage<1?'amber':'green'}">${x.critical?'KRİTİK':x.coverage<1?'YAKIN':'NORMAL'}</span></td></tr>`).join('')||'<tr><td colspan="4">Yeterli tüketim geçmişi yok.</td></tr>'}</tbody></table></div></div>
      <div class="dq-card"><div class="dq-card-head"><div><h3>Hareketsiz stok — 60+ gün</h3><p class="dq-card-sub">Mevcut stoğu olup son 60 günde çıkışı görünmeyen malzemeler.</p></div><span class="dq-pill amber">${fmt(dead.length)} MALZEME</span></div>${dead.length?`<table class="dq-table"><thead><tr><th>Malzeme</th><th>Depo</th><th>Mevcut</th><th>Min.</th></tr></thead><tbody>${dead.slice(0,15).map(x=>`<tr><td><strong>${esc(x.name)}</strong><br><small>${esc(x.id)}</small></td><td>${esc(depotName(data,x.depotId))}</td><td>${fmt(x.stock)}</td><td>${fmt(x.minStock)}</td></tr>`).join('')}</tbody></table>`:'<div class="dq-empty">Hareketsiz stok bulunmadı.</div>'}</div>`;
  }

  function operationsTab(data){
    const moves=monthMoves(data,selectedMonth), depots=(data.depots||[]).map(d=>{const out=moves.filter(m=>isOut(m)&&(m.from===d.id||m.depotId===d.id||m.depot===d.id)).reduce((s,m)=>s+m.qty,0);const inn=moves.filter(m=>isIn(m)&&(m.to===d.id||m.depotId===d.id||m.depot===d.id)).reduce((s,m)=>s+m.qty,0);const tr=moves.filter(m=>isTransfer(m)&&(m.from===d.id||m.to===d.id)).length;return {...d,out,inn,tr}});
    const actor=new Map();moves.forEach(m=>{if(!m.actor)return;actor.set(m.actor,(actor.get(m.actor)||0)+1)});
    const flows=new Map();moves.filter(isTransfer).forEach(m=>{const k=`${m.from||'?'}→${m.to||'?'}`;flows.set(k,(flows.get(k)||0)+m.qty)});
    return `<h2 class="dq-section-title">Operasyon kontrolü</h2><p class="dq-section-intro">Büyük WMS'lerdeki operasyon görünürlüğünü sadeleştirerek depo bazlı giriş/çıkış, transfer akışı ve işlem yoğunluğunu tek ekrana topladık.</p>
      <div class="dq-grid2"><div class="dq-card"><div class="dq-card-head"><div><h3>Depo performansı</h3><p class="dq-card-sub">Seçilen dönemdeki gerçek hareketler.</p></div></div><table class="dq-table"><thead><tr><th>Depo</th><th>Giriş</th><th>Çıkış</th><th>Transfer</th></tr></thead><tbody>${depots.map(d=>`<tr><td><strong>${esc(d.name)}</strong><br><small>${esc(d.id)}</small></td><td>${fmt(d.inn)}</td><td>${fmt(d.out)}</td><td>${fmt(d.tr)}</td></tr>`).join('')}</tbody></table></div>
      <div class="dq-card"><div class="dq-card-head"><div><h3>Transfer akışları</h3><p class="dq-card-sub">En yoğun kaynak → hedef yönleri.</p></div></div>${[...flows.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`<div class="dq-row" style="grid-template-columns:minmax(0,1fr) auto"><div class="dq-row-name">${esc(k)}</div><div class="dq-row-value">${fmt(v)} birim</div></div>`).join('')||'<div class="dq-empty">Seçilen dönemde transfer yok.</div>'}</div></div>
      <div class="dq-card"><div class="dq-card-head"><div><h3>İşlem yoğunluğu</h3><p class="dq-card-sub">Hareketlerde actor alanı tutuluyorsa kullanıcı bazında işlem sayısı.</p></div></div>${[...actor.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,v],i)=>`<div class="dq-row" style="grid-template-columns:35px minmax(0,1fr) auto"><div class="dq-rank">${String(i+1).padStart(2,'0')}</div><div class="dq-row-name">${esc(name)}</div><div class="dq-row-value">${fmt(v)} işlem</div></div>`).join('')||'<div class="dq-empty">Kullanıcı/actor bilgisi bulunan hareket yok.</div>'}</div>`;
  }

  function addNav(){const nav=$('.nav-list');if(!nav||nav.querySelector('[data-view="manager"]'))return;const b=document.createElement('button');b.className='nav-item';b.dataset.view='manager';b.innerHTML='<span class="nav-icon">✦</span> Yönetici Analizi';nav.appendChild(b);b.onclick=()=>{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-manager'));document.querySelectorAll('.nav-item[data-view]').forEach(x=>x.classList.toggle('active',x===b));const c=$('#crumbTitle');if(c)c.textContent='Yönetici Analizi';render();$('#sidebar')?.classList.remove('open')}}
  function addView(){if($('#view-manager'))return;const wrap=$('.page-content');if(!wrap)return;const v=document.createElement('section');v.className='view dq-manager-view';v.id='view-manager';v.innerHTML=`<div class="dq-head"><div><div class="dq-eyebrow"><i></i> YÖNETİCİ KONTROL MERKEZİ</div><h1>Yönetici Analizi</h1><p class="dq-sub">Depo performansı, tüketim, stok sağlığı ve operasyon riskleri.</p></div><div class="dq-period"><button class="dq-period-nav" id="dqPrev" type="button">‹</button><button class="dq-period-main" id="dqPeriodMain" type="button">▣ <span>${monthLabel(selectedMonth)}</span>⌄</button><button class="dq-period-nav" id="dqNext" type="button">›</button><div class="dq-period-menu" id="dqPeriodMenu"></div></div></div><div class="dq-banner">📊 Analiz dönemi: <strong id="dqSelectedLabel">${monthLabel(selectedMonth)}</strong> · Geçmiş dönem seçimi yalnızca raporlama filtresidir.</div><div class="dq-tabs"><button class="dq-tab active" data-tab="overview">Genel Bakış</button><button class="dq-tab" data-tab="inventory">Stok Zekâsı</button><button class="dq-tab" data-tab="operations">Operasyon</button></div><div id="dqManagerBody"></div>`;wrap.appendChild(v);$('#dqPeriodMain').onclick=togglePeriod;$('#dqPrev').onclick=()=>setMonth(-1);$('#dqNext').onclick=()=>setMonth(1);document.addEventListener('click',e=>{if(!e.target.closest('#dqPeriodMain')&&!e.target.closest('#dqPeriodMenu')){$('#dqPeriodMenu')?.classList.remove('open')}});v.querySelectorAll('.dq-tab').forEach(t=>t.onclick=()=>{activeTab=t.dataset.tab;v.querySelectorAll('.dq-tab').forEach(x=>x.classList.toggle('active',x===t));render()});}
  function render(){const v=$('#view-manager');if(!v)return;const data=read()||{materials:[],depots:[],movements:[]};$('#dqPeriodMain span').textContent=monthLabel(selectedMonth);$('#dqSelectedLabel').textContent=monthLabel(selectedMonth);$('#dqManagerBody').innerHTML=activeTab==='overview'?overview(data):activeTab==='inventory'?inventoryTab(data):operationsTab(data);}
  function boot(){styles();addView();addNav();render();setTimeout(()=>{addView();addNav();render()},700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

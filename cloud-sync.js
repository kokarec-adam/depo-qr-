(() => {
  'use strict';

  const V = '13.0.0';
  const KEY = 'depoqr_v1';
  const PENDING_KEY = 'depoqr_pending_cloud';
  const PATH = 'state/app';
  const cfg = {
    apiKey: 'AI'+'zaSyBbkDJdqu_W1hr_vBfQbgq7vV81NDt8ZTY',
    authDomain: 'depoqr-1572f.firebaseapp.com',
    projectId: 'depoqr-1572f',
    storageBucket: 'depoqr-1572f.firebasestorage.app',
    messagingSenderId: '941055661444',
    appId: '1:941055661444:web:9ff1256775823f2025f9d1'
  };

  let ready = false;
  let applying = false;
  let timer = null;
  let unsubscribe = null;
  let lastCloud = null;
  let revision = 0;
  let flushSync = null;

  const getLocal = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (_) { return null; }
  };
  const isPending = () => localStorage.getItem(PENDING_KEY) === '1';
  const markPending = () => { try { localStorage.setItem(PENDING_KEY, '1'); } catch (_) {} };
  const clearPending = () => { try { localStorage.removeItem(PENDING_KEY); } catch (_) {} };
  const eq = (a,b) => {
    try { return JSON.stringify(a) === JSON.stringify(b); }
    catch (_) { return false; }
  };
  const normalized = r => ({
    depots: Array.isArray(r?.depots) ? r.depots : [],
    materials: Array.isArray(r?.materials) ? r.materials : [],
    movements: Array.isArray(r?.movements) ? r.movements : [],
    seeded: !!r?.seeded
  });

  function status(text, ok = true) {
    const pill = document.querySelector('.system-pill');
    if (pill) {
      pill.innerHTML = '<span></span> ' + text;
      pill.classList.toggle('cloud-offline', !ok);
    }
    const mode = document.querySelector('.mode-card');
    if (mode) {
      const strong = mode.querySelector('strong');
      const small = mode.querySelector('small');
      if (strong) strong.textContent = ok ? 'Bulut bağlantısı' : 'Bağlantı bekleniyor';
      if (small) small.textContent = ok ? 'Firebase ile senkron' : 'İnternet bağlantısını kontrol et';
    }
  }

  function loginUI(signIn) {
    if (document.getElementById('dqLogin')) return;
    const style = document.createElement('style');
    style.id = 'dqLoginStyle';
    style.textContent = `
      #dqLogin{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:rgba(10,16,24,.97);font-family:DM Sans,system-ui,sans-serif}
      .dqCard{width:min(440px,100%);box-sizing:border-box;background:#111923;border:1px solid #263443;border-radius:18px;padding:30px;box-shadow:0 24px 80px rgba(0,0,0,.45);color:#edf3f8}
      .dqBrand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.dqMark{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#182738;color:#7cb1ff;font-size:23px;border:1px solid #29405a}.dqBrand strong{font-size:24px;letter-spacing:-.02em}.dqBrand strong span{color:#73aaff}.dqBrand small{display:block;color:#7f8d9c;font-size:10px;letter-spacing:.16em;margin-top:2px}
      .dqCard h2{margin:0 0 7px;font-size:26px;letter-spacing:-.02em}.dqCard p{margin:0 0 22px;color:#8f9dac;line-height:1.5}.dqCard label{display:block;font-weight:700;margin:14px 0 7px;color:#d9e1e8}.dqCard input{width:100%;box-sizing:border-box;padding:14px 15px;border:1px solid #344454;background:#0d141c;color:#edf3f8;border-radius:10px;font-size:16px;outline:none}.dqCard input:focus{border-color:#6da7ff;box-shadow:0 0 0 3px rgba(109,167,255,.12)}.dqCard button{width:100%;margin-top:20px;padding:14px 16px;border:0;border-radius:10px;background:#6fa7ff;color:#0e1720;font-weight:800;font-size:16px;cursor:pointer}.dqCard button:disabled{opacity:.55;cursor:wait}.dqErr{color:#ff8d8d;min-height:22px;margin-top:10px;font-size:14px}
    `;
    document.head.appendChild(style);
    const d = document.createElement('div');
    d.id = 'dqLogin';
    d.innerHTML = `
      <div class="dqCard">
        <div class="dqBrand"><div class="dqMark">▦</div><div><strong>Depo<span>QR</span></strong><small>ENVANTER SİSTEMİ</small></div></div>
        <h2>Bulut sistemine giriş</h2>
        <p>Saha ve yönetim ekranına devam etmek için DepoQR hesabınla giriş yap.</p>
        <form>
          <label for="dqEmail">E-posta</label><input id="dqEmail" type="email" autocomplete="username" required>
          <label for="dqPass">Şifre</label><input id="dqPass" type="password" autocomplete="current-password" required>
          <button type="submit">Giriş yap</button><div class="dqErr" id="dqErr"></div>
        </form>
      </div>`;
    document.body.appendChild(d);
    const savedEmail = localStorage.getItem('depoqr_login_email');
    if (savedEmail) d.querySelector('#dqEmail').value = savedEmail;
    d.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const b = d.querySelector('button'), err = d.querySelector('#dqErr');
      const email = d.querySelector('#dqEmail').value.trim(), pass = d.querySelector('#dqPass').value;
      b.disabled = true; err.textContent = '';
      try { localStorage.setItem('depoqr_login_email', email); await signIn(email, pass); }
      catch (x) {
        const code = String(x?.code || '');
        err.textContent = code.includes('invalid-credential') || code.includes('invalid-login-credentials') ? 'E-posta veya şifre hatalı.' : code.includes('too-many-requests') ? 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.' : 'Giriş yapılamadı. İnternet bağlantısını kontrol et.';
        b.disabled = false;
      }
    });
  }

  function injectFieldActions() {
    const modal = document.getElementById('modalBackdrop'), eyebrow = document.getElementById('modalEyebrow'), body = document.getElementById('modalBody');
    if (!modal || !eyebrow || !body || !modal.classList.contains('open')) return;
    if (!String(eyebrow.textContent || '').startsWith('MALZEME KARTI')) return;
    if (body.querySelector('.dq-field-actions')) return;
    if (!document.getElementById('dqFieldStyle')) {
      const s = document.createElement('style'); s.id = 'dqFieldStyle';
      s.textContent = `.dq-field-actions{margin:0 0 18px;padding:14px;border:1px solid #263646;border-radius:14px;background:#0f1720}.dq-field-actions-title{font-size:11px;letter-spacing:.12em;color:#7f93a7;font-weight:800;margin-bottom:10px}.dq-field-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.dq-field-btn{min-height:72px;border:1px solid #304153;background:#16212d;color:#eef4f9;border-radius:11px;padding:9px 7px;font:700 13px/1.2 DM Sans,system-ui,sans-serif;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}.dq-field-btn span{font-size:23px;line-height:1}.dq-field-btn:hover{border-color:#6fa7ff;transform:translateY(-1px)}.dq-field-btn.primary{background:#1b3049;border-color:#42678e}.dq-field-btn.warn{background:#30251b;border-color:#6d5130}.dq-field-btn.move{background:#241f34;border-color:#4e4770}.dq-field-btn.count{background:#19302b;border-color:#3e685e}@media(max-width:700px){.dq-field-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dq-field-btn{min-height:82px;font-size:14px}.dq-field-actions{padding:12px}.modal{width:min(96vw,720px)}}`;
      document.head.appendChild(s);
    }
    const wrap = document.createElement('div');
    wrap.className = 'dq-field-actions';
    wrap.innerHTML = `<div class="dq-field-actions-title">SAHA HIZLI İŞLEMLERİ</div><div class="dq-field-grid"><button type="button" class="dq-field-btn count" data-dq-op="count"><span>✓</span>Sayım</button><button type="button" class="dq-field-btn primary" data-dq-op="in"><span>＋</span>Stok ekle</button><button type="button" class="dq-field-btn warn" data-dq-op="out"><span>−</span>Stok çıkar</button><button type="button" class="dq-field-btn move" data-dq-op="transfer"><span>↔</span>Depo taşı</button></div>`;
    body.prepend(wrap);
    wrap.addEventListener('click', e => {
      const btn = e.target.closest('[data-dq-op]'); if (!btn) return;
      const detailMove = document.getElementById('detailMove'); if (!detailMove) return;
      detailMove.click();
      setTimeout(() => {
        const type = document.getElementById('mvType'); if (!type) return;
        type.value = btn.dataset.dqOp === 'in' ? 'Giriş' : btn.dataset.dqOp === 'out' ? 'Çıkış' : btn.dataset.dqOp === 'transfer' ? 'Transfer' : 'Düzeltme';
        type.dispatchEvent(new Event('change', {bubbles:true}));
        document.getElementById('mvQty')?.focus();
      }, 40);
    });
  }

  async function start() {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    const {initializeApp} = appMod;
    const {getAuth,onAuthStateChanged,signInWithEmailAndPassword,setPersistence,browserLocalPersistence} = authMod;
    const {getFirestore,initializeFirestore,persistentLocalCache,persistentMultipleTabManager,doc,getDoc,setDoc,onSnapshot,runTransaction} = fsMod;
    const app = initializeApp(cfg), auth = getAuth(app);
    try { await setPersistence(auth, browserLocalPersistence); } catch (_) {}
    let db;
    try { db = initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})}); }
    catch (_) { db = getFirestore(app); }
    const ref = doc(db, PATH), signIn = (email,password) => signInWithEmailAndPassword(auth,email,password);

    onAuthStateChanged(auth, async user => {
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      if (!user) {
        ready = false; lastCloud = null; revision = 0; status('Giriş gerekli',false); loginUI(signIn); return;
      }
      try {
        const snap = await getDoc(ref), local = getLocal(), pending = isPending();
        if (!snap.exists()) {
          if (local && Array.isArray(local.materials) && Array.isArray(local.depots) && Array.isArray(local.movements)) {
            revision = 1; lastCloud = normalized(local);
            await setDoc(ref,{...local,revision,updatedAt:new Date().toISOString(),updatedBy:user.uid});
            clearPending();
          }
        } else {
          const remote = snap.data(), n = normalized(remote);
          revision = Number(remote.revision) || 1; lastCloud = n;
          if (!pending && Array.isArray(remote.materials) && Array.isArray(remote.depots) && Array.isArray(remote.movements) && !eq(local,n)) {
            applying = true; localStorage.setItem(KEY,JSON.stringify(n)); applying = false; location.reload(); return;
          }
        }
        ready = true;
        document.getElementById('dqLogin')?.remove();
        status('Bulut bağlı',true);
        unsubscribe = onSnapshot(ref,s => {
          if (!ready || !s.exists()) return;
          if (isPending()) return;
          const remote = s.data(), n = normalized(remote);
          revision = Number(remote.revision) || revision || 1; lastCloud = n;
          if (!eq(getLocal(),n)) {
            applying = true; localStorage.setItem(KEY,JSON.stringify(n)); applying = false; location.reload();
          }
        }, e => { console.error(e); status('Bulut bağlantısı koptu',false); });
        if (isPending()) setTimeout(() => flushSync?.(),80);
      } catch (e) {
        console.error(e); status('Bulut hatası',false);
        const message = e?.code === 'permission-denied' ? 'Firebase güvenlik kuralları erişimi reddediyor.' : e?.code === 'failed-precondition' ? 'Firebase yapılandırması tamamlanmadı.' : 'Firebase bağlantısı kurulamadı.';
        alert(message);
      }
    });

    flushSync = async () => {
      if (!ready || !auth.currentUser) return;
      try {
        const state = getLocal(); if (!state) return;
        const current = await getDoc(ref);
        const remote = current.exists() ? normalized(current.data()) : null;
        const remoteRevision = Number(current.data()?.revision) || 0;
        if (remote && lastCloud && remoteRevision !== revision && !eq(remote,lastCloud)) {
          status('Yeni veri algılandı',false);
          applying = true; localStorage.setItem(KEY,JSON.stringify(remote)); applying = false;
          lastCloud = remote; revision = remoteRevision; clearPending(); location.reload(); return;
        }
        const nextRevision = Math.max(revision,remoteRevision) + 1;
        await runTransaction(db,async tx => {
          const latest = await tx.get(ref), latestRevision = Number(latest.data()?.revision) || 0;
          if (latestRevision !== remoteRevision) throw new Error('DEPQR_CONCURRENT_UPDATE');
          tx.set(ref,{...state,revision:nextRevision,updatedAt:new Date().toISOString(),updatedBy:auth.currentUser.uid});
        });
        revision = nextRevision; lastCloud = normalized(state); clearPending(); status('Bulut bağlı',true);
      } catch (e) {
        console.error(e);
        if (e?.message === 'DEPQR_CONCURRENT_UPDATE') {
          try {
            const latest = await getDoc(ref), n = normalized(latest.data());
            revision = Number(latest.data()?.revision) || revision; lastCloud = n;
            applying = true; localStorage.setItem(KEY,JSON.stringify(n)); applying = false; clearPending(); location.reload(); return;
          } catch (_) {}
        }
        status('Buluta yazılamadı',false);
      }
    };

    const oldSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(k,v) {
      if (this === localStorage && k === KEY && !applying) markPending();
      const out = oldSet.call(this,k,v);
      if (this === localStorage && k === KEY && ready && !applying) {
        clearTimeout(timer); timer = setTimeout(() => flushSync?.(),250);
      }
      return out;
    };
  }

  window.addEventListener('online',() => { clearTimeout(timer); timer = setTimeout(() => flushSync?.(),300); });
  const observer = new MutationObserver(() => injectFieldActions());
  window.addEventListener('DOMContentLoaded',() => {
    const modal = document.getElementById('modalBackdrop');
    if (modal) observer.observe(modal,{attributes:true,childList:true,subtree:true});
    setTimeout(injectFieldActions,500);
  });
  window.addEventListener('load',() => start().catch(e => { console.error(e); status('Firebase yüklenemedi',false); alert('Firebase bağlantısı başlatılamadı. İnternet bağlantısını kontrol et.'); }));
})();

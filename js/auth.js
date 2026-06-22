/* =============================================
   auth.js  –  LocalStorage-based auth system
   ============================================= */

const Auth = {
  // ---- helpers ----
  getUsers() {
    return JSON.parse(localStorage.getItem('ts_users') || '[]');
  },
  saveUsers(users) {
    localStorage.setItem('ts_users', JSON.stringify(users));
  },
  getCurrentUser() {
    const id = localStorage.getItem('ts_current_user');
    if (!id) return null;
    return this.getUsers().find(u => u.id === id) || null;
  },
  setCurrentUser(user) {
    localStorage.setItem('ts_current_user', user ? user.id : '');
  },

  // ---- register ----
  register(name, email, password) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, msg: 'Bu e-poçt artıq qeydiyyatdadır.' };
    }
    const user = {
      id: 'u_' + Date.now(),
      name,
      email,
      password,
      avatar: '',
      balance: 0,          // Tatu Balans
      orders: []
    };
    users.push(user);
    this.saveUsers(users);
    this.setCurrentUser(user);
    return { ok: true, user };
  },

  // ---- login ----
  login(email, password) {
    const user = this.getUsers().find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, msg: 'E-poçt və ya şifrə yanlışdır.' };
    this.setCurrentUser(user);
    return { ok: true, user };
  },

  // ---- logout ----
  logout() {
    localStorage.removeItem('ts_current_user');
    window.location.href = 'index.html';
  },

  // ---- top up balance ----
  topUp(amount) {
    const users = this.getUsers();
    const cur   = this.getCurrentUser();
    if (!cur) return { ok: false, msg: 'Giriş edilməyib.' };
    const idx = users.findIndex(u => u.id === cur.id);
    if (!users[idx].balance) users[idx].balance = 0;
    users[idx].balance = +(users[idx].balance + amount).toFixed(2);
    this.saveUsers(users);
    this.setCurrentUser(users[idx]);
    return { ok: true, balance: users[idx].balance };
  },

  // ---- pay from balance ----
  payFromBalance(amount) {
    const users = this.getUsers();
    const cur   = this.getCurrentUser();
    if (!cur) return { ok: false, msg: 'Giriş edilməyib.' };
    const idx = users.findIndex(u => u.id === cur.id);
    const bal = users[idx].balance || 0;
    if (bal < amount) return { ok: false, msg: 'Balans kifayət deyil.' };
    users[idx].balance = +(bal - amount).toFixed(2);
    this.saveUsers(users);
    this.setCurrentUser(users[idx]);
    return { ok: true, balance: users[idx].balance };
  },

  // ---- save order ----
  saveOrder(order) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === order.userId);
    if (idx === -1) return;
    order.id     = 'ord_' + Date.now();
    order.date   = new Date().toLocaleDateString('az-AZ');
    order.status = 'Gözləyir';
    users[idx].orders.push(order);
    this.saveUsers(users);
    this.setCurrentUser(users[idx]);
  },

  // ---- update profile ----
  updateProfile(fields) {
    const users = this.getUsers();
    const cur = this.getCurrentUser();
    if (!cur) return;
    const idx = users.findIndex(u => u.id === cur.id);
    Object.assign(users[idx], fields);
    this.saveUsers(users);
    this.setCurrentUser(users[idx]);
  }
};

/* =============================================
   Navbar dynamic render
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getCurrentUser();

  // -- inject styles once --
  if (!document.getElementById('nav-avatar-style')) {
    const s = document.createElement('style');
    s.id = 'nav-avatar-style';
    s.textContent = `
      /* push nav items to the right */
      .navbar-nav.ml-auto-right { margin-left: auto !important; }

      .nav-right-group {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 6px;
      }

      /* ---- Tatu Balans chip ---- */
      .nav-balance-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(79,153,229,.12);
        border: 1.5px solid rgba(79,153,229,.35);
        border-radius: 20px;
        padding: 5px 12px 5px 8px;
        cursor: pointer;
        text-decoration: none;
        transition: background .2s, border-color .2s;
        white-space: nowrap;
      }
      .nav-balance-chip:hover {
        background: rgba(79,153,229,.22);
        border-color: #4f99e5;
        text-decoration: none;
      }
      .nav-balance-chip .chip-icon {
        width: 22px; height: 22px;
        background: #4f99e5;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; color: #fff; flex-shrink: 0;
      }
      .nav-balance-chip .chip-label {
        font-size: 10px; color: #8aaac8; line-height: 1;
        text-transform: uppercase; letter-spacing: .5px;
      }
      .nav-balance-chip .chip-amount {
        font-size: 13px; font-weight: 700; color: #4f99e5; line-height: 1;
      }

      /* ---- Avatar circle ---- */
      .nav-avatar-circle {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f99e5, #2176d4);
        color: #fff;
        font-size: 13px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        letter-spacing: .5px;
        border: 2px solid rgba(255,255,255,.2);
        flex-shrink: 0;
        text-decoration: none;
        transition: transform .2s, box-shadow .2s;
      }
      .nav-avatar-circle:hover {
        transform: scale(1.1);
        box-shadow: 0 0 0 3px rgba(79,153,229,.4);
        color: #fff; text-decoration: none;
      }

      /* ---- Logout btn ---- */
      .nav-logout-btn {
        width: 34px; height: 34px;
        border-radius: 50%;
        background: rgba(232,69,69,.12);
        border: 1.5px solid rgba(232,69,69,.35);
        color: #e84545;
        font-size: 15px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        text-decoration: none;
        flex-shrink: 0;
        transition: background .2s, transform .2s;
      }
      .nav-logout-btn:hover {
        background: #e84545; color: #fff;
        transform: scale(1.1); text-decoration: none;
      }

      /* ---- Top-up modal ---- */
      #topupOverlay {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,.6); z-index: 99999;
        align-items: center; justify-content: center;
      }
      #topupOverlay.open { display: flex; }
      .topup-card {
        background: #fff; border-radius: 20px;
        padding: 36px 32px; width: 100%; max-width: 400px;
        box-shadow: 0 20px 60px rgba(0,0,0,.35);
        animation: fadeUp .35s ease;
      }
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(24px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .topup-card h3 {
        font-size: 18px; font-weight: 700; color: #1e242c;
        margin-bottom: 6px;
      }
      .topup-card .cur-bal {
        font-size: 13px; color: #888; margin-bottom: 22px;
      }
      .topup-card .cur-bal strong { color: #4f99e5; }
      .topup-presets {
        display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
      }
      .topup-preset {
        flex: 1; min-width: 60px;
        padding: 8px 4px; border: 1.5px solid #e0e8f0;
        border-radius: 10px; background: #f4f8fd;
        font-size: 14px; font-weight: 600; color: #4f99e5;
        cursor: pointer; text-align: center;
        transition: all .2s;
      }
      .topup-preset:hover, .topup-preset.selected {
        border-color: #4f99e5; background: #4f99e5; color: #fff;
      }
      .topup-input-row {
        display: flex; gap: 10px; align-items: center; margin-bottom: 18px;
      }
      .topup-input-row input {
        flex: 1; padding: 11px 14px; border: 1.5px solid #e0e8f0;
        border-radius: 10px; font-size: 14px; outline: none;
        transition: border .2s;
      }
      .topup-input-row input:focus { border-color: #4f99e5; }
      .topup-card-fields { margin-bottom: 18px; }
      .topup-card-fields input {
        width: 100%; padding: 11px 14px; border: 1.5px solid #e0e8f0;
        border-radius: 10px; font-size: 14px; margin-bottom: 10px;
        outline: none; transition: border .2s;
      }
      .topup-card-fields input:focus { border-color: #4f99e5; }
      .topup-row2 { display: flex; gap: 10px; }
      .topup-row2 input { flex: 1; }
      .btn-topup-confirm {
        width: 100%; padding: 12px; background: #4f99e5; border: none;
        border-radius: 10px; color: #fff; font-size: 15px; font-weight: 600;
        cursor: pointer; transition: background .2s;
      }
      .btn-topup-confirm:hover { background: #2176d4; }
      .btn-topup-cancel {
        width: 100%; padding: 10px; background: transparent; border: none;
        color: #aaa; font-size: 13px; margin-top: 8px; cursor: pointer;
      }
      .topup-alert {
        padding: 9px 13px; border-radius: 8px; font-size: 13px;
        margin-bottom: 14px; display: none;
      }
      .topup-alert.err { background:#fef0f0; color:#c53030; border:1px solid #f5c6c6; }
      .topup-alert.ok  { background:#f0fef5; color:#1a7a46; border:1px solid #b3e8cc; }
    `;
    document.head.appendChild(s);
  }

  // -- inject top-up modal once --
  if (!document.getElementById('topupOverlay')) {
    const modal = document.createElement('div');
    modal.id = 'topupOverlay';
    modal.innerHTML = `
      <div class="topup-card">
        <h3>💳 Tatu Balans Yüklə</h3>
        <p class="cur-bal" id="topupCurBal">Cari balans: <strong>₼0.00</strong></p>
        <div id="topupAlert" class="topup-alert"></div>

        <div class="topup-presets">
          <div class="topup-preset" onclick="setTopupAmount(10,this)">₼10</div>
          <div class="topup-preset" onclick="setTopupAmount(25,this)">₼25</div>
          <div class="topup-preset" onclick="setTopupAmount(50,this)">₼50</div>
          <div class="topup-preset" onclick="setTopupAmount(100,this)">₼100</div>
        </div>

        <div class="topup-input-row">
          <input id="topupAmount" type="number" min="1" max="5000" placeholder="Məbləğ (₼)" oninput="clearPresets()">
        </div>

        <div class="topup-card-fields">
          <input id="topupCardName"   type="text"   placeholder="Kart üzərindəki ad">
          <input id="topupCardNumber" type="text"   placeholder="0000 0000 0000 0000" maxlength="19">
          <div class="topup-row2">
            <input id="topupExpiry" type="text" placeholder="AA/İİ" maxlength="5">
            <input id="topupCvv"    type="password" placeholder="CVV" maxlength="3">
          </div>
        </div>

        <button class="btn-topup-confirm" onclick="confirmTopup()">Balansı Yüklə</button>
        <button class="btn-topup-cancel"  onclick="closeTopup()">Ləğv et</button>
      </div>`;
    document.body.appendChild(modal);

    // close on backdrop click
    modal.addEventListener('click', e => { if (e.target === modal) closeTopup(); });

    // card number formatting
    document.getElementById('topupCardNumber').addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '').substring(0, 16);
      this.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
    document.getElementById('topupExpiry').addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '');
      if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
      this.value = v;
    });
  }

  // -- render right side --
  document.querySelectorAll('.auth-nav-items').forEach(el => {
    if (user) {
      const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const bal = (user.balance || 0).toFixed(2);

      el.innerHTML = `
        <li class="nav-item" style="list-style:none;">
          <div class="nav-right-group">
            <!-- Tatu Balans chip -->
            <a class="nav-balance-chip" href="#" onclick="openTopup();return false;" title="Balans yüklə">
              <span class="chip-icon"><i class="fa fa-credit-card"></i></span>
              <span>
                <span class="chip-label">Tatu Balans</span><br>
                <span class="chip-amount" id="navBalanceAmt">₼${bal}</span>
              </span>
            </a>
            <!-- Avatar -->
            <a class="nav-avatar-circle" href="profile.html" title="${user.name}">${initials}</a>
            <!-- Logout -->
            <a class="nav-logout-btn" href="#" onclick="Auth.logout();return false;" title="Çıxış">
              <i class="fa fa-sign-out"></i>
            </a>
          </div>
        </li>`;
    } else {
      el.innerHTML = `
        <li class="nav-item"><a class="nav-link" href="login.html">GİRİŞ</a></li>
        <li class="nav-item"><a class="nav-link" href="register.html">QEYDİYYAT</a></li>`;
    }
  });
});

/* =============================================
   Top-up modal helpers  (global scope)
   ============================================= */
function openTopup() {
  const u = Auth.getCurrentUser();
  if (!u) { window.location.href = 'login.html'; return; }
  const bal = (u.balance || 0).toFixed(2);
  document.getElementById('topupCurBal').innerHTML = `Cari balans: <strong>₼${bal}</strong>`;
  document.getElementById('topupAmount').value = '';
  document.getElementById('topupCardName').value = '';
  document.getElementById('topupCardNumber').value = '';
  document.getElementById('topupExpiry').value = '';
  document.getElementById('topupCvv').value = '';
  document.getElementById('topupAlert').style.display = 'none';
  document.querySelectorAll('.topup-preset').forEach(p => p.classList.remove('selected'));
  document.getElementById('topupOverlay').classList.add('open');
}

function closeTopup() {
  document.getElementById('topupOverlay').classList.remove('open');
}

function setTopupAmount(val, el) {
  document.getElementById('topupAmount').value = val;
  document.querySelectorAll('.topup-preset').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

function clearPresets() {
  document.querySelectorAll('.topup-preset').forEach(p => p.classList.remove('selected'));
}

function confirmTopup() {
  const alertEl = document.getElementById('topupAlert');
  const showErr = msg => { alertEl.textContent = msg; alertEl.className = 'topup-alert err'; alertEl.style.display = 'block'; };

  const amount     = parseFloat(document.getElementById('topupAmount').value);
  const cardName   = document.getElementById('topupCardName').value.trim();
  const cardNumber = document.getElementById('topupCardNumber').value.replace(/\s/g, '');
  const expiry     = document.getElementById('topupExpiry').value;
  const cvv        = document.getElementById('topupCvv').value;

  if (!amount || amount < 1)          return showErr('Minimum yükləmə məbləği ₼1-dir.');
  if (amount > 5000)                   return showErr('Maksimum yükləmə məbləği ₼5000-dir.');
  if (!cardName)                       return showErr('Kart üzərindəki adı daxil edin.');
  if (cardNumber.length !== 16)        return showErr('Kart nömrəsi 16 rəqəm olmalıdır.');
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return showErr('Düzgün son istifadə tarixi daxil edin (AA/İİ).');
  if (cvv.length !== 3)                return showErr('CVV 3 rəqəm olmalıdır.');

  const result = Auth.topUp(amount);
  if (!result.ok) return showErr(result.msg);

  // update navbar balance display live
  const navAmt = document.getElementById('navBalanceAmt');
  if (navAmt) navAmt.textContent = '₼' + result.balance.toFixed(2);

  alertEl.textContent = `₼${amount.toFixed(2)} uğurla yükləndi! Yeni balans: ₼${result.balance.toFixed(2)}`;
  alertEl.className = 'topup-alert ok';
  alertEl.style.display = 'block';

  // also update profile page balance if visible
  const profBal = document.getElementById('profileBalanceAmt');
  if (profBal) profBal.textContent = '₼' + result.balance.toFixed(2);

  setTimeout(() => closeTopup(), 1800);
}

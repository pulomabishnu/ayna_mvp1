(() => {
  const statusBox = document.getElementById('pro-status');
  const plansBox = document.getElementById('pro-plans');
  const monthButton = document.getElementById('pro-month');
  const yearButton = document.getElementById('pro-year');
  const adminBox = document.getElementById('pro-admin');
  const adminForm = document.getElementById('pro-focus-form');
  const params = new URLSearchParams(window.location.search);
  const checkoutResult = params.get('checkout');
  let token = null;
  let busy = false;
  let latestStatus = null;

  function accessTokenFromBrowser() {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        for (let i = 0; i < storage.length; i += 1) {
          const key = storage.key(i);
          if (!key || !/auth-token/i.test(key)) continue;
          const raw = storage.getItem(key);
          if (!raw) continue;
          let parsed;
          try { parsed = JSON.parse(raw); } catch { continue; }
          const candidate = parsed?.access_token || parsed?.session?.access_token || parsed?.currentSession?.access_token;
          if (typeof candidate === 'string' && candidate.split('.').length === 3) return candidate;
        }
      } catch { /* storage may be unavailable */ }
    }
    return null;
  }

  function money(cents) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100);
  }

  function humanDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
  }

  function setStatus(message, error = false) {
    statusBox.classList.toggle('error', error);
    statusBox.replaceChildren();
    const p = document.createElement('p');
    p.textContent = message;
    statusBox.appendChild(p);
  }

  function setBusy(value) {
    busy = value;
    monthButton.disabled = value;
    yearButton.disabled = value;
    adminForm?.querySelectorAll('button').forEach(button => { button.disabled = value; });
  }

  function errorMessage(code) {
    const messages = {
      sign_in_required: 'Sign in to ayna first, then come back to this page.',
      early_access_closed: 'The Early Access offer is currently closed.',
      already_pro: 'This account already has ayna Pro.',
      invalid_plan: 'That plan is unavailable.',
      try_again_later: 'Too many checkout attempts. Please try again shortly.',
      forbidden: 'This action is not available for this account.',
      pro_temporarily_unavailable: 'ayna Pro is temporarily unavailable. Please try again.',
    };
    return messages[code] || 'Something went wrong. Please try again.';
  }

  async function requestPro(body) {
    if (!token) throw new Error('sign_in_required');
    const response = await fetch('/api/pro', {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
    });
    let data = {};
    try { data = await response.json(); } catch { /* empty response */ }
    if (!response.ok) throw new Error(data.error || `http_${response.status}`);
    return data;
  }

  function showSignedOut() {
    plansBox.hidden = true;
    adminBox.hidden = true;
    statusBox.classList.remove('error');
    statusBox.replaceChildren();
    const p = document.createElement('p');
    p.textContent = 'Sign in to ayna to choose your Early Access plan. We’ll bring you right back here after sign-in.';
    const a = document.createElement('a');
    a.href = '/you';
    a.textContent = 'Sign in to ayna';
    a.style.fontWeight = '800';
    a.style.color = '#873d59';
    a.addEventListener('click', () => {
      try { window.sessionStorage.setItem('ayna_pending_auth_action', 'pro'); } catch { /* private mode */ }
    });
    statusBox.append(p, a);
  }

  function renderStatus(data) {
    latestStatus = data;
    adminBox.hidden = !data.isAdmin;
    statusBox.classList.remove('error');
    statusBox.replaceChildren();

    const p = document.createElement('p');
    if (data.active) {
      if (data.hasPurchase) {
        p.textContent = `Your ayna Pro access is active. Your ${data.plan || 'paid'} membership period starts ${humanDate(data.termStartsAt) || 'at launch'}${data.termEndsAt ? ` and runs through ${humanDate(data.termEndsAt)}` : ''}.`;
      } else if (data.temporaryUntil) {
        p.textContent = `Temporary Pro access is active until ${new Date(data.temporaryUntil).toLocaleString()}.`;
      } else {
        p.textContent = 'Your ayna Pro access is active.';
      }
    } else if (checkoutResult === 'success') {
      p.textContent = 'Payment was submitted. We are waiting for Stripe confirmation before unlocking Pro.';
    } else if (checkoutResult === 'canceled') {
      p.textContent = 'Checkout was canceled. Nothing was charged by this checkout.';
    } else {
      p.textContent = data.offerOpen ? 'Choose your Early Access plan below.' : 'The Early Access offer is currently closed.';
    }
    statusBox.appendChild(p);

    if (data.autoRenew) {
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = 'Cancel automatic renewal';
      cancel.style.marginTop = '8px';
      cancel.addEventListener('click', async () => {
        if (busy) return;
        setBusy(true);
        setStatus('Turning off automatic renewal…');
        try {
          await requestPro({ action: 'cancel_renewal' });
          await loadStatus();
        } catch (error) {
          setStatus(errorMessage(error.message), true);
        } finally {
          setBusy(false);
        }
      });
      statusBox.appendChild(cancel);
    } else if (data.hasPurchase) {
      const note = document.createElement('p');
      note.textContent = 'Automatic renewal is off. Your paid access stays active through the end of the period you already purchased.';
      statusBox.appendChild(note);
    }

    plansBox.hidden = !(data.offerOpen && !data.hasPurchase);
    const plans = new Map((data.plans || []).map(plan => [plan.id, plan]));
    const month = plans.get('month');
    const year = plans.get('year');
    if (month) monthButton.textContent = `Choose monthly · ${money(month.amount)} now`;
    if (year) yearButton.textContent = `Choose yearly · ${money(year.amount)} now`;
  }

  async function loadStatus() {
    try {
      const data = await requestPro();
      renderStatus(data);
      return data;
    } catch (error) {
      if (error.message === 'sign_in_required') showSignedOut();
      else setStatus(errorMessage(error.message), true);
      return null;
    }
  }

  async function checkout(plan) {
    if (busy) return;
    setBusy(true);
    setStatus('Opening secure Stripe checkout…');
    const storageKey = `ayna_pro_checkout_request_${plan}`;
    let requestId = window.sessionStorage.getItem(storageKey);
    if (!requestId) {
      requestId = crypto.randomUUID();
      window.sessionStorage.setItem(storageKey, requestId);
    }
    try {
      const data = await requestPro({ plan, requestId });
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('pro_temporarily_unavailable');
      window.location.assign(url.href);
    } catch (error) {
      setStatus(errorMessage(error.message), true);
      setBusy(false);
    }
  }

  monthButton.addEventListener('click', () => checkout('month'));
  yearButton.addEventListener('click', () => checkout('year'));

  adminForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const action = event.submitter?.value || 'focus_grant';
    const userId = document.getElementById('pro-focus-user').value.trim();
    const minutes = Number(document.getElementById('pro-focus-minutes').value || 60);
    setBusy(true);
    setStatus(action === 'focus_revoke' ? 'Ending temporary Pro access…' : 'Granting temporary Pro access…');
    try {
      const result = await requestPro({ action, userId, minutes });
      setStatus(`Focus-group access updated. Expiration: ${new Date(result.expiresAt).toLocaleString()}.`);
    } catch (error) {
      setStatus(errorMessage(error.message), true);
    } finally {
      setBusy(false);
    }
  });

  async function init() {
    token = accessTokenFromBrowser();
    if (!token) {
      showSignedOut();
      return;
    }
    const data = await loadStatus();
    if (checkoutResult === 'success' && data && !data.active) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const refreshed = await loadStatus();
        if (refreshed?.active) break;
      }
    }
  }

  init();
})();

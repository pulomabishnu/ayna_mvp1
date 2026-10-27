(() => {
  const statusBox = document.getElementById('pro-status');
  const plansBox = document.getElementById('pro-plans');
  const monthButton = document.getElementById('pro-month');
  const yearButton = document.getElementById('pro-year');
  const continueButton = document.getElementById('pro-continue');
  const dock = document.getElementById('pro-dock');
  const dockButton = document.getElementById('pro-dock-cta');
  const renewLine = document.getElementById('pro-renew');
  const whenToday = document.getElementById('pro-when-today');
  const whenStart = document.getElementById('pro-when-start');
  const backLink = document.getElementById('pro-back');
  const backLabel = document.getElementById('pro-back-label');
  const adminBox = document.getElementById('pro-admin');
  const adminForm = document.getElementById('pro-focus-form');
  const params = new URLSearchParams(window.location.search);
  const checkoutResult = params.get('checkout');
  const RETURN_KEY = 'ayna_pro_return_v1';
  let token = null;
  let busy = false;
  let selectedPlan = 'year';
  let canBuy = true;
  const planPrice = { month: '$4.99', year: '$45' };
  const planPer = { month: 'month', year: 'year' };

  // Where she was when she chose Get ayna Pro (saved by the app before checkout). Same-site paths only.
  const RETURN_LABELS = {
    reads: 'Back to your Read', ask: 'Back to Ask ayna', playlists: 'Back to Community', quiz: 'Back to your ecosystem',
    wearables: 'Back to your health data', appointment: 'Back to appointment prep', recap: 'Back to Ask ayna', trial: 'Back to Ask ayna',
  };
  function readReturn() {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(RETURN_KEY) || 'null');
      if (!saved || typeof saved.path !== 'string' || !saved.path.startsWith('/') || saved.path.startsWith('//') || saved.path.startsWith('/pro')) return null;
      if (Date.now() - Number(saved.at || 0) > 864e5) return null;
      return { path: saved.path, label: RETURN_LABELS[saved.feature] || 'Back to ayna' };
    } catch { return null; }
  }
  function clearReturn() { try { window.sessionStorage.removeItem(RETURN_KEY); } catch { /* storage may be unavailable */ } }
  const back = readReturn();
  if (back) { backLink.href = back.path; backLabel.textContent = back.label; }

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

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function setStatus(message, error = false) {
    statusBox.classList.toggle('error', error);
    statusBox.classList.remove('done');
    statusBox.replaceChildren(el('p', message));
  }

  function ctaText() { return canBuy ? `Get ayna Pro · ${planPrice[selectedPlan]}` : 'Sign in to get ayna Pro'; }

  function setBusy(value) {
    busy = value;
    monthButton.disabled = value;
    yearButton.disabled = value;
    continueButton.disabled = value;
    dockButton.disabled = value;
    continueButton.setAttribute('aria-busy', value ? 'true' : 'false');
    if (!value) { continueButton.textContent = ctaText(); dockButton.textContent = ctaText(); }
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

  // Signed out: still show what Pro is and what it costs; the button leads to sign in.
  function showSignedOut() {
    canBuy = false;
    adminBox.hidden = true;
    plansBox.hidden = false;
    statusBox.classList.remove('error', 'done');
    const a = el('a', 'Sign in to ayna', 'pro-signin');
    a.href = '/you';
    statusBox.replaceChildren(el('p', 'Sign in to ayna first, then come back here to choose your Early Access plan.'), a);
    setBusy(false);
    syncDock();
  }

  // Bought and confirmed: say so, then take her back to where she was.
  function showDone() {
    statusBox.classList.remove('error');
    statusBox.classList.add('done');
    const children = [el('h2', 'You’re in.'), el('p', 'ayna Pro is unlocked on this account. Everything Pro is ready now.')];
    if (back) {
      const go = el('a', back.label, 'pro-return');
      go.href = back.path;
      go.addEventListener('click', clearReturn);
      children.push(go, el('p', 'Taking you back in a moment…'));
      window.setTimeout(() => { clearReturn(); window.location.assign(back.path); }, 3200);
    } else {
      const go = el('a', 'Open ayna', 'pro-return');
      go.href = '/you';
      children.push(go);
    }
    statusBox.replaceChildren(...children);
    plansBox.hidden = true;
    syncDock();
  }

  function renderStatus(data) {
    canBuy = true;
    adminBox.hidden = !data.isAdmin;
    statusBox.classList.remove('error', 'done');
    statusBox.replaceChildren();

    if (data.active && checkoutResult === 'success') { showDone(); return; }

    const p = el('p');
    if (data.active) {
      if (data.hasPurchase) {
        p.textContent = `Your ayna Pro access is active. Your ${data.plan === 'year' ? 'yearly' : data.plan === 'month' ? 'monthly' : 'paid'} membership period starts ${humanDate(data.termStartsAt) || 'at launch'}${data.termEndsAt ? ` and runs through ${humanDate(data.termEndsAt)}` : ''}.`;
      } else if (data.temporaryUntil) {
        p.textContent = `Temporary Pro access is active until ${new Date(data.temporaryUntil).toLocaleString()}.`;
      } else {
        p.textContent = 'Your ayna Pro access is active.';
      }
    } else if (checkoutResult === 'success') {
      p.textContent = 'Confirming your payment with Stripe before unlocking Pro…';
    } else if (checkoutResult === 'canceled') {
      p.textContent = 'Checkout was canceled. Nothing was charged. Your plan is still here when you are ready.';
    } else if (!data.offerOpen) {
      p.textContent = 'The Early Access offer is currently closed.';
    }
    if (p.textContent) statusBox.appendChild(p);

    if (data.autoRenew) {
      const cancel = el('button', 'Cancel automatic renewal', 'pro-cancel');
      cancel.type = 'button';
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
      statusBox.appendChild(el('p', 'Automatic renewal is off. Your paid access stays active through the end of the period you already purchased.'));
    }
    if (data.active && back) {
      const go = el('a', back.label, 'pro-return');
      go.href = back.path;
      statusBox.appendChild(go);
    }

    plansBox.hidden = !(data.offerOpen && !data.hasPurchase && !data.active);
    const plans = new Map((data.plans || []).map(plan => [plan.id, plan]));
    const month = plans.get('month');
    const year = plans.get('year');
    if (month) planPrice.month = money(month.amount).replace(/\.00$/, '');
    if (year) planPrice.year = money(year.amount).replace(/\.00$/, '');
    for (const [id, price] of Object.entries(planPrice)) {
      const node = plansBox.querySelector(`[data-price="${id}"]`);
      if (node) node.textContent = price;
    }
    selectPlan(selectedPlan);
    syncDock();
  }

  async function loadStatus() {
    try {
      const data = await requestPro();
      renderStatus(data);
      return data;
    } catch (error) {
      if (error.message === 'sign_in_required' || error.message === 'http_401') showSignedOut();
      else setStatus(errorMessage(error.message), true);
      return null;
    }
  }

  async function checkout(plan) {
    if (busy) return;
    if (!canBuy) { window.location.assign('/you'); return; }
    setBusy(true);
    setStatus('Opening secure Stripe checkout…');
    continueButton.textContent = 'Opening secure checkout…';
    dockButton.textContent = 'Opening secure checkout…';
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
      if (error.message === 'already_pro') { await loadStatus(); setBusy(false); return; }
      setStatus(errorMessage(error.message), true);
      setBusy(false);
    }
  }

  // Tap a card to choose it; one button opens checkout for the chosen plan.
  function selectPlan(plan) {
    selectedPlan = plan;
    for (const button of [monthButton, yearButton]) {
      const on = button.dataset.plan === plan;
      button.classList.toggle('is-on', on);
      button.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    if (!busy) { continueButton.textContent = ctaText(); dockButton.textContent = ctaText(); }
    if (renewLine) renewLine.textContent = renewLine.dataset[plan] || '';
    if (whenToday) whenToday.textContent = `Pay ${planPrice[plan]}. Pro unlocks right away.`;
    if (whenStart) whenStart.textContent = `Your paid ${planPer[plan]} starts. The beta before it is included.`;
  }

  // Phones: the Get ayna Pro bar shows while the plan card is scrolled away.
  let plansVisible = true;
  function syncDock() {
    const narrow = window.matchMedia('(max-width: 900px)').matches;
    dock.hidden = !(narrow && !plansBox.hidden && !plansVisible);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      plansVisible = entries.some((entry) => entry.isIntersecting);
      syncDock();
    }, { threshold: 0.15 }).observe(plansBox);
  }
  window.addEventListener('resize', syncDock);

  monthButton.addEventListener('click', () => selectPlan('month'));
  yearButton.addEventListener('click', () => selectPlan('year'));
  continueButton.addEventListener('click', () => checkout(selectedPlan));
  dockButton.addEventListener('click', () => checkout(selectedPlan));

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
    // Back from Stripe: the webhook can land a few seconds after her. Keep checking, then say so plainly.
    if (checkoutResult === 'success' && data && !data.active) {
      for (let attempt = 0; attempt < 15; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const refreshed = await loadStatus();
        if (refreshed?.active) return;
      }
      setStatus('Stripe has not confirmed your payment yet. It can take a minute. Refresh this page shortly and Pro will show here once it is confirmed.');
    }
  }

  init();
})();

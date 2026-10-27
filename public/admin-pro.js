(() => {
  const authCard = document.getElementById('auth-card');
  const authStatus = document.getElementById('auth-status');
  const authDetail = document.getElementById('auth-detail');
  const controls = document.getElementById('controls');
  const gateHeading = document.getElementById('gate-heading');
  const gateToggle = document.getElementById('gate-toggle');
  const gateNote = document.getElementById('gate-note');
  const freeAsk = document.getElementById('free-ask');
  const proAsk = document.getElementById('pro-ask');
  const freePlaylists = document.getElementById('free-playlists');
  const refreshButton = document.getElementById('refresh');
  const message = document.getElementById('message');

  let token = null;
  let currentRules = null;
  let busy = false;

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

  async function loadRules() {
    const response = await fetch('/api/pro?action=features', { cache: 'no-store' });
    let data = {};
    try { data = await response.json(); } catch { /* empty response */ }
    if (!response.ok || typeof data.enabled !== 'boolean') throw new Error(data.error || 'rules_unavailable');
    return data;
  }

  function setMessage(text, error = false) {
    message.textContent = text || '';
    message.classList.toggle('error', error);
  }

  function renderRules(rules) {
    currentRules = rules;
    const enabled = rules.enabled === true;
    gateHeading.textContent = enabled ? 'ON' : 'OFF';
    gateHeading.classList.toggle('on', enabled);
    gateToggle.disabled = busy;
    gateToggle.setAttribute('aria-checked', String(enabled));
    gateToggle.textContent = enabled ? 'Turn OFF' : 'Turn ON';
    gateNote.classList.toggle('warning', enabled);
    gateNote.textContent = enabled
      ? 'Pro gates are ON. Free-tier limits and Pro-only restrictions are active for users now.'
      : 'Pro gates are OFF. Users are not currently blocked by the Free vs. Pro feature restrictions.';
    freeAsk.textContent = String(rules.freeAskPerDay ?? 'n/a');
    proAsk.textContent = String(rules.proAskPerDay ?? 'n/a');
    freePlaylists.textContent = String(rules.freePlaylists ?? 'n/a');
  }

  function setBusy(value) {
    busy = value;
    gateToggle.disabled = value || !currentRules;
    refreshButton.disabled = value;
  }

  async function refreshRules() {
    setBusy(true);
    setMessage('Refreshing live status…');
    try {
      const rules = await loadRules();
      renderRules(rules);
      setMessage('Live production status loaded.');
    } catch {
      setMessage('Could not load the Pro rollout setting.', true);
    } finally {
      setBusy(false);
      if (currentRules) gateToggle.disabled = false;
    }
  }

  gateToggle.addEventListener('click', async () => {
    if (busy || !currentRules) return;
    const next = !currentRules.enabled;
    const confirmed = window.confirm(next
      ? 'Turn ON ayna Pro feature gates for all users now? Free-tier limits and Pro-only restrictions will apply immediately.'
      : 'Turn OFF ayna Pro feature gates for all users now? Free-tier restrictions will stop applying immediately.');
    if (!confirmed) return;

    setBusy(true);
    setMessage(next ? 'Turning Pro gates on…' : 'Turning Pro gates off…');
    try {
      const rules = await requestPro({ action: 'feature_gates_set', enabled: next });
      renderRules(rules);
      setMessage(`Pro feature gates are now ${rules.enabled ? 'ON' : 'OFF'}. The change is live.`);
    } catch (error) {
      setMessage(error.message === 'forbidden'
        ? 'This account is not allowed to change Pro controls.'
        : 'The setting could not be changed. Nothing was updated.', true);
    } finally {
      setBusy(false);
      if (currentRules) gateToggle.disabled = false;
    }
  });

  refreshButton.addEventListener('click', refreshRules);

  async function init() {
    token = accessTokenFromBrowser();
    if (!token) {
      authStatus.textContent = 'Sign in required';
      authDetail.replaceChildren();
      const text = document.createTextNode('Sign in to ayna with an approved admin account, then reopen this page. ');
      const link = document.createElement('a');
      link.href = '/you';
      link.textContent = 'Sign in';
      authDetail.append(text, link);
      return;
    }

    try {
      const status = await requestPro();
      if (!status.isAdmin) {
        authStatus.textContent = 'Admin access required';
        authDetail.textContent = 'This account is signed in, but it is not on the ayna admin allowlist.';
        return;
      }

      authCard.classList.add('hidden');
      controls.classList.remove('hidden');
      await refreshRules();
    } catch {
      authStatus.textContent = 'Could not verify admin access';
      authDetail.textContent = 'Return to ayna, sign in again, and retry.';
    }
  }

  init();
})();

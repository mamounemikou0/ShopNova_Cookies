const ENGINE = (() => {

  const KEYS = {
    LOGS:    'shopnova_logs',
    CONSENT: 'shopnova_consent',
    SESSION: 'shopnova_session',
    PROFILE: 'shopnova_profile',
    HISTORY: 'shopnova_visit_history',
    PIXEL_LOG: 'shopnova_pixel_log',
  };

  // generateur d'id 
  function uid(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 7);
  }

  // Session 
  function getSession() {
    let s = sessionStorage.getItem(KEYS.SESSION);
    if (!s) {
      s = uid('sess_');
      sessionStorage.setItem(KEYS.SESSION, s);
    }
    return s;
  }

  // Cookies 
  function setCookie(name, value, days, purpose = '') {
    const exp = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Strict`;
    log('cookie_set', `Cookie créé : "${name}"`, {
      cookieName: name,
      value: String(value).substring(0, 80),
      expires: days + ' jour(s)',
      purpose,
    }, 'cookie');
  }

  function getCookie(name) {
    return decodeURIComponent(
      (document.cookie.split('; ').find(r => r.startsWith(name + '=')) || '').split('=').slice(1).join('=')
    ) || null;
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    log('cookie_del', `Cookie supprimé : "${name}"`, { cookieName: name }, 'privacy');
  }

  function getAllShopCookies() {
    if (!document.cookie) return [];
    return document.cookie.split('; ')
      .filter(c => c.startsWith('shopnova_'))
      .map(c => {
        const idx = c.indexOf('=');
        return { name: c.substring(0, idx), value: decodeURIComponent(c.substring(idx + 1)) };
      });
  }

  // Logs et listeners pour suivi en temps réel
  const listeners = [];

  function log(type, message, data = {}, category = 'action') {
    const entry = {
      id: uid('evt_'),
      timestamp: new Date().toISOString(),
      type, message, category,
      data: { ...data, sessionId: getSession(), page: window.location.pathname },
    };
    const logs = getLogs();
    logs.unshift(entry);
    if (logs.length > 1000) logs.splice(1000);
    try { localStorage.setItem(KEYS.LOGS, JSON.stringify(logs)); } catch(e) {}
    listeners.forEach(fn => fn(entry));
    return entry;
  }

  function getLogs() {
    try { return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]'); } catch { return []; }
  }

  function onLog(fn) { listeners.push(fn); }

  // fingerprint navigateur 
  function collectFingerprint() {
    const fp = {
      language:        navigator.language,
      languages:       (navigator.languages || []).join(', '),
      timezone:        Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenRes:       `${screen.width}×${screen.height}`,
      windowSize:      `${window.innerWidth}×${window.innerHeight}`,
      colorDepth:      screen.colorDepth + ' bits',
      platform:        navigator.platform,
      cores:           navigator.hardwareConcurrency || 'N/A',
      memory:          (navigator.deviceMemory || 'N/A') + ' GB',
      touchPoints:     navigator.maxTouchPoints,
      cookiesEnabled:  navigator.cookieEnabled,
      doNotTrack:      navigator.doNotTrack || 'non défini',
      collectedAt:     new Date().toISOString(),
    };
    try { localStorage.setItem('shopnova_fingerprint', JSON.stringify(fp)); } catch(e) {}
    log('fingerprint', 'Empreinte navigateur collectée', fp, 'fingerprint');
    return fp;
  }

  function getFingerprint() {
    try { return JSON.parse(localStorage.getItem('shopnova_fingerprint') || 'null'); } catch { return null; }
  }

  // simulation pixel
  function firePixel(event, extraData = {}) {
    const payload = {
      event,
      timestamp:  new Date().toISOString(),
      sessionId:  getSession(),
      userId:     getCookie('shopnova_user_id') || 'anonymous',
      page:       window.location.pathname,
      referrer:   document.referrer || 'direct',
      viewport:   `${window.innerWidth}×${window.innerHeight}`,
      ...extraData,
    };

    // Simule un 1×1 tracking pixel img element 
    const img = document.createElement('img');
    img.src = `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`;
    img.width = 1; img.height = 1;
    img.style.cssText = 'position:absolute;opacity:0;pointer-events:none;';
    img.alt = '';
    img.setAttribute('data-pixel-event', event);
    document.body.appendChild(img);
    setTimeout(() => img.remove(), 100);

    // Log du pixel
    const pixelLogs = getPixelLogs();
    pixelLogs.unshift({ ...payload });
    if (pixelLogs.length > 200) pixelLogs.splice(200);
    try { localStorage.setItem(KEYS.PIXEL_LOG, JSON.stringify(pixelLogs)); } catch(e) {}

    log('pixel', `Pixel déclenché : "${event}"`, payload, 'track');
    return payload;
  }

  function getPixelLogs() {
    try { return JSON.parse(localStorage.getItem(KEYS.PIXEL_LOG) || '[]'); } catch { return []; }
  }

  // construction du Profile 
  function getProfile() {
    try { return JSON.parse(localStorage.getItem(KEYS.PROFILE) || 'null'); } catch { return null; }
  }

  function updateProfile(patch) {
    const p = getProfile() || { createdAt: new Date().toISOString() };
    const updated = { ...p, ...patch, lastActivity: new Date().toISOString() };
    try { localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated)); } catch(e) {}
    return updated;
  }

  // Historiwue des visites sur le site
  function recordVisit() {
    const history = getVisitHistory();
    const visit = {
      sessionId: getSession(),
      timestamp: new Date().toISOString(),
      consent:   getConsent()?.choice || 'none',
      page:      window.location.pathname,
    };
    history.unshift(visit);
    if (history.length > 50) history.splice(50);
    try { localStorage.setItem(KEYS.HISTORY, JSON.stringify(history)); } catch(e) {}
    return visit;
  }

  function getVisitHistory() {
    try { return JSON.parse(localStorage.getItem(KEYS.HISTORY) || '[]'); } catch { return []; }
  }

  // Consentement et gestion des cookies en fonction du choix de l'utilisateur
  function getConsent() {
    try { return JSON.parse(localStorage.getItem(KEYS.CONSENT) || 'null'); } catch { return null; }
  }

  function applyConsent(choice) {
    const consent = { choice, timestamp: new Date().toISOString(), version: '1.0' };
    try { localStorage.setItem(KEYS.CONSENT, JSON.stringify(consent)); } catch(e) {}
    log('consent', `Consentement enregistré : "${choice}"`, { choice }, 'action');

  
    ['shopnova_user_id','shopnova_ab_group','shopnova_first_visit',
     'shopnova_src','shopnova_session_id','shopnova_lang'].forEach(c => deleteCookie(c));
    localStorage.removeItem('shopnova_fingerprint');
    localStorage.removeItem(KEYS.PROFILE);

    if (choice === 'essential' || choice === 'all') {
      setCookie('shopnova_session_id', getSession(), 1, 'Identification de session courante');
      setCookie('shopnova_consent', choice, 365, 'Mémorisation du choix de consentement');
      setCookie('shopnova_lang', navigator.language, 365, 'Langue préférée');
    }

    if (choice === 'all') {
      const userId = uid('usr_');
      setCookie('shopnova_user_id', userId, 730, 'Identifiant utilisateur persistant (2 ans)');
      setCookie('shopnova_ab_group', Math.random() > 0.5 ? 'A' : 'B', 365, 'Groupe de test A/B (manipulation prix/affichage)');
      setCookie('shopnova_first_visit', new Date().toISOString(), 730, 'Horodatage de première visite (2 ans)');
      setCookie('shopnova_src', document.referrer ? 'referral' : 'organic', 30, 'Source d\'acquisition marketing');
      const fp = collectFingerprint();
      updateProfile({ userId, abGroup: getCookie('shopnova_ab_group'), fingerprint: true });
      firePixel('consent_given', { userId, abGroup: getCookie('shopnova_ab_group') });
      log('analytics', 'Suivi analytique et marketing activé', {
        userId, abGroup: getCookie('shopnova_ab_group'),
        cookiesCreated: 6, fingerprintCollected: true,
      }, 'track');
    }

    if (choice === 'refused') {
      setCookie('shopnova_consent', 'refused', 365, 'Mémorisation du refus (pour ne pas redemander)');
      log('privacy', 'Refus enregistré — tracking désactivé, cookies tiers supprimés', {}, 'privacy');
    }

    recordVisit();
    return consent;
  }

  // Tout supprimer 
  function clearAll() {
    localStorage.clear();
    sessionStorage.clear();
    ['shopnova_session_id','shopnova_consent','shopnova_lang','shopnova_user_id',
     'shopnova_ab_group','shopnova_first_visit','shopnova_src'].forEach(deleteCookie);
  }

  // score du risque 
  function getRiskScore() {
    const consent = getConsent();
    if (!consent) return { score: 0, label: '—', color: '#6b6b8a', pct: 0 };
    if (consent.choice === 'all')       return { score: 3, label: 'Élevé',  color: '#ef4444', pct: 92 };
    if (consent.choice === 'essential') return { score: 2, label: 'Modéré', color: '#f59e0b', pct: 38 };
    return { score: 1, label: 'Faible', color: '#10b981', pct: 8 };
  }

  return {
    uid, getSession, log, getLogs, onLog,
    setCookie, getCookie, deleteCookie, getAllShopCookies,
    collectFingerprint, getFingerprint,
    firePixel, getPixelLogs,
    getProfile, updateProfile,
    recordVisit, getVisitHistory,
    getConsent, applyConsent,
    clearAll, getRiskScore,
    KEYS,
  };
})();
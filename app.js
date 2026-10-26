/* Řekni to s Kiki — vanilla JS game logic.
 * No dependencies, no network calls beyond the local JSON/asset files,
 * no microphone, no speech recognition, no TTS.
 */
(function () {
  'use strict';

  var SESSION_LENGTH = 5;
  var STORAGE_KEY = 'kiki.settings.v1';
  var TRANSITION_MS = 200;
  var CATEGORY_ORDER = ['people', 'animals', 'food', 'everyday', 'body', 'nature', 'home'];

  // ---------- State ----------
  var words = [];          // dataset in stable order
  var wordById = {};
  var ui = {};             // Czech UI strings (data/ui.cs.json)
  var defaults = { selectedIds: ['mama', 'tata', 'oko', 'bota', 'auto'], soundEnabled: true, motionEnabled: true };

  var state = {
    screen: 'loading',
    selectedIds: [],
    sessionIds: [],
    index: 0,
    resolvedCount: 0,
    transitionLock: false,
    transitionTimer: null,
    filter: 'all',
    settings: { soundEnabled: true, motionEnabled: true },
    paused: false,
    pausedFrom: null,
    lastFocus: null
  };

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }
  function t(key, vars) {
    var s = (ui && typeof ui[key] === 'string') ? ui[key] : FALLBACK_UI[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(String(vars[k])); });
    }
    return s;
  }
  function categoryLabel(cat) {
    return (ui.categories && ui.categories[cat]) || FALLBACK_UI.categories[cat] || cat;
  }
  function log() {
    if (window.console && console.info) { console.info.apply(console, ['[Kiki]'].concat([].slice.call(arguments))); }
  }
  function warn() {
    if (window.console && console.warn) { console.warn.apply(console, ['[Kiki]'].concat([].slice.call(arguments))); }
  }

  // Minimal Czech fallback so a broken ui.cs.json never leaves the child with English or empty labels.
  var FALLBACK_UI = {
    title: 'Řekni to s Kiki', start: 'Začít', choose: 'Vybrat slovíčka', adult: 'Pro dospělé',
    repeat: 'Poslechnout znovu', next: 'Dál', skip: 'Přeskočit', pause: 'Pozastavit', resume: 'Pokračovat',
    exit: 'Ukončit hru', close: 'Zavřít', done: 'Hotovo', restart: 'Hrát znovu', back: 'Zpět',
    reset: 'Obnovit výchozí výběr', cardCounter: 'Slovíčko {current} z {total}', selectionCounter: 'Vybráno {count} z 5',
    selectFive: 'Vyberte přesně 5 obrázků.', selectionFull: 'Už máte 5 slovíček. Pro změnu nejprve jedno odeberte.',
    tryNow: 'Teď to zkus ty.', adultLed: 'Slovíčko přečte dospělý.', missingAudio: 'Nahrávka není dostupná. Slovíčko přečte dospělý.',
    completion: 'Naše zahrádka rozkvetla!', thanks: 'Děkuju za společné hraní.', soundOn: 'Zvuk zapnutý', soundOff: 'Zvuk vypnutý',
    motionOn: 'Pohyb zapnutý', motionOff: 'Pohyb vypnutý', loadError: 'Slovíčka se nepodařilo načíst.', retry: 'Zkusit znovu',
    missingImage: 'Obrázek není dostupný.', exitQuestion: 'Chcete ukončit hraní?', all: 'Vše', starter: 'První výběr',
    categories: { people: 'Rodina a gesta', animals: 'Zvířata', food: 'Jídlo a pití', everyday: 'Věci a doprava', body: 'Tělo', nature: 'Příroda', home: 'Domov a hračky' }
  };

  // ---------- Storage (safe wrappers; failure is non-fatal) ----------
  var memoryStore = null;
  function storageGet() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw === null ? memoryStore : raw;
    } catch (e) { warn('localStorage read failed, using memory fallback', e); return memoryStore; }
  }
  function storageSet(value) {
    memoryStore = value;
    try { window.localStorage.setItem(STORAGE_KEY, value); }
    catch (e) { warn('localStorage write failed, keeping settings in memory only', e); }
  }

  function sanitizeIds(ids) {
    if (!Array.isArray(ids)) return null;
    var out = [];
    ids.forEach(function (id) {
      if (typeof id === 'string' && wordById[id] && out.indexOf(id) === -1) out.push(id);
    });
    return out;
  }
  function readSettings() {
    var result = { selectedIds: sanitizeIds(defaults.selectedIds) || [], soundEnabled: !!defaults.soundEnabled, motionEnabled: !!defaults.motionEnabled };
    var raw = storageGet();
    if (!raw) return result;
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { warn('Stored settings are not valid JSON; recovering defaults'); return result; }
    if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== 1) { warn('Stored settings have unknown schema; recovering defaults'); return result; }
    var ids = sanitizeIds(parsed.selectedIds);
    if (ids && ids.length === SESSION_LENGTH) result.selectedIds = ids;
    else if (ids) warn('Stored selection invalid (' + (ids ? ids.length : 0) + ' valid ids); recovering defaults');
    if (typeof parsed.soundEnabled === 'boolean') result.soundEnabled = parsed.soundEnabled;
    if (typeof parsed.motionEnabled === 'boolean') result.motionEnabled = parsed.motionEnabled;
    return result;
  }
  function writeSettings() {
    var payload = { schemaVersion: 1, selectedIds: state.selectedIds.slice(), soundEnabled: state.settings.soundEnabled, motionEnabled: state.settings.motionEnabled };
    try { storageSet(JSON.stringify(payload)); } catch (e) { warn('Could not serialize settings', e); }
  }

  // ---------- Audio controller ----------
  // One active clip at a time. Every operation that may invalidate playback bumps `generation`,
  // so callbacks from an older <audio> element are ignored even if they fire late.
  var audio = {
    generation: 0,
    el: null,
    failedIds: {},   // ids whose clip failed to load/play in this page life → adult-led fallback
    playing: false
  };

  function audioAvailable(word) {
    return !!word && word.audioStatus === 'ready' && typeof word.audio === 'string' && word.audio.length > 0
      && state.settings.soundEnabled && !audio.failedIds[word.id];
  }

  function stopAudio() {
    audio.generation += 1;
    audio.playing = false;
    var el = audio.el;
    audio.el = null;
    if (el) {
      try { el.onended = el.onerror = el.onpause = null; el.pause(); el.removeAttribute('src'); el.load(); } catch (e) { /* ignore */ }
    }
    updateReplayVisual();
  }

  // Plays only the current word's clip (if marked ready). Called only from user gestures.
  function playWord(word) {
    stopAudio();
    if (!audioAvailable(word)) { renderAudioControls(word); return; }
    var gen = audio.generation;
    var el;
    try {
      el = new Audio();
      el.preload = 'auto';
      el.src = word.audio;   // path comes from the shipped JSON only
    } catch (e) { onAudioFailure(word, gen, e); return; }
    audio.el = el;
    audio.playing = true;
    updateReplayVisual();
    el.onended = function () { if (gen !== audio.generation) return; audio.playing = false; updateReplayVisual(); };
    el.onerror = function () { onAudioFailure(word, gen, el.error); };
    var p;
    try { p = el.play(); } catch (e) { onAudioFailure(word, gen, e); return; }
    if (p && typeof p.then === 'function') {
      p.then(function () { if (gen !== audio.generation) return; log('Playing clip', word.audio); })
       .catch(function (err) { onAudioFailure(word, gen, err); });
    }
  }
  function onAudioFailure(word, gen, err) {
    if (gen !== audio.generation) return;   // stale callback from an earlier card
    warn('Audio failed for', word.id, '(' + word.audio + ')', err && (err.message || err.code || err));
    audio.failedIds[word.id] = true;
    stopAudio();
    renderAudioControls(word);
  }
  function updateReplayVisual() {
    var btn = $('btn-replay');
    if (btn) btn.classList.toggle('is-playing', audio.playing);
  }

  // ---------- Screens ----------
  var SCREENS = ['loading', 'welcome', 'select', 'play', 'complete'];
  function renderScreen(name) {
    cancelTransition();
    stopAudio();
    state.screen = name;
    SCREENS.forEach(function (s) { var el = $('screen-' + s); if (el) el.hidden = (s !== name); });
    window.scrollTo(0, 0);
    if (name === 'welcome') renderWelcome();
    if (name === 'select') renderSelect();
    if (name === 'complete') renderComplete();
  }

  function renderWelcome() {
    var names = state.selectedIds.map(function (id) { return wordById[id].text; }).join(', ');
    $('welcome-selection').textContent = 'Vybraná slovíčka: ' + names;
    var anyReady = state.selectedIds.some(function (id) { return wordById[id].audioStatus === 'ready'; });
    var note = $('welcome-audio-note');
    note.textContent = anyReady && state.settings.soundEnabled ? t('repeat') + ' — nahrávky jsou připravené.' : t('adultLed');
    note.hidden = false;
    $('btn-start').disabled = state.selectedIds.length !== SESSION_LENGTH;
    $('btn-start').focus();
  }

  // ---------- Adult selection ----------
  var gridBuilt = false;
  function buildSelectOnce() {
    if (gridBuilt) return;
    gridBuilt = true;
    var filters = $('filters');
    var defs = [{ key: 'all', label: t('all') }, { key: 'starter', label: t('starter') }]
      .concat(CATEGORY_ORDER.map(function (c) { return { key: c, label: categoryLabel(c) }; }));
    defs.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'secondary'; b.textContent = d.label;
      b.dataset.filter = d.key; b.setAttribute('aria-pressed', d.key === state.filter ? 'true' : 'false');
      b.addEventListener('click', function () { state.filter = d.key; applyFilter(); });
      filters.appendChild(b);
    });

    var grid = $('word-grid');
    words.forEach(function (w) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'word-choice secondary'; b.dataset.id = w.id; b.dataset.category = w.category;
      b.dataset.starter = w.starter ? '1' : '0';
      b.setAttribute('aria-pressed', 'false');
      var img = document.createElement('img');
      img.src = w.image; img.alt = ''; img.setAttribute('aria-hidden', 'true'); img.loading = 'lazy';
      img.addEventListener('error', function () { warn('Missing image', w.image); img.style.visibility = 'hidden'; });
      var label = document.createElement('span'); label.textContent = w.text;
      var check = document.createElement('span'); check.className = 'check'; check.setAttribute('aria-hidden', 'true');
      var ci = document.createElement('img'); ci.src = 'assets/ui/check.svg'; ci.alt = ''; check.appendChild(ci);
      b.appendChild(check); b.appendChild(img); b.appendChild(label);
      if (w.starter) { var sd = document.createElement('span'); sd.className = 'starter-dot'; sd.textContent = t('starter'); b.appendChild(sd); }
      b.addEventListener('click', function () { selectWord(w.id); });
      grid.appendChild(b);
    });
  }
  function applyFilter() {
    var btns = $('filters').querySelectorAll('button');
    [].forEach.call(btns, function (b) { b.setAttribute('aria-pressed', b.dataset.filter === state.filter ? 'true' : 'false'); });
    var cards = $('word-grid').querySelectorAll('.word-choice');
    [].forEach.call(cards, function (c) {
      var show = state.filter === 'all' || (state.filter === 'starter' ? c.dataset.starter === '1' : c.dataset.category === state.filter);
      c.classList.toggle('is-hidden', !show);
    });
  }
  function renderSelect() {
    buildSelectOnce();
    applyFilter();
    setNotice('');
    renderSelectionState();
    $('btn-select-back').focus();
  }
  function setNotice(text) { $('selection-notice').textContent = text; }
  function renderSelectionState() {
    var cards = $('word-grid').querySelectorAll('.word-choice');
    [].forEach.call(cards, function (c) {
      var on = state.selectedIds.indexOf(c.dataset.id) !== -1;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $('selection-counter').textContent = t('selectionCounter', { count: state.selectedIds.length });
    $('btn-select-start').disabled = state.selectedIds.length !== SESSION_LENGTH;
  }
  function selectWord(id) {
    var i = state.selectedIds.indexOf(id);
    if (i !== -1) {
      state.selectedIds.splice(i, 1);
      setNotice('');
    } else if (state.selectedIds.length >= SESSION_LENGTH) {
      setNotice(t('selectionFull'));   // sixth choice refused, neutral wording
      return;
    } else {
      state.selectedIds.push(id);
      setNotice('');
    }
    writeSettings();
    renderSelectionState();
  }
  function resetSelection() {
    state.selectedIds = sanitizeIds(defaults.selectedIds) || [];
    setNotice('');
    writeSettings();
    renderSelectionState();
  }

  // ---------- Session ----------
  function startSession() {
    if (state.selectedIds.length !== SESSION_LENGTH) { renderScreen('select'); return; }
    // Snapshot in stable dataset order, not click order.
    state.sessionIds = words.map(function (w) { return w.id; }).filter(function (id) { return state.selectedIds.indexOf(id) !== -1; });
    state.index = 0;
    state.resolvedCount = 0;
    state.transitionLock = false;
    renderScreen('play');
    renderGarden($('garden'), state.resolvedCount, false);
    renderCard(true);   // Start itself is the user gesture that allows a ready clip to play
  }

  function currentWord() { return wordById[state.sessionIds[state.index]]; }

  function renderCard(announce) {
    var w = currentWord();
    if (!w) { finishSession(); return; }
    var card = $('card');
    card.classList.remove('is-leaving');
    $('card-counter').textContent = t('cardCounter', { current: state.index + 1, total: SESSION_LENGTH });
    $('card-word').textContent = w.text;
    $('card-prompt').textContent = t('tryNow');

    var img = $('card-image');
    var fb = $('card-fallback');
    fb.hidden = true; img.hidden = false;
    img.alt = w.text;
    img.onerror = function () {
      warn('Missing picture for', w.id, '→', w.image);
      img.hidden = true; fb.hidden = false; fb.textContent = t('missingImage');
    };
    img.src = w.image;

    renderAudioControls(w);
    if (announce !== false) {
      $('live').textContent = w.text + '. ' + t('cardCounter', { current: state.index + 1, total: SESSION_LENGTH });
    }
    // Autoplay of a ready clip happens only from the user gesture that advanced to this card.
    if (announce !== false && audioAvailable(w)) playWord(w);
  }

  function renderAudioControls(w) {
    var btn = $('btn-replay');
    var led = $('adult-led');
    if (audioAvailable(w)) {
      btn.hidden = false; led.hidden = true;
    } else {
      btn.hidden = true; led.hidden = false;
      var failed = !!audio.failedIds[w.id];
      led.textContent = failed ? t('missingAudio') : t('adultLed');
    }
  }

  function cancelTransition() {
    if (state.transitionTimer) { clearTimeout(state.transitionTimer); state.transitionTimer = null; }
    state.transitionLock = false;
    var card = $('card'); if (card) card.classList.remove('is-leaving');
    if ($('btn-next')) setAdvanceEnabled(true);
  }

  function setAdvanceEnabled(on) {
    $('btn-next').disabled = !on;
    $('btn-skip').disabled = !on;
  }

  // Next and Skip both resolve exactly one card and grow one flower.
  function advance(kind) {
    if (state.screen !== 'play' || state.paused || state.transitionLock) return;
    if (state.index >= SESSION_LENGTH || state.index >= state.sessionIds.length) return;
    state.transitionLock = true;
    setAdvanceEnabled(false);
    stopAudio();
    state.resolvedCount = Math.min(SESSION_LENGTH, state.resolvedCount + 1);
    renderGarden($('garden'), state.resolvedCount, true);
    log(kind, 'resolved card', state.index + 1, '→ flowers', state.resolvedCount);

    var showNext = function () {
      state.index += 1;
      if (state.index >= SESSION_LENGTH || state.index >= state.sessionIds.length) { finishSession(); return false; }
      renderCard(true);
      return true;
    };
    var unlock = function () {
      state.transitionTimer = null;
      state.transitionLock = false;
      if (state.screen === 'play') setAdvanceEnabled(true);
    };
    var card = $('card');
    if (motionAllowed()) {
      card.classList.add('is-leaving');
      state.transitionTimer = setTimeout(function () { if (showNext()) unlock(); else unlock(); }, TRANSITION_MS);
    } else {
      // Reduced motion / motion off: final state immediately; the short lock only swallows accidental double taps.
      if (!showNext()) { unlock(); return; }
      state.transitionTimer = setTimeout(unlock, TRANSITION_MS);
    }
  }

  function finishSession() {
    state.resolvedCount = SESSION_LENGTH;
    renderScreen('complete');
    $('btn-restart').focus();
  }
  function renderComplete() { renderGarden($('garden-final'), SESSION_LENGTH, false); }

  function restartSession() { stopAudio(); cancelTransition(); state.paused = false; startSession(); $('btn-next').focus(); }

  function renderGarden(container, count, popLast) {
    if (!container) return;
    container.textContent = '';
    for (var i = 0; i < SESSION_LENGTH; i++) {
      var img = document.createElement('img');
      var grown = i < count;
      img.src = grown ? 'assets/rewards/flower-2.svg' : 'assets/rewards/flower-0.svg';
      img.alt = grown ? 'Rozkvetlá kytička' : 'Semínko';
      if (popLast && grown && i === count - 1 && motionAllowed()) img.classList.add('pop');
      container.appendChild(img);
    }
    container.setAttribute('aria-label', 'Zahrádka: ' + count + ' z ' + SESSION_LENGTH + ' kytiček');
  }

  function motionAllowed() {
    if (!state.settings.motionEnabled) return false;
    try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; }
  }

  // ---------- Pause / exit dialog ----------
  function openDialog() {
    if (state.screen !== 'play' || state.paused) return;
    stopAudio();
    state.paused = true;
    state.lastFocus = document.activeElement;
    var d = $('dialog');
    d.hidden = false;
    $('main').setAttribute('aria-hidden', 'true');
    $('btn-resume').focus();
  }
  function closeDialog(restoreFocus) {
    var d = $('dialog');
    d.hidden = true;
    $('main').removeAttribute('aria-hidden');
    state.paused = false;
    if (restoreFocus && state.lastFocus && typeof state.lastFocus.focus === 'function' && !state.lastFocus.disabled) {
      try { state.lastFocus.focus(); } catch (e) { /* ignore */ }
    }
    state.lastFocus = null;
  }
  function trapFocus(e) {
    var d = $('dialog');
    if (d.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(true); return; }
    if (e.key !== 'Tab') return;
    var f = d.querySelectorAll('button:not([disabled])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // ---------- Settings toggles ----------
  function applySettingsUI() {
    var sb = $('btn-sound');
    sb.setAttribute('aria-pressed', state.settings.soundEnabled ? 'true' : 'false');
    $('sound-label').textContent = state.settings.soundEnabled ? t('soundOn') : t('soundOff');
    $('sound-icon').src = state.settings.soundEnabled ? 'assets/ui/speaker.svg' : 'assets/ui/mute.svg';
    var mb = $('btn-motion');
    mb.setAttribute('aria-pressed', state.settings.motionEnabled ? 'true' : 'false');
    $('motion-label').textContent = state.settings.motionEnabled ? t('motionOn') : t('motionOff');
    document.documentElement.setAttribute('data-motion', state.settings.motionEnabled ? 'on' : 'off');
  }
  function toggleSound() {
    state.settings.soundEnabled = !state.settings.soundEnabled;
    stopAudio();   // muting stops the current clip; unmuting never autoplays
    writeSettings();
    applySettingsUI();
    if (state.screen === 'play' && currentWord()) renderAudioControls(currentWord());
    if (state.screen === 'welcome') renderWelcome();
  }
  function toggleMotion() {
    state.settings.motionEnabled = !state.settings.motionEnabled;
    writeSettings();
    applySettingsUI();
  }

  // ---------- Content loading ----------
  function fetchJson(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
      return r.json();
    });
  }
  function validateWords(list) {
    if (!Array.isArray(list) || list.length === 0) throw new Error('words.json is not a non-empty array');
    var seen = {};
    var required = ['id', 'text', 'category', 'image'];
    list.forEach(function (w, i) {
      if (!w || typeof w !== 'object') throw new Error('word #' + i + ' is not an object');
      required.forEach(function (k) { if (typeof w[k] !== 'string' || !w[k]) throw new Error('word #' + i + ' missing ' + k); });
      if (seen[w.id]) throw new Error('duplicate id ' + w.id);
      seen[w.id] = true;
      if (typeof w.audioStatus !== 'string') w.audioStatus = 'not-recorded';
    });
    return list;
  }

  function loadContent() {
    $('main').setAttribute('aria-busy', 'true');
    $('load-error').hidden = true; $('btn-retry').hidden = true; $('loading-text').hidden = false;
    renderScreen('loading');
    return Promise.all([
      fetchJson('data/words.json'),
      fetchJson('data/ui.cs.json').catch(function (e) { warn('ui.cs.json failed, using built-in Czech strings', e); return {}; }),
      fetchJson('data/defaults.json').catch(function (e) { warn('defaults.json failed, using built-in defaults', e); return null; })
    ]).then(function (res) {
      words = validateWords(res[0]);
      wordById = {};
      words.forEach(function (w) { wordById[w.id] = w; });
      ui = (res[1] && typeof res[1] === 'object') ? res[1] : {};
      if (res[2] && typeof res[2] === 'object') {
        if (Array.isArray(res[2].selectedIds)) defaults.selectedIds = res[2].selectedIds;
        if (typeof res[2].soundEnabled === 'boolean') defaults.soundEnabled = res[2].soundEnabled;
        if (typeof res[2].motionEnabled === 'boolean') defaults.motionEnabled = res[2].motionEnabled;
      }
      var s = readSettings();
      state.selectedIds = s.selectedIds;
      state.settings.soundEnabled = s.soundEnabled;
      state.settings.motionEnabled = s.motionEnabled;
      applyStaticStrings();
      applySettingsUI();
      $('main').removeAttribute('aria-busy');
      log('Loaded', words.length, 'words; ready clips:', words.filter(function (w) { return w.audioStatus === 'ready'; }).length);
      renderScreen('welcome');
    }).catch(function (err) {
      warn('Content load failed', err);
      $('main').removeAttribute('aria-busy');
      $('loading-text').hidden = true;
      $('load-error').hidden = false; $('load-error').textContent = t('loadError');
      $('btn-retry').hidden = false; $('btn-retry').textContent = t('retry');
      $('btn-retry').focus();
    });
  }

  function applyStaticStrings() {
    document.title = t('title');
    $('welcome-title').textContent = t('title');
    document.querySelector('.brand').textContent = t('title');
    $('btn-start').textContent = t('start');
    $('btn-select-start').textContent = t('start');
    setBtnText('btn-choose', t('choose'), t('adult'));
    setBtnText('btn-to-select', t('choose'), t('adult'));
    setBtnText('btn-select-back', t('back'));
    $('btn-reset').textContent = t('reset');
    setBtnText('btn-replay', t('repeat'));
    setBtnText('btn-next', t('next'));
    $('btn-skip').textContent = t('skip');
    setBtnText('btn-pause', t('pause'));
    setBtnText('btn-exit', t('exit'));
    $('btn-resume').textContent = t('resume');
    $('btn-to-welcome').textContent = t('exit');
    $('btn-restart').textContent = t('restart');
    $('btn-done').textContent = t('done');
    $('dialog-title').textContent = t('exitQuestion');
    $('screen-complete').querySelector('h2').textContent = t('completion');
    $('screen-complete').querySelector('.lead').textContent = t('thanks');
    $('screen-select').querySelector('.note').textContent = t('selectFive');
  }
  function setBtnText(id, text, tag) {
    var b = $(id); if (!b) return;
    var span = b.querySelector('span:not(.adult-tag)');
    if (span) span.textContent = text; else b.textContent = text;
    var tagEl = b.querySelector('.adult-tag'); if (tagEl && tag) tagEl.textContent = tag;
  }

  // ---------- Wiring ----------
  function bind() {
    $('btn-retry').addEventListener('click', loadContent);
    $('btn-start').addEventListener('click', startSession);
    $('btn-choose').addEventListener('click', function () { renderScreen('select'); });
    $('btn-select-back').addEventListener('click', function () { renderScreen('welcome'); });
    $('btn-select-start').addEventListener('click', startSession);
    $('btn-reset').addEventListener('click', resetSelection);
    $('btn-replay').addEventListener('click', function () { if (!state.paused && !state.transitionLock) playWord(currentWord()); });
    $('btn-next').addEventListener('click', function () { advance('next'); });
    $('btn-skip').addEventListener('click', function () { advance('skip'); });
    $('btn-pause').addEventListener('click', openDialog);
    $('btn-exit').addEventListener('click', openDialog);
    $('btn-resume').addEventListener('click', function () { closeDialog(true); });
    $('btn-to-welcome').addEventListener('click', function () { closeDialog(false); renderScreen('welcome'); });
    $('btn-to-select').addEventListener('click', function () { closeDialog(false); renderScreen('select'); });
    $('btn-restart').addEventListener('click', restartSession);
    $('btn-done').addEventListener('click', function () { renderScreen('welcome'); });
    $('btn-sound').addEventListener('click', toggleSound);
    $('btn-motion').addEventListener('click', toggleMotion);
    $('dialog').addEventListener('click', function (e) { if (e.target === $('dialog')) closeDialog(true); });
    document.addEventListener('keydown', function (e) {
      if (!$('dialog').hidden) { trapFocus(e); return; }
      if (e.key === 'Escape' && state.screen === 'play') openDialog();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAudio();   // return does not autoplay
    });
    window.addEventListener('pagehide', stopAudio);
  }

  // Small diagnostics hook for manual/automated verification (read-only view of state).
  window.KikiDebug = {
    getState: function () { return JSON.parse(JSON.stringify({ screen: state.screen, selectedIds: state.selectedIds, sessionIds: state.sessionIds, index: state.index, resolvedCount: state.resolvedCount, transitionLock: state.transitionLock, paused: state.paused, settings: state.settings, audioGeneration: audio.generation, audioPlaying: audio.playing, audioFailed: Object.keys(audio.failedIds) })); },
    wordCount: function () { return words.length; }
  };

  bind();
  loadContent();
})();

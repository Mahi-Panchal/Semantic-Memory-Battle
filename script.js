/**
 * WordMind — Semantic Memory Battle
 * Main game engine, Transformers.js pipeline, AI agents, and NLP lab
 */

// =============================================================================
// CONFIGURATION
// =============================================================================
const CFG = {
  MODEL_NAME: 'Xenova/all-MiniLM-L6-v2',
  CDN: 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2',
  THRESHOLDS: { Easy: 0.35, Normal: 0.42, Hard: 0.50, Custom: 0.42 },
  DEFAULT_DIFFICULTY: 'Normal',
  DEFAULT_TIMER: 15,
  DEFAULT_LIVES: 2,
  WARMUP_BATCH: 25,   // words per yield during warm-up
  AI_THINK_MIN: 1400, // ms
  AI_THINK_MAX: 2600,
  MIN_WORD_LEN: 3,
  // AI move choice scales with how many words qualify: it picks at random from the
  // best AI_POOL_FRACTION of the qualifying words, clamped to [AI_POOL_MIN, AI_POOL_MAX].
  AI_POOL_MIN: 5,
  AI_POOL_MAX: 25,
  AI_POOL_FRACTION: 0.25,
  THRESHOLD_MIN: 0.20,
  THRESHOLD_MAX: 0.80,
  PREVIEW_MAX_THRESHOLD: 0.50  // live preview is hidden at or above this threshold (like Hard)
};

// =============================================================================
// GAME STATE
// =============================================================================
const GS = {
  status: 'lobby',           // 'lobby'|'playing'|'gameover'
  players: [],
  activeIdx: 0,
  currentWord: '',
  usedWords: new Set(),
  chainHistory: [],          // [{word, submitter, score, isHuman, round}]
  round: 1,
  timerLeft: 0,
  timerId: null,
  aiTimerId: null,
  lockedThreshold: null,     // threshold frozen when a game starts (cannot change mid-game)
  turnToken: 0,              // Monotonically increasing token to invalidate stale async AI turns
  isEval: false,
  isPaused: false,           // Paused while settings modal is open
  hintUsed: false,           // 1 hint per game session
  peakSim: 0,
  humanWordCount: 0,
  totalSim: 0,
  simCount: 0,
  eliminations: [],
  // Settings (also read from localStorage)
  difficulty: CFG.DEFAULT_DIFFICULTY,
  customThreshold: 0.42,
  timerSecs: CFG.DEFAULT_TIMER,
  livesPerPlayer: CFG.DEFAULT_LIVES,
  livePreview: true,
  soundOn: true,
  reduceMotion: false,
  opponentCount: 1  // 1, 2, or 3 AI opponents
};

// =============================================================================
// NLP ENGINE STATE
// =============================================================================
let extractor = null;
let modelReady = false;
let warmupDone = false;
let modelError = false;
const embCache = new Map();
let livePreviewDebounce = null;
let previewSeq = 0;

// =============================================================================
// AI PROFILES
// =============================================================================
const AI_PROFILES = [
  { id: 'nova',    name: 'Nova-7',    avatar: '🌌', role: 'Cosmic Analyst' },
  { id: 'cyber',   name: 'CyberSage', avatar: '⚡', role: 'Logic Core' },
  { id: 'echo',    name: 'Echo-Mind', avatar: '🌿', role: 'Sensory Empath' }
];

// =============================================================================
// AUDIO (Web Audio API — synthetic, no assets needed)
// =============================================================================
let _audio = null;
function ac() {
  if (!_audio) {
    const Cls = window.AudioContext || window.webkitAudioContext;
    if (Cls) _audio = new Cls();
  }
  if (_audio && _audio.state === 'suspended') _audio.resume();
  return _audio;
}

function beep(type) {
  if (!GS.soundOn) return;
  try {
    const ctx = ac(); if (!ctx) return;
    const t = ctx.currentTime;
    const play = (freq, dur, shape = 'sine', vol = 0.08) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = shape;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    };
    if (type === 'tick')     { play(800, 0.06); }
    if (type === 'turn')     { play(440, 0.12); play(660, 0.12); }
    if (type === 'success')  { [523, 659, 784].forEach((f,i) => play(f, 0.3, 'triangle', 0.09)); }
    if (type === 'eliminate'){ play(200, 0.4, 'sawtooth', 0.1); }
    if (type === 'victory')  { [523, 659, 784, 1047].forEach((f,i) => {
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type='square'; o.frequency.setValueAtTime(f, t+i*0.13);
      g.gain.setValueAtTime(0.07, t+i*0.13);
      g.gain.exponentialRampToValueAtTime(0.001, t+i*0.13+0.4);
      o.start(t+i*0.13); o.stop(t+i*0.13+0.4);
    }); }
  } catch(_) {}
}

// =============================================================================
// THRESHOLD GETTER & SETTINGS PERSISTENCE
// =============================================================================
function resolveThreshold() {
  const thr = CFG.THRESHOLDS[GS.difficulty];
  if (typeof thr === 'number' && !isNaN(thr) && thr > 0) return thr;
  if (typeof GS.customThreshold === 'number' && !isNaN(GS.customThreshold) && GS.customThreshold > 0) return GS.customThreshold;
  return 0.42;
}

// During a game (and on its result screen) the threshold is the one frozen at start.
function getThreshold() {
  if (GS.status !== 'lobby' && typeof GS.lockedThreshold === 'number') return GS.lockedThreshold;
  return resolveThreshold();
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('wm_settings') || '{}');
    GS.customThreshold = (typeof s.customThreshold === 'number' && isFinite(s.customThreshold))
      ? Math.min(CFG.THRESHOLD_MAX, Math.max(CFG.THRESHOLD_MIN, s.customThreshold)) : 0.42;
    CFG.THRESHOLDS['Custom'] = GS.customThreshold;
    GS.difficulty     = s.difficulty     || CFG.DEFAULT_DIFFICULTY;
    if (GS.difficulty === 'Custom' && !CFG.THRESHOLDS['Custom']) {
      CFG.THRESHOLDS['Custom'] = 0.42;
    }
    GS.timerSecs      = s.timerSecs      || CFG.DEFAULT_TIMER;
    GS.livesPerPlayer = s.livesPerPlayer || CFG.DEFAULT_LIVES;
    GS.livePreview    = s.livePreview    !== false;
    GS.soundOn        = s.soundOn        !== false;
    GS.reduceMotion   = s.reduceMotion   || false;
    GS.opponentCount  = s.opponentCount  || 1;
  } catch(_) {}
}

function saveSettings() {
  try {
    localStorage.setItem('wm_settings', JSON.stringify({
      difficulty:      GS.difficulty,
      customThreshold: CFG.THRESHOLDS['Custom'] || GS.customThreshold || 0.42,
      timerSecs:       GS.timerSecs,
      livesPerPlayer:  GS.livesPerPlayer,
      livePreview:     GS.livePreview,
      soundOn:         GS.soundOn,
      reduceMotion:    GS.reduceMotion,
      opponentCount:   GS.opponentCount
    }));
  } catch(_) {}
}

// =============================================================================
// DOM HELPERS
// =============================================================================
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function show(id) { const el = $(id); if (el) el.classList.remove('hidden'); }
function hide(id) { const el = $(id); if (el) el.classList.add('hidden'); }
function setText(id, text) { const el = $(id); if (el) el.textContent = text; }

// =============================================================================
// TOAST NOTIFICATIONS
// =============================================================================
function toast(msg, type = 'info', dur = 3000) {
  const c = $('toast-area'); if (!c) return;
  const d = document.createElement('div');
  d.className = `toast toast-${type}`;
  d.textContent = msg;
  c.appendChild(d);
  requestAnimationFrame(() => d.classList.add('toast-in'));
  setTimeout(() => {
    d.classList.remove('toast-in');
    setTimeout(() => d.remove(), 300);
  }, dur);
}

// =============================================================================
// STATUS PILL
// =============================================================================
function setPill(state, text) {
  const pill = $('status-pill');
  if (!pill) return;
  pill.dataset.state = state; // 'loading'|'preparing'|'ready'|'error'
  pill.querySelector('.pill-text').textContent = text;
  pill.setAttribute('aria-label', `Model status: ${text}`);
}

// =============================================================================
// P0 — NLP MODEL INITIALIZATION
// =============================================================================
async function initModel() {
  setPill('loading', 'Loading model…');
  $('start-btn').disabled = true;
  $('start-btn').title = 'The language model must load first';
  modelError = false;

  try {
    const { pipeline, env } = await import(CFG.CDN);
    env.allowLocalModels = false;
    env.useBrowserCache  = true;

    extractor = await pipeline('feature-extraction', CFG.MODEL_NAME, {
      quantized: true,
      progress_callback: (p) => {
        if (p && p.status === 'progress' && p.progress != null) {
          const pct = Math.round(p.progress);
          setPill('loading', `Loading model ${pct}%`);
        }
      }
    });

    modelReady = true;
    // Start vocabulary warm-up immediately after model is ready
    await warmUpVocabulary();
  } catch (err) {
    console.error('Model failed:', err);
    modelReady  = false;
    modelError  = true;
    warmupDone  = false;
    setPill('error', 'Model failed — Retry');
    $('start-btn').disabled = true;
    $('start-btn').title = 'The language model must load first';
    // Show inline error on front page
    const errEl = $('model-error-msg');
    if (errEl) {
      errEl.textContent = 'Could not load the language model. Check your internet connection, then click "Retry" in the top-right pill.';
      errEl.classList.remove('hidden');
    }
  }
}

// =============================================================================
// P0 — VOCABULARY WARM-UP (embed every word, batched to keep UI responsive)
// =============================================================================
async function warmUpVocabulary() {
  if (!modelReady || !extractor) return;
  setPill('preparing', 'Preparing words 0%');

  const total = VOCABULARY.length;
  for (let i = 0; i < total; i += CFG.WARMUP_BATCH) {
    const batch = VOCABULARY.slice(i, i + CFG.WARMUP_BATCH);
    await Promise.all(batch.map(w => embed(w)));

    const pct = Math.round(((i + batch.length) / total) * 100);
    setPill('preparing', `Preparing words ${pct}%`);

    // Yield to the UI thread
    await new Promise(r => setTimeout(r, 0));
  }

  warmupDone = true;
  setPill('ready', 'Model ready');
  $('start-btn').disabled = false;
  $('start-btn').removeAttribute('title');

  // Pick a smart random start word
  refreshStartWord();
}

// =============================================================================
// EMBEDDING & COSINE SIMILARITY
// =============================================================================
async function embed(word) {
  const w = word.toLowerCase().trim();
  if (!w || !modelReady || !extractor) return null;
  if (embCache.has(w)) return embCache.get(w);
  try {
    const out = await extractor(w, { pooling: 'mean', normalize: true });
    const vec = out.data;
    embCache.set(w, vec);
    return vec;
  } catch (_) { return null; }
}

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA  += a[i] * a[i];
    nB  += b[i] * b[i];
  }
  if (!nA || !nB) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(nA) * Math.sqrt(nB))));
}

// Cosine similarity between two words via neural embeddings
async function wordSim(wA, wB) {
  const [vA, vB] = await Promise.all([embed(wA), embed(wB)]);
  if (!vA || !vB) return null;
  return cosine(vA, vB);
}

// Full evaluation result object
async function evalPair(wordA, wordB) {
  const score = await wordSim(wordA, wordB);
  if (score === null) {
    // Model failed mid-game or not loaded
    return { score: null, isRelated: false, verdict: 'Model error', reason: 'Embedding failed' };
  }
  const thr = getThreshold();
  const isRelated = score >= thr;
  return {
    score: parseFloat(score.toFixed(3)),
    isRelated,
    verdict: isRelated ? 'Related' : 'Not closely related',
    reason: isRelated
      ? `Cosine ${score.toFixed(3)} ≥ threshold ${thr.toFixed(2)}`
      : `Cosine ${score.toFixed(3)} < threshold ${thr.toFixed(2)}`
  };
}

// =============================================================================
// LEMMATIZATION & UNIFIED DUPLICATE CHECKING
// =============================================================================
// Words that must never be stripped (their "base" would be a different real word, or they are not plurals).
const NO_STRIP = new Set(['news','lens','this','gas','bus','plus','bias','chaos','species','series','always','perhaps',
  'evening','morning','ceiling','during','string','spring','bring','thing','nothing','something','anything','everything']);

// Common irregular forms -> base form
const IRREGULAR = {
  mice:'mouse', children:'child', men:'man', women:'woman', feet:'foot', teeth:'tooth', geese:'goose', oxen:'ox', people:'person',
  went:'go', gone:'go', ran:'run', ate:'eat', eaten:'eat', seen:'see', took:'take', taken:'take', came:'come', wrote:'write',
  written:'write', broke:'break', broken:'break', flew:'fly', flown:'fly', drove:'drive', driven:'drive', grew:'grow', grown:'grow',
  knew:'know', known:'know', threw:'throw', thrown:'throw', sang:'sing', sung:'sing', swam:'swim', swum:'swim', fallen:'fall',
  bought:'buy', brought:'bring', caught:'catch', taught:'teach', thought:'think', fought:'fight', built:'build', sold:'sell',
  told:'tell', held:'hold', kept:'keep', slept:'sleep', lost:'lose', paid:'pay', said:'say', sent:'send', spent:'spend',
  stood:'stand', understood:'understand', won:'win', wore:'wear', worn:'wear', woke:'wake', chose:'choose', chosen:'choose',
  spoke:'speak', spoken:'speak', stole:'steal', stolen:'steal', risen:'rise', drank:'drink', drunk:'drink', began:'begin',
  begun:'begin', hid:'hide', hidden:'hide', better:'good', best:'good', worse:'bad', worst:'bad'
};

const _basesCache = new Map();

// Every plausible base form of a word (plural, -ing, -ed, irregular), plus the word itself.
// Two words are treated as the same word if their base sets overlap.
function wordBases(raw) {
  const w = (raw || '').toLowerCase().trim();
  if (_basesCache.has(w)) return _basesCache.get(w);
  const out = new Set([w]);
  const add = s => { if (s && s.length >= 3) out.add(s); };

  if (w.length > 3 && !NO_STRIP.has(w)) {
    // Plurals / 3rd-person -s
    if (w.endsWith('ies') && w.length > 4) { add(w.slice(0, -3) + 'y'); add(w.slice(0, -1)); }          // cities, movies
    else if (w.endsWith('ves'))  { add(w.slice(0, -3) + 'f'); add(w.slice(0, -3) + 'fe'); add(w.slice(0, -1)); } // wolves, knives, leaves
    else if (w.endsWith('es'))   { add(w.slice(0, -2)); add(w.slice(0, -1)); }                          // boxes, glasses, sizes, shoes
    else if (w.endsWith('s') && !w.endsWith('ss')) { add(w.slice(0, -1)); }                             // dogs, topics, menus

    // -ing  (working, making, running)
    if (w.endsWith('ing') && w.length > 5) {
      const stem = w.slice(0, -3);
      add(stem); add(stem + 'e');
      if (stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]) add(stem.slice(0, -1));
    }
    // -ed  (played, liked, stopped, cried)
    if (w.endsWith('ied') && w.length > 4) add(w.slice(0, -3) + 'y');
    else if (w.endsWith('ed') && w.length > 4) {
      const stem = w.slice(0, -2);
      add(stem); add(w.slice(0, -1));
      if (stem.length > 3 && stem[stem.length - 1] === stem[stem.length - 2]) add(stem.slice(0, -1));
    }
  }
  if (IRREGULAR[w]) out.add(IRREGULAR[w]);
  _basesCache.set(w, out);
  return out;
}

function sameWordFamily(a, b) {
  const A = wordBases(a), B = wordBases(b);
  for (const x of A) if (B.has(x)) return true;
  return false;
}

function isWordDuplicate(candWord) {
  if (!candWord) return false;
  const candLower = candWord.toLowerCase().trim();
  for (const used of GS.usedWords) {
    const usedLower = used.toLowerCase().trim();
    if (candLower === usedLower) return true;
    if (sameWordFamily(candLower, usedLower)) return true;
  }
  return false;
}

// =============================================================================
// AI CANDIDATE WORD SELECTION (Full Vocabulary search)
// =============================================================================
async function pickAICandidateWord(aiPlayer, currentWord) {
  const cur = currentWord.toLowerCase().trim();
  const curVec = await embed(cur);
  if (!curVec) return null;

  const thr = getThreshold();
  const scored = [];

  for (const w of VOCABULARY) {
    if (w === cur || isWordDuplicate(w)) continue;
    const wVec = await embed(w);
    if (!wVec) continue;
    const s = cosine(curVec, wVec);
    if (s >= thr) {
      scored.push({ word: w, score: s });
    }
  }

  if (!scored.length) return null;

  scored.sort((a, b) => b.score - a.score);
  // Pool size scales with how many words qualify, so a low threshold gives the AI more variety
  // and a high threshold narrows it to the few strongest links.
  const poolSize = Math.min(scored.length,
    Math.min(CFG.AI_POOL_MAX, Math.max(CFG.AI_POOL_MIN, Math.ceil(scored.length * CFG.AI_POOL_FRACTION))));
  const top = scored.slice(0, poolSize);
  return top[Math.floor(Math.random() * top.length)].word;
}

// =============================================================================
// RANDOM START WORD
// =============================================================================
function pickRandomStartWord() {
  const candidates = VOCABULARY.filter(w => w.length >= 4);
  if (!candidates.length) return VOCABULARY[0] || 'ocean';
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function refreshStartWord() {
  const input = $('start-word-input');
  if (input) input.value = pickRandomStartWord().toUpperCase();
}

// =============================================================================
// PLAYER SETUP
// =============================================================================
function buildPlayers() {
  const players = [{
    id: 'human',
    name: 'You',
    isHuman: true,
    avatar: '👤',
    role: 'Player',
    isAlive: true,
    lives: GS.livesPerPlayer,
    elimReason: null,
    wordCount: 0
  }];
  for (let i = 0; i < GS.opponentCount; i++) {
    const ai = AI_PROFILES[i];
    players.push({
      id: ai.id,
      name: ai.name,
      isHuman: false,
      avatar: ai.avatar,
      role: ai.role,
      isAlive: true,
      lives: GS.livesPerPlayer,
      elimReason: null,
      wordCount: 0
    });
  }
  return players;
}

// =============================================================================
// GAME LIFECYCLE
// =============================================================================
function startGame() {
  clearTimers();
  GS.turnToken++;
  GS.isEval = false;
  GS.isPaused = false;
  GS.hintUsed = false;

  // Reset Hint button UI
  const hintBtn = $('hint-btn');
  if (hintBtn) {
    hintBtn.disabled = false;
    hintBtn.textContent = 'Use hint';
  }

  const rawInput = $('start-word-input');
  let startWord = rawInput ? rawInput.value.trim().toUpperCase() : '';
  if (!startWord || !/^[A-Z]+$/.test(startWord)) {
    startWord = pickRandomStartWord().toUpperCase();
  }

  // Read opponent count from the toggle buttons
  const oppBtns = $$('#opp-count-group .toggle-btn');
  oppBtns.forEach(b => { if (b.classList.contains('active')) GS.opponentCount = parseInt(b.dataset.val, 10); });

  // Read difficulty from toggle
  const diffBtns = $$('#difficulty-group .toggle-btn');
  diffBtns.forEach(b => { if (b.classList.contains('active')) GS.difficulty = b.dataset.val; });
  if (GS.difficulty === 'Custom' && !CFG.THRESHOLDS['Custom']) {
    CFG.THRESHOLDS['Custom'] = GS.customThreshold || 0.42;
  }
  GS.lockedThreshold = resolveThreshold();   // frozen for the whole game

  GS.status         = 'playing';
  GS.currentWord    = startWord;
  GS.usedWords      = new Set([startWord.toLowerCase()]);
  GS.chainHistory   = [{ word: startWord, submitter: 'Start', score: 1, isHuman: false, round: 1 }];
  GS.players        = buildPlayers();
  GS.activeIdx      = 0;
  GS.round          = 1;
  GS.peakSim        = 0;
  GS.humanWordCount = 0;
  GS.totalSim       = 0;
  GS.simCount       = 0;
  GS.eliminations   = [];

  show('battle-screen'); hide('start-screen'); hide('gameover-modal');

  renderChain();
  startTurn();
}

function resetToLobby() {
  clearTimers();
  GS.turnToken++;
  GS.status = 'lobby';
  GS.lockedThreshold = null;
  GS.isPaused = false;
  GS.hintUsed = false;

  const hintBtn = $('hint-btn');
  if (hintBtn) {
    hintBtn.disabled = false;
    hintBtn.textContent = 'Use hint';
  }

  hide('battle-screen'); hide('gameover-modal'); show('start-screen');
  refreshStartWord();
  renderLobbyRoster();
  syncDifficultyUI();
}

// =============================================================================
// TURN MANAGEMENT
// =============================================================================
function clearTimers() {
  if (GS.timerId)   { clearInterval(GS.timerId);   GS.timerId   = null; }
  if (GS.aiTimerId) { clearTimeout(GS.aiTimerId);  GS.aiTimerId = null; }
}

function resumeTimer(player) {
  clearTimers();
  if (GS.status !== 'playing' || !player || !player.isAlive) return;
  GS.timerLeft = GS.timerLeft > 0 ? GS.timerLeft : GS.timerSecs;
  updateTimerRing(GS.timerLeft, GS.timerSecs);
  GS.timerId = setInterval(() => {
    if (GS.isPaused) return;
    GS.timerLeft--;
    updateTimerRing(GS.timerLeft, GS.timerSecs);
    if (GS.timerLeft <= 3 && GS.timerLeft > 0) beep('tick');
    if (GS.timerLeft <= 0) {
      clearTimers();
      loseLife(player, 'Timeout');
    }
  }, 1000);
}

function startTurn() {
  clearTimers();
  const token = ++GS.turnToken;
  GS.isEval = false;

  const player = GS.players[GS.activeIdx];
  if (!player || !player.isAlive) { nextPlayer(); return; }
  if (checkGameOver()) return;

  // Update battle header
  setText('battle-word', GS.currentWord);
  setText('battle-round', `Round ${GS.round}`);
  renderPlayerCards();
  resetJudge();
  previewSeq++;
  { const pv = $('live-preview'); if (pv) { pv.textContent = ''; pv.className = 'live-preview'; } }

  // Reset and start countdown timer
  GS.timerLeft = GS.timerSecs;
  resumeTimer(player);

  const turnBar = $('turn-bar');
  const humanPanel  = $('human-panel');
  const aiPanel     = $('ai-panel');
  const humanInput  = $('word-input');
  const submitBtn   = $('submit-btn');
  const inputErr    = $('input-error');

  if (inputErr) { inputErr.textContent = ''; inputErr.classList.add('hidden'); }

  if (player.isHuman) {
    if (turnBar) { turnBar.textContent = 'Your turn'; turnBar.setAttribute('aria-live', 'polite'); }
    show('human-panel'); hide('ai-panel');
    if (humanInput) { humanInput.value = ''; humanInput.disabled = false; humanInput.focus(); }
    if (submitBtn) submitBtn.disabled = true; // enabled when input non-empty
    beep('turn');
  } else {
    if (turnBar) turnBar.textContent = `${player.name} is thinking…`;
    hide('human-panel'); show('ai-panel');
    setText('ai-name', `${player.avatar} ${player.name}`);
    scheduleAITurn(player, token);
  }
}

function nextPlayer() {
  if (checkGameOver()) return;
  const total = GS.players.length;
  let idx = (GS.activeIdx + 1) % total;
  let loops = 0;
  while (!GS.players[idx].isAlive && loops < total) { idx = (idx + 1) % total; loops++; }
  if (idx <= GS.activeIdx) GS.round++;
  GS.activeIdx = idx;
  startTurn();
}

// =============================================================================
// TIMER RING
// =============================================================================
function updateTimerRing(sec, total) {
  setText('timer-text', `${Math.max(0, sec)}s`);
  const circle = $('timer-ring');
  if (!circle) return;
  const circ = 138.2; // 2π×22
  const frac = Math.max(0, sec) / total;
  circle.style.strokeDashoffset = circ * (1 - frac);
  circle.classList.remove('ring-warn', 'ring-danger');
  if (sec <= 3)      circle.classList.add('ring-danger');
  else if (sec <= 6) circle.classList.add('ring-warn');
}

// =============================================================================
// P0 — AI TURN EXECUTION
// =============================================================================
function scheduleAITurn(player, token) {
  const currentToken = token || GS.turnToken;
  const delay = CFG.AI_THINK_MIN + Math.random() * (CFG.AI_THINK_MAX - CFG.AI_THINK_MIN);
  GS.aiTimerId = setTimeout(async () => {
    if (currentToken !== GS.turnToken || GS.status !== 'playing' || GS.players[GS.activeIdx] !== player) return;
    clearTimers();
    const word = await pickAICandidateWord(player, GS.currentWord);
    // Double check state after async search
    if (currentToken !== GS.turnToken || GS.status !== 'playing' || GS.players[GS.activeIdx] !== player) return;
    if (!word) {
      loseLife(player, 'No qualifying word found');
    } else {
      await processSubmission(player, word);
    }
  }, delay);
}

// =============================================================================
// WORD SUBMISSION PIPELINE
// =============================================================================
async function processSubmission(player, rawWord) {
  if (GS.isEval) return;
  GS.isEval = true;
  clearTimers();

  const submitted = rawWord.trim().toLowerCase();

  // 1. Lexical validation — does NOT cost a life for human
  if (!/^[a-z]+$/.test(submitted) || submitted.length < CFG.MIN_WORD_LEN) {
    if (player.isHuman) {
      showInputError('Enter a word (letters only, 3+ characters)');
      GS.isEval = false;
      resumeTimer(player);
      return;
    }
    loseLife(player, 'Invalid word');
    return;
  }

  // 2. Duplicate check using unified isWordDuplicate
  if (isWordDuplicate(submitted)) {
    showJudge(GS.currentWord, submitted, 1.0, 'Duplicate word', false);
    beep('eliminate');
    loseLife(player, `Duplicate: "${submitted.toUpperCase()}"`);
    return;
  }

  // 3. Semantic evaluation
  const r = await evalPair(GS.currentWord.toLowerCase(), submitted);

  // Model error handling — DO NOT lose a life for embedding/network glitches
  if (r.score === null || r.verdict === 'Model error') {
    toast('Embedding error — please retry submission', 'error');
    GS.isEval = false;
    if (player.isHuman) {
      const humanInput = $('word-input');
      if (humanInput) { humanInput.disabled = false; humanInput.focus(); }
      resumeTimer(player);
    } else {
      setTimeout(() => { if (GS.status === 'playing') scheduleAITurn(player); }, 1000);
    }
    return;
  }

  showJudge(GS.currentWord, submitted, r.score, r.verdict, r.isRelated);

  // Track similarity stats
  GS.simCount++;
  GS.totalSim += r.score;
  if (r.score > GS.peakSim) GS.peakSim = r.score;

  if (r.isRelated) {
    // SUCCESS
    beep('success');
    GS.usedWords.add(submitted);
    player.wordCount++;
    if (player.isHuman) GS.humanWordCount++;

    GS.chainHistory.push({
      word: submitted.toUpperCase(),
      submitter: player.name,
      score: r.score,
      isHuman: player.isHuman,
      round: GS.round
    });
    renderChain();
    GS.currentWord = submitted.toUpperCase();
    const wordEl = $('battle-word');
    if (wordEl) {
      wordEl.classList.remove('pop-anim');
      void wordEl.offsetWidth;
      wordEl.textContent = GS.currentWord;
      wordEl.classList.add('pop-anim');
    } else {
      setText('battle-word', GS.currentWord);
    }

    setTimeout(() => { if (GS.status === 'playing') nextPlayer(); }, 1600);
  } else {
    // FAILURE
    beep('eliminate');
    if (player.isHuman) showMissSuggestions(GS.currentWord);
    loseLife(player, `Unrelated (${r.score.toFixed(2)} < ${getThreshold().toFixed(2)})`);
  }
}

// Show nearest neighbours as hints after failure (Full Vocabulary search)
async function showMissSuggestions(currentWord) {
  const box = $('miss-suggestions');
  if (!box || !warmupDone) return;
  box.classList.remove('hidden');
  setText('miss-word', currentWord.toUpperCase());
  const listEl = $('miss-list');
  if (listEl) listEl.textContent = 'Finding suggestions…';

  const cur = currentWord.toLowerCase().trim();
  const curVec = await embed(cur);
  if (!curVec) return;

  const thr = getThreshold();
  const results = [];
  for (const w of VOCABULARY) {
    if (w === cur || isWordDuplicate(w)) continue;
    const wVec = await embed(w);
    if (!wVec) continue;
    const s = cosine(curVec, wVec);
    if (s >= thr) results.push({ word: w, score: s });
  }

  results.sort((a, b) => b.score - a.score);
  const top3 = results.slice(0, 3);
  if (listEl) {
    if (top3.length > 0) {
      listEl.innerHTML = top3.map(r => `<span class="suggestion-chip">${r.word} <em>${r.score.toFixed(2)}</em></span>`).join('');
    } else {
      listEl.textContent = 'No qualifying words remaining in vocabulary.';
    }
  }
}

// =============================================================================
// LIVES SYSTEM
// =============================================================================
function loseLife(player, reason) {
  player.lives--;
  renderPlayerCards();

  if (player.lives <= 0) {
    player.isAlive = false;
    player.elimReason = reason;
    GS.eliminations.push({ name: player.name, isHuman: player.isHuman, round: GS.round, reason });
    renderPlayerCards();
    toast(`${player.name} eliminated — ${reason}`, 'error');
    beep('eliminate');

    if (player.isHuman) {
      setTimeout(() => endGame(false), 1500);
    } else {
      if (checkGameOver()) return;
      setTimeout(() => { if (GS.status === 'playing') nextPlayer(); }, 1500);
    }
  } else {
    // Still has lives — continue same player's turn
    toast(`${player.name} lost a life (${player.lives} left) — ${reason}`, 'warn', 2500);
    if (player.isHuman) {
      GS.isEval = false;
      const humanInput = $('word-input');
      if (humanInput) { humanInput.value = ''; humanInput.disabled = false; humanInput.focus(); }
      resumeTimer(player);
    } else {
      // AI lost a life — advance to next player
      if (checkGameOver()) return;
      setTimeout(() => { if (GS.status === 'playing') nextPlayer(); }, 1500);
    }
  }
}

function checkGameOver() {
  if (GS.status !== 'playing') return true;
  const human  = GS.players.find(p => p.isHuman);
  const aliveAI = GS.players.filter(p => !p.isHuman && p.isAlive);

  if (!human || !human.isAlive) { endGame(false); return true; }
  if (aliveAI.length === 0)     { endGame(true);  return true; }
  return false;
}

// =============================================================================
// GAME OVER
// =============================================================================
function endGame(win) {
  clearTimers();
  GS.status = 'gameover';

  // Semantic drift: cosine between first and last word embeddings
  async function computeDrift() {
    const chain = GS.chainHistory;
    if (chain.length < 2) return '—';
    const first = chain[0].word.toLowerCase();
    const last  = chain[chain.length - 1].word.toLowerCase();
    const s = await wordSim(first, last);
    return s !== null ? s.toFixed(3) : '—';
  }

  computeDrift().then(drift => {
    const avgSim = GS.simCount > 0 ? (GS.totalSim / GS.simCount).toFixed(3) : '—';

    setText('result-headline',  win ? 'Victory!' : 'Game Over');
    setText('result-msg', win
      ? 'You outlasted all AI players!'
      : GS.players.find(p => p.isHuman)?.elimReason || 'You were eliminated.');
    setText('stat-rounds',  GS.round);
    setText('stat-words',   GS.chainHistory.length);
    setText('stat-human-words', GS.humanWordCount);
    setText('stat-avg-sim', avgSim);
    setText('stat-peak-sim', GS.peakSim > 0 ? GS.peakSim.toFixed(3) : '—');
    setText('stat-drift',    drift);

    // Elimination timeline
    const tl = $('elim-timeline');
    if (tl) {
      tl.innerHTML = GS.eliminations.length
        ? GS.eliminations.map(e => `<div class="elim-row"><span>${e.isHuman ? '👤' : '🤖'} ${e.name}</span><span class="elim-reason">Round ${e.round}: ${e.reason}</span></div>`).join('')
        : '<div class="elim-row muted">No eliminations.</div>';
    }

    // Final word chain chips with colored bands
    const chainWrap = $('final-chain');
    if (chainWrap) {
      const thr = getThreshold();
      chainWrap.innerHTML = GS.chainHistory.map((n, i) => {
        let cls = 'chain-chip';
        if (i === 0) cls += ' chip-start';
        else if (n.score >= thr + 0.15) cls += ' chip-green';
        else if (n.score >= thr + 0.05) cls += ' chip-amber';
        else cls += ' chip-red';
        return `<span class="${cls}" title="${n.submitter} (${n.score.toFixed(2)})">${i+1}. ${n.word}</span>`;
      }).join('');
    }

    const modal = $('gameover-modal');
    if (modal) { modal.classList.remove('hidden'); if (win) beep('victory'); }

    // PCA scatter plot
    drawPCAPlot();
  });
}

// =============================================================================
// PCA SCATTER PLOT (game-over screen)
// =============================================================================
async function drawPCAPlot() {
  const canvas = $('pca-canvas');
  if (!canvas || !modelReady) return;
  const words = GS.chainHistory.map(n => n.word.toLowerCase());
  const vecs  = await Promise.all(words.map(w => embed(w)));
  const valid = vecs.map((v, i) => ({ v, w: GS.chainHistory[i].word, score: GS.chainHistory[i].score, isHuman: GS.chainHistory[i].isHuman }))
                    .filter(x => x.v);
  if (valid.length < 2) return;

  const X = valid.map(x => Array.from(x.v)); // n × 384
  const n = X.length, d = X[0].length;

  // Mean center
  const mean = new Array(d).fill(0);
  X.forEach(row => row.forEach((v, j) => mean[j] += v / n));
  const C = X.map(row => row.map((v, j) => v - mean[j]));

  // Power iteration for 2 principal components
  function powerIter(mat, iters = 50) {
    let v = new Array(d).fill(0).map((_, k) => Math.sin(k * 12.9898 + 1.0));   // deterministic start
    for (let it = 0; it < iters; it++) {
      const proj = mat.map(row => row.reduce((s, x, j) => s + x * v[j], 0));
      const result = new Array(d).fill(0);
      mat.forEach((row, i) => row.forEach((x, j) => result[j] += proj[i] * x));
      const norm = Math.sqrt(result.reduce((s, x) => s + x * x, 0));
      v = result.map(x => x / (norm || 1));
    }
    return v;
  }

  const pc1 = powerIter(C);
  const C2 = C.map(row => {
    const dot = row.reduce((s, x, j) => s + x * pc1[j], 0);
    return row.map((x, j) => x - dot * pc1[j]);
  });
  const pc2 = powerIter(C2);

  // Project
  const pts = C.map(row => ({
    x: row.reduce((s, x, j) => s + x * pc1[j], 0),
    y: row.reduce((s, x, j) => s + x * pc2[j], 0)
  }));

  // Draw
  const ctx  = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth  || 400;
  const H = canvas.offsetHeight || 260;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const PAD = 32;

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rx = (maxX - minX) || 1, ry = (maxY - minY) || 1;

  // Same scale on both axes so on-screen distances are not stretched differently per axis
  const scale = Math.min((W - 2 * PAD - 60) / rx, (H - 2 * PAD) / ry);
  const offX = (W - 60 - rx * scale) / 2, offY = (H - ry * scale) / 2;
  const toCanvas = p => ({
    cx: offX + (p.x - minX) * scale,
    cy: offY + (p.y - minY) * scale
  });
  const canvasPts = pts.map(toCanvas);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // Draw connecting lines coloured by similarity tier
  const thr = getThreshold();
  for (let i = 1; i < canvasPts.length; i++) {
    const score = valid[i].score;
    let strokeCol;
    if (score >= thr + 0.15) {
      strokeCol = '#22c55e'; // Green: strong link
    } else if (score >= thr + 0.05) {
      strokeCol = '#f59e0b'; // Amber: moderate link
    } else {
      strokeCol = '#ef4444'; // Red: close to threshold
    }
    ctx.beginPath();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 2;
    ctx.moveTo(canvasPts[i-1].cx, canvasPts[i-1].cy);
    ctx.lineTo(canvasPts[i].cx,   canvasPts[i].cy);
    ctx.stroke();
  }

  // Draw points and labels
  canvasPts.forEach((cp, i) => {
    const isHuman = !!valid[i].isHuman;
    ctx.beginPath();
    ctx.arc(cp.cx, cp.cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#7c3aed' : (isHuman ? '#22d3ee' : '#94a3b8');
    ctx.fill();

    ctx.fillStyle = '#e6edf3';
    ctx.font = '11px system-ui, sans-serif';
    const label = valid[i].w.toUpperCase();
    const tw = ctx.measureText(label).width;
    const flip = cp.cx + 7 + tw > W - 4;                 // keep labels inside the canvas
    ctx.fillText(label, flip ? cp.cx - 7 - tw : cp.cx + 7, cp.cy + (i % 2 ? 14 : -6));
  });
}

// =============================================================================
// JUDGE UI
// =============================================================================
function resetJudge() {
  const j = $('judge-card');
  if (!j) return;
  j.querySelector('.judge-prev').textContent = GS.currentWord;
  j.querySelector('.judge-sub').textContent  = '—';
  j.querySelector('.judge-score').textContent = '—';
  const bar = j.querySelector('.judge-bar-fill');
  if (bar) bar.style.width = '0%';
  const pill = j.querySelector('.verdict-pill');
  if (pill) { pill.textContent = 'Awaiting'; pill.className = 'verdict-pill'; }
  // Position threshold needle based on current difficulty
  const marker = $('judge-threshold-marker');
  const thr = getThreshold();
  if (marker) marker.style.left = `${Math.round(thr * 100)}%`;
  hide('miss-suggestions');
}

function showJudge(prev, sub, score, verdict, isPass) {
  const j = $('judge-card');
  if (!j) return;
  j.querySelector('.judge-prev').textContent  = prev.toUpperCase();
  j.querySelector('.judge-sub').textContent   = sub.toUpperCase();
  j.querySelector('.judge-score').textContent = (typeof score === 'number') ? score.toFixed(3) : '—';
  const bar = j.querySelector('.judge-bar-fill');
  if (bar) bar.style.width = `${Math.min(100, Math.round((score || 0) * 100))}%`;
  const pill = j.querySelector('.verdict-pill');
  if (pill) {
    pill.textContent = verdict;
    pill.className   = `verdict-pill ${isPass ? 'verdict-pass' : 'verdict-fail'}`;
    pill.setAttribute('aria-live', 'polite');
  }
}

// =============================================================================
// LIVE PREVIEW
// =============================================================================
function onHumanInput(e) {
  const input  = e.target;
  const sub    = $('submit-btn');
  const val    = input.value.trim();
  if (sub) sub.disabled = val.length < 1;

  clearTimeout(livePreviewDebounce);
  const previewEl = $('live-preview');
  const seq = ++previewSeq;
  const clearPreview = () => { if (previewEl) { previewEl.textContent = ''; previewEl.className = 'live-preview'; } };
  const word0 = val.toLowerCase();
  if (!new RegExp('^[a-z]{' + CFG.MIN_WORD_LEN + ',}$').test(word0)) { clearPreview(); return; }
  if (!GS.livePreview || getThreshold() >= CFG.PREVIEW_MAX_THRESHOLD || !warmupDone) { clearPreview(); return; }

  livePreviewDebounce = setTimeout(async () => {
    const word = word0;
    if (!previewEl) return;

    // Check duplicate first
    if (isWordDuplicate(word)) {
      previewEl.textContent = 'Already used';
      previewEl.className   = 'live-preview preview-dup';
      return;
    }

    const r = await evalPair(GS.currentWord.toLowerCase(), word);
    if (seq !== previewSeq) return;            // a newer keystroke superseded this result
    if (r.score === null) return;
    previewEl.className = `live-preview ${r.isRelated ? 'preview-ok' : 'preview-bad'}`;
    previewEl.textContent = `${r.score.toFixed(2)} — ${r.isRelated ? 'Close enough' : 'Too far'}`;
  }, 300);
}

// =============================================================================
// WORD CHAIN RENDERING (Colored bands)
// =============================================================================
function renderChain() {
  const container = $('chain-display');
  if (!container) return;
  const thr = getThreshold();
  container.innerHTML = GS.chainHistory.map((n, i) => {
    const score = n.score;
    let cls = 'chain-chip';
    if (i > 0) {
      if (score >= thr + 0.15) {
        cls += ' chip-green';
      } else if (score >= thr + 0.05) {
        cls += ' chip-amber';
      } else {
        cls += ' chip-red';
      }
    } else {
      cls += ' chip-start';
    }
    return `<span class="${cls}" title="${n.submitter} — ${score.toFixed(2)}">${n.word}</span>`;
  }).join('<span class="chain-arrow">›</span>');

  // Scroll to end
  container.scrollLeft = container.scrollWidth;

  // Update chain count
  setText('chain-count', `${GS.chainHistory.length}`);
}

// =============================================================================
// PLAYER CARDS RENDERING
// =============================================================================
function renderPlayerCards() {
  const container = $('players-sidebar');
  if (!container) return;
  container.innerHTML = GS.players.map((p, idx) => {
    const isActive = idx === GS.activeIdx && GS.status === 'playing';
    const hearts   = p.isAlive ? '♥'.repeat(p.lives) + '♡'.repeat(Math.max(0, GS.livesPerPlayer - p.lives)) : '—';
    return `<div class="player-card ${isActive ? 'player-active' : ''} ${!p.isAlive ? 'player-out' : ''}">
      <span class="player-avatar">${p.avatar}</span>
      <div class="player-info">
        <span class="player-name">${p.name}</span>
        <span class="player-tag ${p.isHuman ? 'tag-human' : 'tag-ai'}">${p.isHuman ? 'You' : 'AI'}</span>
      </div>
      <span class="player-hearts" title="${p.lives} lives">${hearts}</span>
    </div>`;
  }).join('');

  const alive = GS.players.filter(p => p.isAlive).length;
  setText('alive-count', `${alive} alive`);
}

// =============================================================================
// LOBBY ROSTER PREVIEW
// =============================================================================
function renderLobbyRoster() {
  const list = $('lobby-roster');
  if (!list) return;
  let oppCount = GS.opponentCount;
  const oppBtns = $$('#opp-count-group .toggle-btn');
  oppBtns.forEach(b => { if (b.classList.contains('active')) oppCount = parseInt(b.dataset.val, 10); });

  const rows = [{ avatar: '👤', name: 'You', tag: 'You', isHuman: true }];
  for (let i = 0; i < oppCount; i++) rows.push({ ...AI_PROFILES[i], tag: 'AI', isHuman: false });

  list.innerHTML = rows.map(r => `
    <div class="lobby-player-row">
      <span class="lobby-avatar">${r.avatar}</span>
      <span class="lobby-name">${r.name}</span>
      <span class="lobby-tag ${r.isHuman ? 'tag-human' : 'tag-ai'}">${r.tag}</span>
    </div>`).join('');
}

// =============================================================================
// INPUT ERROR DISPLAY
// =============================================================================
function showInputError(msg) {
  const el = $('input-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

// =============================================================================
// SETTINGS & DIFFICULTY SYNCHRONIZATION
// =============================================================================
function syncDifficultyUI() {
  const thr = getThreshold();
  setText('custom-threshold-val', (CFG.THRESHOLDS['Custom'] || GS.customThreshold || 0.42).toFixed(2));
  setText('lobby-custom-val', (CFG.THRESHOLDS['Custom'] || GS.customThreshold || 0.42).toFixed(2));
  const slider = $('custom-threshold');
  if (slider) slider.value = (CFG.THRESHOLDS['Custom'] || GS.customThreshold || 0.42);

  // Sync lobby difficulty toggle group
  $$('#difficulty-group .toggle-btn').forEach(b => {
    const isAct = b.dataset.val === GS.difficulty;
    b.classList.toggle('active', isAct);
    b.setAttribute('aria-pressed', isAct ? 'true' : 'false');
  });

  const hintEl = $('diff-hint');
  if (hintEl) {
    hintEl.textContent = `Easy ≥ 0.35 · Normal ≥ 0.42 · Hard ≥ 0.50 · Custom ≥ ${(CFG.THRESHOLDS['Custom'] || 0.42).toFixed(2)} cosine similarity`;
  }
}

function openSettings(defaultTab = 'game') {
  const modal = $('settings-modal');
  if (!modal) return;

  // Pause turn timer if playing
  if (GS.status === 'playing') {
    GS.isPaused = true;
    if (GS.timerId) { clearInterval(GS.timerId); GS.timerId = null; }
  }

  syncSettingsForm();
  modal.classList.remove('hidden');
  switchSettingsTab(defaultTab);

}

function closeSettings() {
  hide('settings-modal');
  applySettingsFromForm();
  saveSettings();
  syncDifficultyUI();

  // Resume turn timer if playing
  if (GS.status === 'playing' && GS.isPaused) {
    GS.isPaused = false;
    const player = GS.players[GS.activeIdx];
    if (player && player.isAlive) {
      if (player.isHuman) {
        resumeTimer(player);
      }
    }
  }
}

function switchSettingsTab(tab) {
  $$('#settings-modal .tab-btn').forEach(b => b.classList.toggle('tab-active', b.dataset.tab === tab));
  $$('#settings-modal .tab-pane').forEach(p => p.classList.toggle('hidden', p.id !== `tab-${tab}`));
}

function syncSettingsForm() {
  // Timer
  $$('#settings-timer-group .toggle-btn').forEach(b => {
    const isAct = parseInt(b.dataset.val, 10) === GS.timerSecs;
    b.classList.toggle('active', isAct);
    b.setAttribute('aria-pressed', isAct ? 'true' : 'false');
  });
  // Lives
  $$('#settings-lives-group .toggle-btn').forEach(b => {
    const isAct = parseInt(b.dataset.val, 10) === GS.livesPerPlayer;
    b.classList.toggle('active', isAct);
    b.setAttribute('aria-pressed', isAct ? 'true' : 'false');
  });
  // Toggles
  const prevToggle = $('setting-preview');
  if (prevToggle) prevToggle.checked = GS.livePreview;
  const soundToggle = $('setting-sound');
  if (soundToggle) soundToggle.checked = GS.soundOn;
  const motionToggle = $('setting-motion');
  if (motionToggle) motionToggle.checked = GS.reduceMotion;
  // Threshold slider
  const customVal = CFG.THRESHOLDS['Custom'] || GS.customThreshold || 0.42;
  const slider = $('custom-threshold');
  const locked = GS.status === 'playing';
  if (slider) {
    slider.disabled = locked;
    slider.value = locked ? GS.lockedThreshold : customVal;
    setText('custom-threshold-val', (locked ? GS.lockedThreshold : customVal).toFixed(2));
  }
  const lockNote = $('custom-lock-note');
  if (lockNote) lockNote.classList.toggle('hidden', !locked);
  // NLP Lab
  updateNlpLabInfo();
}

function applySettingsFromForm() {
  $$('#settings-timer-group .toggle-btn').forEach(b => { if (b.classList.contains('active')) GS.timerSecs = parseInt(b.dataset.val, 10); });
  $$('#settings-lives-group .toggle-btn').forEach(b => { if (b.classList.contains('active')) GS.livesPerPlayer = parseInt(b.dataset.val, 10); });
  const prevToggle = $('setting-preview');
  if (prevToggle) GS.livePreview = prevToggle.checked;
  const soundToggle = $('setting-sound');
  if (soundToggle) GS.soundOn = soundToggle.checked;
  const motionToggle = $('setting-motion');
  if (motionToggle) {
    GS.reduceMotion = motionToggle.checked;
    document.body.classList.toggle('reduce-motion', GS.reduceMotion);
  }
}

function updateNlpLabInfo() {
  setText('lab-model-name',  CFG.MODEL_NAME);
  setText('lab-vocab-size',  VOCABULARY.length);
  setText('lab-status',      warmupDone ? 'Ready' : (modelReady ? 'Warming up…' : 'Loading…'));
  setText('lab-runtime',     'WebAssembly / Transformers.js');
  const marker = $('lab-threshold-marker');
  const thr = getThreshold();
  if (marker) marker.style.left = `${Math.round(thr * 100)}%`;
}

// =============================================================================
// NLP LAB — WORD PAIR TESTER
// =============================================================================
async function runWordPairTest() {
  const w1 = ($('lab-word-1').value || '').trim().toLowerCase();
  const w2 = ($('lab-word-2').value || '').trim().toLowerCase();
  if (!w1 || !w2) return;
  const btn = $('lab-compare-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Computing…'; }

  const r = await evalPair(w1, w2);
  setText('lab-pair-score', r.score !== null ? r.score.toFixed(3) : 'Error');
  const bar = $('lab-pair-bar');
  if (bar) bar.style.width = `${Math.min(100, Math.round((r.score || 0) * 100))}%`;
  const verdict = $('lab-pair-verdict');
  if (verdict) { verdict.textContent = r.verdict; verdict.className = `verdict-pill ${r.isRelated ? 'verdict-pass' : 'verdict-fail'}`; }

  if (btn) { btn.disabled = false; btn.textContent = 'Compare'; }
}

// =============================================================================
// NLP LAB — NEAREST NEIGHBOURS
// =============================================================================
async function runNearestNeighbours() {
  const input = $('lab-nn-input');
  if (!input) return;
  const word = input.value.trim().toLowerCase();
  if (!word) return;
  const btn = $('lab-nn-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Finding…'; }

  const wordVec = await embed(word);
  const results = [];
  if (wordVec) {
    for (const w of VOCABULARY) {
      if (w === word) continue;
      const wVec = await embed(w);
      if (!wVec) continue;
      const s = cosine(wordVec, wVec);
      results.push({ word: w, score: s });
    }
  }
  results.sort((a, b) => b.score - a.score);
  const top10 = results.slice(0, 10);

  const listEl = $('lab-nn-results');
  if (listEl) {
    listEl.innerHTML = top10.map(r =>
      `<div class="nn-row"><span class="nn-word">${r.word}</span><span class="nn-score">${r.score.toFixed(3)}</span></div>`
    ).join('');
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Find top 10'; }
}

// =============================================================================
// EVALUATION BENCHMARK
// =============================================================================
async function runEvaluation() {
  if (!modelReady) { toast('Model not ready yet', 'error'); return; }
  const btn = $('eval-run-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }

  const thresholds = [];
  for (let k = 0; k <= 10; k++) thresholds.push(parseFloat((0.20 + k * 0.05).toFixed(2)));

  // Compute all pair scores once
  const pairScores = await Promise.all(EVAL_PAIRS.map(async p => {
    const s = await wordSim(p.w1, p.w2);
    return { ...p, modelScore: s !== null ? s : 0 };
  }));

  // Character-level Jaccard baseline
  function jaccard(a, b) {
    const sA = new Set(a.split('')), sB = new Set(b.split(''));
    let inter = 0;
    for (const c of sA) if (sB.has(c)) inter++;
    return inter / (sA.size + sB.size - inter);
  }
  const pairJaccard = pairScores.map(p => ({ ...p, jaccScore: jaccard(p.w1, p.w2) }));

  function computeMetrics(scores, labelKey) {
    return thresholds.map(thr => {
      let tp=0, fp=0, tn=0, fn=0;
      scores.forEach(p => {
        const pred = p[labelKey] >= thr ? 1 : 0;
        if (pred === 1 && p.label === 1) tp++;
        else if (pred === 1 && p.label === 0) fp++;
        else if (pred === 0 && p.label === 0) tn++;
        else fn++;
      });
      const acc = (tp+tn)/scores.length;
      const prec = (tp+fp) > 0 ? tp/(tp+fp) : 0;
      const rec  = (tp+fn) > 0 ? tp/(tp+fn) : 0;
      const f1   = (prec+rec) > 0 ? 2*prec*rec/(prec+rec) : 0;
      return { thr, acc, prec, rec, f1 };
    });
  }

  const modelRows   = computeMetrics(pairScores,   'modelScore');
  const baselineRows = computeMetrics(pairJaccard, 'jaccScore');

  const bestModel   = modelRows.reduce((a, b) => b.f1 > a.f1 ? b : a);
  const bestBaseline = baselineRows.reduce((a, b) => b.f1 > a.f1 ? b : a);

  // Render table
  const tbody = $('eval-tbody');
  if (tbody) {
    tbody.innerHTML = thresholds.map((thr, i) => {
      const m = modelRows[i];
      const b = baselineRows[i];
      const isBest = thr === bestModel.thr;
      return `<tr class="${isBest ? 'eval-best-row' : ''}">
        <td>${thr.toFixed(2)}</td>
        <td>${(m.acc*100).toFixed(0)}%</td>
        <td>${(m.prec*100).toFixed(0)}%</td>
        <td>${(m.rec*100).toFixed(0)}%</td>
        <td><strong>${m.f1.toFixed(2)}</strong></td>
        <td class="muted">${(b.acc*100).toFixed(0)}%</td>
        <td class="muted">${b.f1.toFixed(2)}</td>
      </tr>`;
    }).join('');
  }

  setText('eval-conclusion', `Best threshold: ${bestModel.thr.toFixed(2)} (F1 ${bestModel.f1.toFixed(2)}) — Baseline best: ${bestBaseline.thr.toFixed(2)} (F1 ${bestBaseline.f1.toFixed(2)})`);
  show('eval-results');

  // Download CSV
  const csvBtn = $('eval-download-btn');
  if (csvBtn) {
    csvBtn.classList.remove('hidden');
    csvBtn.onclick = () => {
      const header = 'Threshold,Accuracy,Precision,Recall,F1,Baseline Accuracy,Baseline F1\n';
      const rows   = thresholds.map((thr, i) => {
        const m = modelRows[i], b = baselineRows[i];
        return `${thr.toFixed(2)},${m.acc.toFixed(3)},${m.prec.toFixed(3)},${m.rec.toFixed(3)},${m.f1.toFixed(3)},${b.acc.toFixed(3)},${b.f1.toFixed(3)}`;
      }).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'wordmind_eval.csv'; a.click();
    };
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Run evaluation'; }
}

// =============================================================================
// EVENT LISTENERS & INITIALIZATION
// =============================================================================
window.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  // Apply reduce-motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches || GS.reduceMotion) document.body.classList.add('reduce-motion');

  // Helper for toggle group activation
  function activateToggle(groupSelector, clickedBtn) {
    $$(groupSelector + ' .toggle-btn').forEach(x => {
      x.classList.remove('active');
      x.setAttribute('aria-pressed', 'false');
    });
    clickedBtn.classList.add('active');
    clickedBtn.setAttribute('aria-pressed', 'true');
  }

  // Reflect the saved sound setting on the header button
  $('sound-btn').setAttribute('aria-pressed', GS.soundOn);
  $('sound-btn').title = GS.soundOn ? 'Sound on' : 'Sound off';

  // Init random start word and lobby views
  refreshStartWord();
  renderLobbyRoster();
  syncDifficultyUI();

  // ---- Status Pill: open NLP Lab or retry on error ----
  $('status-pill').addEventListener('click', () => {
    if (modelError) { modelError = false; initModel(); return; }
    openSettings('nlp');
  });

  // ---- Sound Toggle (header) ----
  $('sound-btn').addEventListener('click', () => {
    GS.soundOn = !GS.soundOn;
    $('sound-btn').setAttribute('aria-pressed', GS.soundOn);
    $('sound-btn').title = GS.soundOn ? 'Sound on' : 'Sound off';
    beep('turn');
    saveSettings();
  });

  // ---- Settings gear & Help buttons ----
  $('settings-btn').addEventListener('click', () => openSettings('game'));
  $('help-btn').addEventListener('click', () => openSettings('game'));

  // ---- Settings modal: Escape + focus trap (registered once, only visible controls) ----
  $('settings-modal').addEventListener('keydown', e => {
    const modal = $('settings-modal');
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') { closeSettings(); return; }
    if (e.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button, input, select, summary, [tabindex="0"]')]
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ---- Settings modal tabs ----
  $$('#settings-modal .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSettingsTab(btn.dataset.tab));
  });
  $('settings-done-btn').addEventListener('click', closeSettings);
  $('settings-modal').addEventListener('click', e => { if (e.target === $('settings-modal')) closeSettings(); });

  // ---- Settings form controls ----
  $$('#settings-timer-group .toggle-btn').forEach(b => {
    b.addEventListener('click', () => activateToggle('#settings-timer-group', b));
  });
  $$('#settings-lives-group .toggle-btn').forEach(b => {
    b.addEventListener('click', () => activateToggle('#settings-lives-group', b));
  });

  const customSlider = $('custom-threshold');
  if (customSlider) {
    customSlider.addEventListener('input', () => {
      if (GS.status === 'playing') {            // threshold is locked once a game has started
        customSlider.value = GS.lockedThreshold;
        return;
      }
      const v = parseFloat(customSlider.value);
      GS.customThreshold = v;
      CFG.THRESHOLDS['Custom'] = v;
      GS.difficulty = 'Custom';
      syncDifficultyUI();
      saveSettings();
    });
  }

  $('reset-defaults-btn')?.addEventListener('click', () => {
    GS.timerSecs        = CFG.DEFAULT_TIMER;
    GS.livesPerPlayer   = CFG.DEFAULT_LIVES;
    GS.livePreview      = true;
    GS.soundOn          = true;
    GS.difficulty       = CFG.DEFAULT_DIFFICULTY;
    GS.customThreshold  = 0.42;
    CFG.THRESHOLDS['Custom'] = 0.42;
    GS.reduceMotion     = false;
    document.body.classList.remove('reduce-motion');
    if (GS.status !== 'playing') {
      GS.opponentCount = 1;
      $$('#opp-count-group .toggle-btn').forEach(x => {
        const on = parseInt(x.dataset.val, 10) === 1;
        x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      renderLobbyRoster();
    }
    syncSettingsForm();
    syncDifficultyUI();
    saveSettings();
    toast('Settings reset to defaults');
  });

  // ---- Difficulty group (lobby) ----
  $$('#difficulty-group .toggle-btn').forEach(b => {
    b.addEventListener('click', () => {
      activateToggle('#difficulty-group', b);
      GS.difficulty = b.dataset.val;
      if (GS.difficulty === 'Custom') {
        CFG.THRESHOLDS['Custom'] = GS.customThreshold || 0.42;
      }
      syncDifficultyUI();
      saveSettings();
    });
  });

  // ---- Opponent count (lobby) ----
  $$('#opp-count-group .toggle-btn').forEach(b => {
    b.addEventListener('click', () => {
      activateToggle('#opp-count-group', b);
      GS.opponentCount = parseInt(b.dataset.val, 10);
      renderLobbyRoster();
      saveSettings();
    });
  });

  // ---- Random start word button ----
  $('random-word-btn')?.addEventListener('click', () => {
    refreshStartWord();
    beep('tick');
  });

  // ---- Start word input: coerce to uppercase on input ----
  $('start-word-input')?.addEventListener('input', e => {
    const pos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
    e.target.setSelectionRange(pos, pos);
  });

  // ---- Start game ----
  $('start-btn').addEventListener('click', startGame);
  $('start-btn').disabled = true; // disabled until warm-up done

  // ---- Human word input ----
  const wordInput = $('word-input');
  if (wordInput) {
    wordInput.addEventListener('input', onHumanInput);
    wordInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('submit-btn').click(); } });
  }

  // ---- Submit button ----
  $('submit-btn')?.addEventListener('click', () => {
    const player = GS.players[GS.activeIdx];
    if (!player || !player.isHuman || GS.status !== 'playing') return;
    const val = wordInput ? wordInput.value.trim() : '';
    if (!val) return;
    processSubmission(player, val);
  });

  // ---- Restart / back buttons ----
  $('restart-btn')?.addEventListener('click', () => { if (confirm('End this game?')) resetToLobby(); });
  $('again-btn')?.addEventListener('click',   startGame);
  $('menu-btn')?.addEventListener('click',    resetToLobby);

  // ---- NLP Lab buttons ----
  $('lab-compare-btn')?.addEventListener('click', runWordPairTest);
  $('lab-nn-btn')?.addEventListener('click',      runNearestNeighbours);
  $('eval-run-btn')?.addEventListener('click',    runEvaluation);

  // ---- Hint button (Full Vocabulary search, 1 per game) ----
  $('hint-btn')?.addEventListener('click', async () => {
    const btn = $('hint-btn');
    if (!btn || btn.disabled || !warmupDone || GS.hintUsed) return;
    btn.disabled = true;
    btn.textContent = 'Finding hint…';

    const cur = GS.currentWord.toLowerCase().trim();
    const curVec = await embed(cur);
    const thr = getThreshold();
    const results = [];

    if (curVec) {
      for (const w of VOCABULARY) {
        if (w === cur || isWordDuplicate(w)) continue;
        const wVec = await embed(w);
        if (!wVec) continue;
        const s = cosine(curVec, wVec);
        if (s >= thr) results.push({ word: w, score: s });
      }
    }

    results.sort((a, b) => b.score - a.score);
    if (results.length > 0) {
      GS.hintUsed = true;
      const hint = results[0].word;
      toast(`Hint: starts with "${hint.slice(0, 2).toUpperCase()}…" (${hint.length} letters)`, 'info', 5000);
      btn.textContent = 'Hint used';
    } else {
      btn.disabled = false;
      btn.textContent = 'Use hint';
      toast('No qualifying word found in vocabulary for a hint.', 'warn');
    }
  });

  // Begin model load
  initModel();
});

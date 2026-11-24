(function (global) {
  const {
    VALID_LETTERS,
    CATEGORY_META,
    normalizeTr,
    startsWithLetterTr,
    getRandomWordForBot,
    getHintForCategory,
    sfx,
    RoomNetwork,
    generateRoomCode
  } = global.ISH;

const AVATAR_OPTIONS = [
  { emoji: '🦉', bg: '#FEF08A', color: '#38BDF8' },
  { emoji: '🦊', bg: '#FFEDD5', color: '#FB923C' },
  { emoji: '🐼', bg: '#E2E8F0', color: '#2ECC71' },
  { emoji: '🦁', bg: '#FEF3C7', color: '#F59E0B' },
  { emoji: '🦄', bg: '#FCE7F3', color: '#F472B6' },
  { emoji: '🤖', bg: '#EDE9FE', color: '#A78BFA' }
];

const BOT_POOL = [
  { id: 'bot-1', name: 'Robo-Bot', avatar: '🤖', color: '#A78BFA', isBot: true },
  { id: 'bot-2', name: 'Bilge Tilki', avatar: '🦊', color: '#FB923C', isBot: true },
  { id: 'bot-3', name: 'Hızlı Panda', avatar: '🐼', color: '#2ECC71', isBot: true }
];

const ALL_CATEGORIES = ['İsim', 'Şehir', 'Hayvan', 'Bitki', 'Eşya', 'Ülke', 'Meslek'];

// ==================== OYUN DURUMU ====================
const state = {
  myId: 'me-' + Math.random().toString(36).slice(2, 8),
  myName: localStorage.getItem('ish_name') || 'Elif',
  myAvatarIdx: Number(localStorage.getItem('ish_avatar') || 0),
  mode: 'multi', // 'multi' | 'solo'
  isHost: true,
  roomCode: generateRoomCode(),
  totalRounds: 5,
  durationSec: 60,
  categories: ['İsim', 'Şehir', 'Hayvan', 'Bitki', 'Eşya'],

  // Canlı oyun
  phase: 'lobby', // 'lobby' | 'playing' | 'podium'
  currentRound: 0,
  usedLetters: [],
  currentLetter: 'M',
  timeLeft: 60,
  timerId: null,
  botTimers: [],
  hintsLeft: 2,
  timeBoostLeft: 1,
  mascotTip: 'Hazırsan kelimelerini yazmaya başla! Takılırsan bana tıkla 🦉',

  // Oyuncular: { id, name, avatar, color, isBot, isHost, score, filledCount, status, answers }
  players: [],
  myAnswers: {},
  guestSubmissions: new Map(), // host toplama için
  lastBreakdown: null
};

// ==================== DOM YARDIMCILARI ====================
const $ = (id) => document.getElementById(id);

function showScreen(name) {
  state.phase = name;
  $('screen-lobby').classList.toggle('hidden', name !== 'lobby');
  $('screen-game').classList.toggle('hidden', name !== 'playing');
  $('screen-podium').classList.toggle('hidden', name !== 'podium');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let toastTimer = null;
function showToast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

function spawnFloatingEmoji(emoji) {
  sfx.reaction();
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = emoji;
  el.style.left = `${15 + Math.random() * 70}%`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}

function spawnConfetti() {
  const colors = ['#FFD23F', '#FF5C8A', '#38BDF8', '#2ECC71', '#A78BFA', '#FB923C'];
  for (let i = 0; i < 42; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = `${Math.random() * 0.6}s`;
    c.style.width = `${8 + Math.random() * 8}px`;
    c.style.height = `${8 + Math.random() * 8}px`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3200);
  }
}

// ==================== AĞ (WEBRTC PEERJS) ====================
const net = new RoomNetwork({
  onStatus(status, text) {
    $('net-status').textContent = text;
    if (status === 'host') {
      state.isHost = true;
      syncLobbyToGuests();
    } else if (status === 'guest') {
      state.isHost = false;
      updateHostControlsLock();
    }
  },
  onError(msg) {
    $('net-status').textContent = `⚠️ ${msg}`;
    showToast(msg);
  },
  onPeerLeft(peerId) {
    if (!state.isHost) return;
    state.players = state.players.filter((p) => p.id !== peerId);
    renderLobbyPlayers();
    renderGamePlayers();
    syncLobbyToGuests();
  },
  onMessage(data, senderPeerId) {
    handleNetworkMessage(data, senderPeerId);
  }
});

function handleNetworkMessage(data, senderPeerId) {
  if (!data || !data.type) return;

  if (state.isHost) {
    if (data.type === 'hello') {
      const existing = state.players.find((p) => p.id === senderPeerId);
      const guestPlayer = {
        id: senderPeerId,
        name: (data.name || 'Oyuncu').slice(0, 16),
        avatar: data.avatar || '🦊',
        color: data.color || '#FB923C',
        isBot: false,
        isHost: false,
        score: 0,
        filledCount: 0,
        status: 'Bağlandı · Hazır!',
        answers: {}
      };
      if (existing) {
        Object.assign(existing, guestPlayer);
      } else if (state.players.length < 6) {
        state.players.push(guestPlayer);
      }
      sfx.pop();
      showToast(`${guestPlayer.avatar} ${guestPlayer.name} odaya katıldı!`);
      renderLobbyPlayers();
      syncLobbyToGuests();
    } else if (data.type === 'progress') {
      const p = state.players.find((pl) => pl.id === senderPeerId);
      if (p) {
        p.filledCount = data.filledCount || 0;
        p.status = p.filledCount >= state.categories.length ? 'Hazır! ✓' : `${p.filledCount}/${state.categories.length} yazdı...`;
        renderGamePlayers();
        net.broadcast({ type: 'players_sync', players: serializePlayers() });
      }
    } else if (data.type === 'submit_answers') {
      state.guestSubmissions.set(senderPeerId, data.answers || {});
      if (data.triggerStop && state.phase === 'playing') {
        finishRoundAsHost();
      }
    } else if (data.type === 'emoji') {
      spawnFloatingEmoji(data.emoji);
      net.broadcast({ type: 'emoji', emoji: data.emoji });
    }
    return;
  }

  // GUEST TARAFINDA GELEN MESAJLAR
  if (data.type === 'lobby_sync') {
    state.roomCode = data.roomCode;
    state.totalRounds = data.totalRounds;
    state.durationSec = data.durationSec;
    state.categories = data.categories;
    state.players = data.players;
    $('lobby-room-code').textContent = state.roomCode;
    renderCategoryToggles();
    renderOptionChips();
    renderLobbyPlayers();
    updateHostControlsLock();
  } else if (data.type === 'players_sync') {
    state.players = data.players;
    renderGamePlayers();
  } else if (data.type === 'round_start') {
    state.currentRound = data.round;
    state.currentLetter = data.letter;
    state.usedLetters = data.usedLetters || [];
    state.categories = data.categories;
    state.durationSec = data.durationSec;
    state.players = data.players;
    runWheelThenStartRound(data.letter);
  } else if (data.type === 'collect_answers') {
    net.broadcast({ type: 'submit_answers', answers: state.myAnswers, triggerStop: false });
  } else if (data.type === 'round_results') {
    state.players = data.players;
    state.lastBreakdown = data.breakdown;
    stopRoundTimers();
    showPodiumScreen(data.breakdown);
  } else if (data.type === 'back_to_lobby') {
    stopRoundTimers();
    showScreen('lobby');
    renderLobbyPlayers();
  } else if (data.type === 'emoji') {
    spawnFloatingEmoji(data.emoji);
  }
}

function serializePlayers() {
  return state.players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    color: p.color,
    isBot: p.isBot,
    isHost: p.isHost,
    score: p.score,
    filledCount: p.filledCount,
    status: p.status
  }));
}

function syncLobbyToGuests() {
  if (!state.isHost) return;
  net.broadcast({
    type: 'lobby_sync',
    roomCode: state.roomCode,
    totalRounds: state.totalRounds,
    durationSec: state.durationSec,
    categories: state.categories,
    players: serializePlayers()
  });
}

// ==================== OYUNCU YÖNETİMİ ====================
function ensureInitialPlayers() {
  const av = AVATAR_OPTIONS[state.myAvatarIdx] || AVATAR_OPTIONS[0];
  state.players = [
    {
      id: state.myId,
      name: state.myName,
      avatar: av.emoji,
      color: av.color,
      isBot: false,
      isHost: true,
      score: 0,
      filledCount: 0,
      status: '👑 Oda Kurucusu · Hazır!',
      answers: {}
    },
    {
      ...BOT_POOL[0],
      isHost: false,
      score: 0,
      filledCount: 0,
      status: 'Yapay Zeka Arkadaş',
      answers: {}
    }
  ];
}

function updateMyProfile() {
  const av = AVATAR_OPTIONS[state.myAvatarIdx] || AVATAR_OPTIONS[0];
  localStorage.setItem('ish_name', state.myName);
  localStorage.setItem('ish_avatar', String(state.myAvatarIdx));
  const me = state.players.find((p) => p.id === state.myId);
  if (me) {
    me.name = state.myName || 'Oyuncu';
    me.avatar = av.emoji;
    me.color = av.color;
  }
  renderLobbyPlayers();
  if (state.isHost) {
    syncLobbyToGuests();
  } else if (net.role === 'guest') {
    net.broadcast({ type: 'hello', name: state.myName, avatar: av.emoji, color: av.color });
  }
}

// ==================== LOBİ RENDER ====================
function renderAvatarPicker() {
  const container = $('avatar-picker');
  container.innerHTML = '';
  AVATAR_OPTIONS.forEach((av, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `avatar-opt ${idx === state.myAvatarIdx ? 'selected' : ''}`;
    btn.style.background = av.bg;
    btn.textContent = av.emoji;
    btn.addEventListener('click', () => {
      sfx.pop();
      state.myAvatarIdx = idx;
      renderAvatarPicker();
      updateMyProfile();
    });
    container.appendChild(btn);
  });
}

function renderOptionChips() {
  document.querySelectorAll('#rounds-chips .opt-chip').forEach((btn) => {
    const val = Number(btn.dataset.rounds);
    const active = val === state.totalRounds;
    btn.classList.toggle('active', active);
    btn.textContent = active ? `${val} Tur ✓` : `${val} Tur`;
  });
  document.querySelectorAll('#duration-chips .opt-chip').forEach((btn) => {
    const val = Number(btn.dataset.duration);
    const active = val === state.durationSec;
    btn.classList.toggle('active', active);
    btn.textContent = active ? `${val} sn ✓` : `${val} sn`;
  });
}

function renderCategoryToggles() {
  const wrap = $('category-toggles');
  wrap.innerHTML = '';
  ALL_CATEGORIES.forEach((cat) => {
    const meta = CATEGORY_META[cat];
    const active = state.categories.includes(cat);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-toggle';
    btn.textContent = active ? `✓ ${cat}` : `+ ${cat}`;
    if (active) {
      btn.style.background = meta.light;
      btn.style.color = meta.dark;
      btn.style.borderColor = meta.color;
    }
    btn.addEventListener('click', () => {
      if (!state.isHost) return showToast('Ayarları sadece oda kurucusu değiştirebilir.');
      sfx.pop();
      if (active) {
        if (state.categories.length <= 3) return showToast('En az 3 kategori seçili olmalı!');
        state.categories = state.categories.filter((c) => c !== cat);
      } else {
        state.categories.push(cat);
      }
      renderCategoryToggles();
      syncLobbyToGuests();
    });
    wrap.appendChild(btn);
  });
}

function renderLobbyPlayers() {
  const list = $('lobby-players-list');
  $('lobby-player-count').textContent = `${state.players.length} / 6 Oyuncu`;
  list.innerHTML = '';

  state.players.forEach((p) => {
    const isMe = p.id === state.myId || (!state.isHost && !p.isHost && p.name === state.myName);
    const row = document.createElement('div');
    row.className = `player-pill ${isMe ? 'me' : ''}`;
    row.innerHTML = `
      <div class="player-left">
        <div class="player-avatar" style="background:${p.color};">${p.avatar}</div>
        <div>
          <div class="player-name">${p.name}${isMe ? ' (Sen)' : ''}</div>
          <div class="player-status ready">${p.status}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span class="player-score-pill">${p.isBot ? 'Bot ✓' : 'Hazır ✓'}</span>
        ${p.isBot && state.isHost ? `<button type="button" class="icon-btn" style="width:30px;height:30px;font-size:13px;" data-remove-bot="${p.id}" title="Botu çıkar">✕</button>` : ''}
      </div>
    `;
    list.appendChild(row);
  });

  list.querySelectorAll('[data-remove-bot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.pop();
      state.players = state.players.filter((p) => p.id !== btn.dataset.removeBot);
      renderLobbyPlayers();
      syncLobbyToGuests();
    });
  });
}

function updateHostControlsLock() {
  const startBtn = $('btn-start-game');
  if (!state.isHost) {
    startBtn.disabled = true;
    startBtn.textContent = '⏳ Oda Kurucusu Başlatmayı Bekliyor...';
    $('btn-add-bot').style.display = 'none';
    $('lobby-mascot-msg').textContent = 'Harika! Odaya bağlandın, kurucu oyunu başlattığında harf çarkı dönecek! 🎡';
  } else {
    startBtn.disabled = false;
    startBtn.textContent = '🚀 OYUNU BAŞLAT!';
    $('btn-add-bot').style.display = 'block';
    $('lobby-mascot-msg').textContent = 'Herkes hazır! Butona bas, harf çarkı dönsün ve eğlence başlasın! 🎡';
  }
}

// ==================== OYUN BAŞLATMA & HARF ÇARKI ====================
function startNewGameAsHost() {
  if (!state.isHost) return;
  if (state.players.length < 2) {
    // Tek kişi kaldıysa otomatik 1 bot ekle
    addBotFriend();
  }
  state.currentRound = 0;
  state.usedLetters = [];
  state.hintsLeft = 2;
  state.timeBoostLeft = 1;
  state.players.forEach((p) => { p.score = 0; });
  startNextRoundAsHost();
}

function startNextRoundAsHost() {
  if (!state.isHost) return;
  state.currentRound += 1;
  const available = VALID_LETTERS.filter((l) => !state.usedLetters.includes(l));
  const pool = available.length > 0 ? available : VALID_LETTERS;
  const letter = pool[Math.floor(Math.random() * pool.length)];
  state.usedLetters.push(letter);
  state.currentLetter = letter;
  state.guestSubmissions.clear();

  state.players.forEach((p) => {
    p.filledCount = 0;
    p.answers = {};
    p.status = p.isBot ? 'Düşünüyor...' : '0/' + state.categories.length + ' yazdı';
  });

  net.broadcast({
    type: 'round_start',
    round: state.currentRound,
    letter,
    usedLetters: state.usedLetters,
    categories: state.categories,
    durationSec: state.durationSec,
    players: serializePlayers()
  });

  runWheelThenStartRound(letter);
}

function runWheelThenStartRound(targetLetter) {
  const overlay = $('wheel-overlay');
  const wheelEl = $('wheel-letter');
  const subEl = $('wheel-sub');
  overlay.classList.remove('hidden');
  subEl.textContent = `Tur ${state.currentRound} / ${state.totalRounds} başlıyor...`;

  let ticks = 0;
  const spinId = setInterval(() => {
    wheelEl.textContent = VALID_LETTERS[Math.floor(Math.random() * VALID_LETTERS.length)];
    sfx.tick();
    ticks++;
    if (ticks >= 16) {
      clearInterval(spinId);
      wheelEl.textContent = targetLetter;
      subEl.textContent = `🎉 Harfimiz: "${targetLetter}"! Hadi başla!`;
      sfx.success();
      setTimeout(() => {
        overlay.classList.add('hidden');
        beginPlayingRound();
      }, 750);
    }
  }, 85);
}

// ==================== CANLI OYUN TURU ====================
function beginPlayingRound() {
  stopRoundTimers();
  state.myAnswers = {};
  state.timeLeft = state.durationSec;
  state.mascotTip = `“${state.currentLetter}” harfi ile başlayan kelimeleri yaz! Takılırsan İpucu butonuna tıkla 🦉`;

  showScreen('playing');
  renderGameHeader();
  renderCategoryCards();
  renderGamePlayers();
  renderBottomChecklist();
  updatePowerupButtons();
  updateTimerUI();

  // İlk inputa odaklan
  const firstInput = document.querySelector('#category-cards-grid .cat-input');
  if (firstInput) firstInput.focus();

  // Botları çalıştır (Host veya tek oyunculu)
  if (state.isHost) {
    scheduleBotTyping();
  }

  // Canlı geri sayım
  state.timerId = setInterval(() => {
    state.timeLeft = Math.max(0, state.timeLeft - 1);
    updateTimerUI();
    if (state.timeLeft <= 5 && state.timeLeft > 0) sfx.tick();
    if (state.timeLeft === 0) {
      if (state.isHost) {
        finishRoundAsHost();
      } else {
        net.broadcast({ type: 'submit_answers', answers: state.myAnswers, triggerStop: false });
      }
    }
  }, 1000);
}

function stopRoundTimers() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  state.botTimers.forEach((t) => clearTimeout(t));
  state.botTimers = [];
}

function scheduleBotTyping() {
  const bots = state.players.filter((p) => p.isBot);
  bots.forEach((bot) => {
    bot.answers = {};
    state.categories.forEach((cat, idx) => {
      const delayMs = 2800 + idx * 3200 + Math.random() * 4500;
      const tid = setTimeout(() => {
        if (state.phase !== 'playing') return;
        // %82 olasılıkla doğru kelime bulsun, %18 boş bıraksın (çocuklar için dengeli ve keyifli!)
        if (Math.random() < 0.82) {
          bot.answers[cat] = getRandomWordForBot(state.currentLetter, cat);
        }
        bot.filledCount = Object.values(bot.answers).filter(Boolean).length;
        bot.status = bot.filledCount >= state.categories.length ? 'Hazır! ✓' : `${bot.filledCount}/${state.categories.length} yazdı`;
        renderGamePlayers();
        net.broadcast({ type: 'players_sync', players: serializePlayers() });
      }, delayMs);
      state.botTimers.push(tid);
    });
  });
}

function renderGameHeader() {
  $('game-room-pill').textContent = state.mode === 'solo' ? 'MOD: TEK OYUNCU' : `ODA: ${state.roomCode}`;
  $('game-round-label').textContent = `Tur ${state.currentRound} / ${state.totalRounds}`;
  $('active-letter-medallion').textContent = state.currentLetter;
  $('active-letter-title').textContent = `${state.currentLetter} ile Başla!`;
  const prev = state.usedLetters.slice(0, -1);
  $('used-letters-label').textContent = prev.length ? `Geçenler: ${prev.map((l) => `${l} ✓`).join(' · ')}` : 'İlk tur — bol şans!';
  $('streak-pill').textContent = `Tur ${state.currentRound} / ${state.totalRounds} 🔥`;

  const me = state.players.find((p) => p.id === state.myId) || state.players[0];
  $('game-total-score').textContent = `⭐ ${me ? me.score : 0} Puan`;

  const dotsWrap = $('game-round-dots');
  dotsWrap.innerHTML = '';
  for (let i = 1; i <= state.totalRounds; i++) {
    const d = document.createElement('div');
    d.className = `round-dot ${i < state.currentRound ? 'done' : i === state.currentRound ? 'active' : ''}`;
    d.textContent = i < state.currentRound ? '✓' : String(i);
    dotsWrap.appendChild(d);
  }
}

function renderCategoryCards() {
  const grid = $('category-cards-grid');
  grid.innerHTML = '';

  state.categories.forEach((cat) => {
    const meta = CATEGORY_META[cat];
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.style.setProperty('--cat-color', meta.color);
    card.style.setProperty('--cat-light', meta.light);
    card.style.setProperty('--cat-shadow', meta.shadow);

    card.innerHTML = `
      <div class="cat-card-head">
        <div class="cat-title-wrap">
          <div class="cat-icon-badge">${meta.svg}</div>
          <span class="cat-name">${cat}</span>
        </div>
        <span class="cat-status" id="status-${meta.key}">Bekleniyor</span>
      </div>
      <input
        type="text"
        class="cat-input"
        id="input-${meta.key}"
        autocomplete="off"
        placeholder="${state.currentLetter} harfi ile ${cat.toLowerCase()}..."
        value="${state.myAnswers[cat] || ''}"
      />
      <div class="cat-foot">
        <span id="hint-${meta.key}">${state.currentLetter} harfi ile başlamalı</span>
        <span id="pts-${meta.key}" class="font-display" style="color:${meta.dark};font-weight:600;">+10 puan</span>
      </div>
    `;
    grid.appendChild(card);

    const inp = card.querySelector('.cat-input');
    inp.addEventListener('input', () => {
      state.myAnswers[cat] = inp.value;
      updateCategoryCardStatus(cat);
      updateMyLiveProgress();
    });
  });

  // Bilge Baykuş Maskot Kartı (Etkileşimli İpucu)
  const mascot = document.createElement('div');
  mascot.className = 'mascot-card';
  mascot.innerHTML = `
    <div class="mascot-row">
      <svg width="42" height="42" viewBox="0 0 48 48" fill="none" style="flex-shrink:0;">
        <circle cx="24" cy="24" r="22" fill="#FDE047"/>
        <circle cx="17" cy="21" r="6" fill="#FFFFFF" stroke="#B45309" stroke-width="2"/>
        <circle cx="31" cy="21" r="6" fill="#FFFFFF" stroke="#B45309" stroke-width="2"/>
        <circle cx="18" cy="21" r="2.5" fill="#1E293B"/>
        <circle cx="32" cy="21" r="2.5" fill="#1E293B"/>
        <path d="M21 28L24 32L27 28H21Z" fill="#F97316"/>
        <path d="M12 12L17 15M36 12L31 15" stroke="#B45309" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <div>
        <div class="font-display" style="font-weight:700;font-size:18px;color:#92400E;">Bilge Baykuş</div>
        <div style="font-size:12px;font-weight:700;color:#B45309;">Yardımcı Maskot</div>
      </div>
    </div>
    <div id="mascot-tip-text" style="font-size:13px;font-weight:800;color:#78350F;line-height:1.4;">${state.mascotTip}</div>
    <button type="button" id="btn-mascot-hint" class="btn-3d btn-amber" style="width:100%;">✨ Yeni İpucu İste</button>
  `;
  grid.appendChild(mascot);
  $('btn-mascot-hint').addEventListener('click', useHintPowerup);
}

function updateCategoryCardStatus(cat) {
  const meta = CATEGORY_META[cat];
  const val = (state.myAnswers[cat] || '').trim();
  const badge = $(`status-${meta.key}`);
  const hint = $(`hint-${meta.key}`);

  if (!val) {
    badge.className = 'cat-status';
    badge.textContent = 'Bekleniyor';
    hint.textContent = `${state.currentLetter} harfi ile başlamalı`;
  } else if (startsWithLetterTr(val, state.currentLetter)) {
    if (!badge.classList.contains('valid')) sfx.pop();
    badge.className = 'cat-status valid';
    badge.textContent = '✓ Harika!';
    hint.textContent = `${state.currentLetter} harfi ile başlıyor`;
  } else {
    badge.className = 'cat-status invalid';
    badge.textContent = '✗ Yanlış Harf';
    hint.textContent = `Dikkat! "${state.currentLetter}" ile başlamalı`;
  }
  renderBottomChecklist();
}

function updateMyLiveProgress() {
  const validCount = state.categories.filter((cat) => startsWithLetterTr(state.myAnswers[cat], state.currentLetter)).length;
  const total = state.categories.length;
  const remaining = total - validCount;

  $('game-encourage-msg').textContent = remaining === 0
    ? `Müthişsin ${state.myName}! Tüm kategoriler hazır — hemen "BİTİRDİM!" butonuna bas! 🎉`
    : `Harika gidiyorsun ${state.myName}! ${validCount}/${total} kategori hazır, son ${remaining} kelime kaldı! ✨`;

  const me = state.players.find((p) => p.id === state.myId);
  if (me) {
    me.filledCount = validCount;
    me.status = remaining === 0 ? 'Hazır! ✓' : `${validCount}/${total} yazdı · Yazıyor...`;
  }
  renderGamePlayers();
  if (state.isHost) {
    net.broadcast({ type: 'players_sync', players: serializePlayers() });
  } else if (net.role === 'guest') {
    net.broadcast({ type: 'progress', filledCount: validCount });
  }
}

function renderGamePlayers() {
  const list = $('game-players-list');
  $('game-online-pill').textContent = `● ${state.players.length} Canlı`;
  list.innerHTML = '';
  state.players.forEach((p) => {
    const isMe = p.id === state.myId;
    const row = document.createElement('div');
    row.className = `player-pill ${isMe ? 'me' : ''}`;
    row.innerHTML = `
      <div class="player-left">
        <div class="player-avatar" style="background:${p.color};">${p.avatar}</div>
        <div>
          <div class="player-name">${p.name}${isMe ? ' (Sen)' : ''}</div>
          <div class="player-status ${p.status?.includes('Hazır') ? 'ready' : ''}">${p.status || 'Yazıyor...'}</div>
        </div>
      </div>
      <span class="player-score-pill">${p.score} ⭐</span>
    `;
    list.appendChild(row);
  });
}

function renderBottomChecklist() {
  const wrap = $('bottom-checklist');
  wrap.innerHTML = '';
  state.categories.forEach((cat) => {
    const meta = CATEGORY_META[cat];
    const ok = startsWithLetterTr(state.myAnswers[cat], state.currentLetter);
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.style.background = ok ? meta.light : '#F1F5F9';
    pill.style.color = ok ? meta.dark : '#64748B';
    pill.textContent = `${ok ? '✓' : '✎'} ${cat}`;
    wrap.appendChild(pill);
  });
}

function updateTimerUI() {
  const mins = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
  const secs = String(state.timeLeft % 60).padStart(2, '0');
  const clock = $('game-timer-clock');
  clock.textContent = `${mins}:${secs}`;
  clock.classList.toggle('urgent', state.timeLeft <= 10);

  const pct = Math.min(100, (state.timeLeft / state.durationSec) * 100);
  const fill = $('game-timer-fill');
  fill.style.width = `${pct}%`;
  fill.style.backgroundColor = state.timeLeft <= 10 ? '#F43F5E' : state.timeLeft <= 20 ? '#F59E0B' : '#2ECC71';
}

function updatePowerupButtons() {
  $('hint-count').textContent = state.hintsLeft;
  $('time-count').textContent = state.timeBoostLeft;
  $('btn-power-hint').disabled = state.hintsLeft <= 0;
  $('btn-power-time').disabled = state.timeBoostLeft <= 0;
}

function useHintPowerup() {
  if (state.hintsLeft <= 0) return showToast('İpucu hakkın kalmadı!');
  const targetCat = state.categories.find((c) => !startsWithLetterTr(state.myAnswers[c], state.currentLetter)) || state.categories[0];
  state.hintsLeft -= 1;
  state.mascotTip = getHintForCategory(state.currentLetter, targetCat);
  const tipEl = $('mascot-tip-text');
  if (tipEl) tipEl.textContent = state.mascotTip;
  sfx.success();
  updatePowerupButtons();
  showToast(`🦉 Bilge Baykuş "${targetCat}" için ipucu verdi!`);
}

function useTimePowerup() {
  if (state.timeBoostLeft <= 0) return showToast('Süre ekleme hakkın kalmadı!');
  state.timeBoostLeft -= 1;
  state.timeLeft += 15;
  sfx.success();
  updatePowerupButtons();
  updateTimerUI();
  showToast('⏰ +15 Saniye eklendi!');
}

// ==================== TUR BİTİRME & PUANLAMA ====================
function finishRoundAsHost() {
  if (state.phase !== 'playing') return;
  stopRoundTimers();

  // Misafirlerin son cevaplarını iste ve 450ms sonra hesapla
  const hasRemoteGuests = state.players.some((p) => !p.isBot && p.id !== state.myId);
  if (hasRemoteGuests) {
    net.broadcast({ type: 'collect_answers' });
    setTimeout(computeAndShowResultsAsHost, 450);
  } else {
    computeAndShowResultsAsHost();
  }
}

function computeAndShowResultsAsHost() {
  // Her oyuncunun cevaplarını topla
  state.players.forEach((p) => {
    if (p.id === state.myId) {
      p.answers = { ...state.myAnswers };
    } else if (!p.isBot) {
      p.answers = state.guestSubmissions.get(p.id) || {};
    }
    // Bot cevapları zaten p.answers içinde
  });

  // Kategori bazlı puanlama: +15 Tek Bilen, +10 Benzersiz, +5 Ortak, 0 Yanlış/Boş
  const perPlayerRoundPts = {};
  state.players.forEach((p) => { perPlayerRoundPts[p.id] = 0; });

  const breakdown = state.categories.map((cat) => {
    const validEntries = [];
    const counts = {};

    state.players.forEach((p) => {
      const raw = (p.answers?.[cat] || '').trim();
      const valid = startsWithLetterTr(raw, state.currentLetter);
      const norm = valid ? normalizeTr(raw) : '';
      if (valid) {
        counts[norm] = (counts[norm] || 0) + 1;
        validEntries.push({ playerId: p.id, name: p.name, word: raw, norm });
      }
    });

    const entries = state.players.map((p) => {
      const raw = (p.answers?.[cat] || '').trim();
      const valid = startsWithLetterTr(raw, state.currentLetter);
      const norm = valid ? normalizeTr(raw) : '';
      let pts = 0;
      let reason = 'Boş / Yanlış';

      if (valid) {
        if (validEntries.length === 1) {
          pts = 15;
          reason = 'Tek Bilen!';
        } else if (counts[norm] === 1) {
          pts = 10;
          reason = 'Benzersiz';
        } else {
          pts = 5;
          reason = 'Ortak';
        }
      }
      perPlayerRoundPts[p.id] += pts;
      return { playerId: p.id, name: p.name, word: raw, pts, reason };
    });

    return { category: cat, entries };
  });

  state.players.forEach((p) => {
    p.score += perPlayerRoundPts[p.id];
    p.lastRoundPts = perPlayerRoundPts[p.id];
  });

  const payload = {
    letter: state.currentLetter,
    round: state.currentRound,
    totalRounds: state.totalRounds,
    breakdown,
    perPlayerRoundPts
  };

  net.broadcast({
    type: 'round_results',
    players: serializePlayers().map((sp, i) => ({ ...sp, lastRoundPts: state.players[i].lastRoundPts })),
    breakdown: payload
  });

  showPodiumScreen(payload);
}

function showPodiumScreen(payload) {
  showScreen('podium');
  sfx.fanfare();
  spawnConfetti();

  const isGameOver = payload.round >= payload.totalRounds;
  const myEntryPts = payload.perPlayerRoundPts?.[state.myId] ?? 0;

  $('podium-title').textContent = isGameOver
    ? `🏆 Oyun Bitti! — ${payload.letter} Harfi Finali`
    : `Tur ${payload.round} Tamamlandı! — ${payload.letter} Harfi Sonuçları`;
  $('podium-subtitle').textContent = `Harika kelimeler buldun! Bu turda +${myEntryPts} puan kazandın 🎉`;
  $('podium-next-pill').textContent = isGameOver
    ? '🎊 Şampiyon Belli Oldu!'
    : `Sıradaki: Tur ${payload.round + 1} / ${payload.totalRounds} 🎲`;

  const nextBtn = $('btn-next-round');
  if (!state.isHost) {
    nextBtn.disabled = true;
    nextBtn.textContent = '⏳ Kurucu Sonraki Turu Başlatacak...';
  } else {
    nextBtn.disabled = false;
    nextBtn.textContent = isGameOver ? '🔄 YENİ OYUN BAŞLAT!' : '🎲 SONRAKİ TURA GEÇ!';
  }

  // Liderlik Podyumu
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const pedOrder = [
    top3[1] ? { rank: '2', p: top3[1], h: 120, color: '#38BDF8', shadow: '#0284C7', first: false } : null,
    top3[0] ? { rank: '1', p: top3[0], h: 165, color: '#FFD23F', shadow: '#D97706', first: true } : null,
    top3[2] ? { rank: '3', p: top3[2], h: 92, color: '#4ADE80', shadow: '#16A34A', first: false } : null
  ].filter(Boolean);

  const pedWrap = $('podium-pedestals');
  pedWrap.innerHTML = '';
  pedOrder.forEach((item) => {
    const col = document.createElement('div');
    col.className = `pedestal-col ${item.first ? 'first' : ''}`;
    col.innerHTML = `
      ${item.first ? '<div style="font-size:26px;">👑</div>' : ''}
      <div class="pedestal-avatar" style="background:${item.color};">${item.p.avatar}</div>
      <div class="font-display" style="font-weight:700;font-size:${item.first ? 17 : 15}px;">${item.p.name}</div>
      <div style="font-size:13px;font-weight:800;color:#B45309;">${item.p.score} ⭐</div>
      <div class="pedestal-block" style="height:${item.h}px;background:${item.color};box-shadow:0 5px 0 ${item.shadow};">${item.rank}</div>
    `;
    pedWrap.appendChild(col);
  });

  const restWrap = $('podium-rest');
  restWrap.innerHTML = '';
  sorted.slice(3).forEach((p, idx) => {
    const r = document.createElement('div');
    r.className = 'player-pill';
    r.innerHTML = `<span style="font-weight:800;">${idx + 4}. ${p.avatar} ${p.name}</span><span class="player-score-pill">${p.score} ⭐</span>`;
    restWrap.appendChild(r);
  });

  const leader = sorted[0];
  $('podium-award').textContent = leader
    ? `⚡ Şu An Lider: ${leader.avatar} ${leader.name} (${leader.score} ⭐)`
    : '⚡ Harika Tur!';

  // Cevap & Puan Özeti
  $('breakdown-heading').textContent = `📝 ${payload.letter} Harfi Cevap & Puan Özeti`;
  $('round-points-badge').textContent = `Bu Tur: +${myEntryPts} Puan 🚀`;

  const bList = $('breakdown-list');
  bList.innerHTML = '';
  payload.breakdown.forEach((row) => {
    const meta = CATEGORY_META[row.category];
    const myEnt = row.entries.find((e) => e.playerId === state.myId) || row.entries[0];
    const othersText = row.entries
      .filter((e) => e.playerId !== myEnt.playerId)
      .map((e) => `${e.name}: ${e.word || '—'}`)
      .join(' · ');

    const ptsBg = myEnt.pts >= 15 ? '#FEF08A' : myEnt.pts === 10 ? '#DCFCE7' : myEnt.pts === 5 ? '#FEF3C7' : '#FFE4E6';
    const ptsFg = myEnt.pts >= 15 ? '#92400E' : myEnt.pts === 10 ? '#15803D' : myEnt.pts === 5 ? '#B45309' : '#BE123C';

    const el = document.createElement('div');
    el.className = 'breakdown-row';
    el.innerHTML = `
      <div class="breakdown-left">
        <span class="cat-badge-fixed" style="background:${meta.light};color:${meta.dark};">${row.category}</span>
        <div>
          <div style="font-weight:800;font-size:17px;">${myEnt.word || '(Boş bırakıldı)'}</div>
          <div style="font-size:12px;font-weight:700;color:#64748B;">${othersText || 'Tek oyuncu'}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:12px;font-weight:800;color:#64748B;">${myEnt.reason}</span>
        <span class="pill" style="background:${ptsBg};color:${ptsFg};font-family:'Fredoka',sans-serif;font-size:15px;">+${myEnt.pts} ⭐</span>
      </div>
    `;
    bList.appendChild(el);
  });
}

// ==================== BOT EKLEME & OLAYLAR ====================
function addBotFriend() {
  if (state.players.length >= 6) return showToast('Oda en fazla 6 kişi olabilir!');
  const usedIds = new Set(state.players.map((p) => p.id));
  const nextBot = BOT_POOL.find((b) => !usedIds.has(b.id));
  if (!nextBot) return showToast('En fazla 3 bot arkadaş eklenebilir!');
  sfx.pop();
  state.players.push({
    ...nextBot,
    isHost: false,
    score: 0,
    filledCount: 0,
    status: 'Yapay Zeka Arkadaş',
    answers: {}
  });
  renderLobbyPlayers();
  syncLobbyToGuests();
}

function bindEvents() {
  // İsim değişimi
  $('player-name-input').value = state.myName;
  $('player-name-input').addEventListener('input', (e) => {
    state.myName = e.target.value.trim() || 'Oyuncu';
    updateMyProfile();
  });

  // Mod geçişi
  $('mode-multi').addEventListener('click', () => {
    sfx.pop();
    state.mode = 'multi';
    $('mode-multi').classList.add('active');
    $('mode-solo').classList.remove('active');
    $('room-code-strip').style.display = 'flex';
    $('net-status').style.display = 'block';
    if (net.role === 'offline') net.hostRoom(state.roomCode);
  });

  $('mode-solo').addEventListener('click', () => {
    sfx.pop();
    state.mode = 'solo';
    state.isHost = true;
    net.destroy();
    $('mode-solo').classList.add('active');
    $('mode-multi').classList.remove('active');
    $('room-code-strip').style.display = 'none';
    $('net-status').style.display = 'none';
    updateHostControlsLock();
  });

  // Oda kodu kopyala & link paylaş
  $('btn-copy-code').addEventListener('click', async () => {
    sfx.pop();
    try {
      await navigator.clipboard.writeText(state.roomCode);
      showToast(`📋 Oda kodu kopyalandı: ${state.roomCode}`);
    } catch {
      showToast(`Oda kodun: ${state.roomCode}`);
    }
  });

  $('btn-share-link').addEventListener('click', async () => {
    sfx.pop();
    const url = `${window.location.origin}${window.location.pathname}?oda=${state.roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 Davet linki kopyalandı! Arkadaşına gönder.');
    } catch {
      showToast(url);
    }
  });

  // Odaya Katıl
  $('btn-join-room').addEventListener('click', async () => {
    const code = $('join-code-input').value.trim().toUpperCase();
    if (code.length !== 4) return showToast('Lütfen 4 haneli oda kodunu gir.');
    sfx.pop();
    const av = AVATAR_OPTIONS[state.myAvatarIdx] || AVATAR_OPTIONS[0];
    const ok = await net.joinRoom(code, { name: state.myName, avatar: av.emoji, color: av.color });
    if (ok) {
      state.roomCode = code;
      $('lobby-room-code').textContent = code;
    }
  });

  // Tur sayısı & Süre
  document.querySelectorAll('#rounds-chips .opt-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state.isHost) return showToast('Ayarları sadece kurucu değiştirebilir.');
      sfx.pop();
      state.totalRounds = Number(btn.dataset.rounds);
      renderOptionChips();
      syncLobbyToGuests();
    });
  });

  document.querySelectorAll('#duration-chips .opt-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state.isHost) return showToast('Ayarları sadece kurucu değiştirebilir.');
      sfx.pop();
      state.durationSec = Number(btn.dataset.duration);
      renderOptionChips();
      syncLobbyToGuests();
    });
  });

  $('btn-add-bot').addEventListener('click', addBotFriend);
  $('btn-start-game').addEventListener('click', () => {
    sfx.pop();
    startNewGameAsHost();
  });

  // Oyun içi aksiyonlar
  $('btn-power-hint').addEventListener('click', useHintPowerup);
  $('btn-power-time').addEventListener('click', useTimePowerup);

  $('btn-clear-inputs').addEventListener('click', () => {
    sfx.buzz();
    state.myAnswers = {};
    state.categories.forEach((cat) => {
      const inp = $(`input-${CATEGORY_META[cat].key}`);
      if (inp) inp.value = '';
      updateCategoryCardStatus(cat);
    });
    updateMyLiveProgress();
  });

  $('btn-finish-round').addEventListener('click', () => {
    sfx.success();
    if (state.isHost) {
      finishRoundAsHost();
    } else {
      net.broadcast({ type: 'submit_answers', answers: state.myAnswers, triggerStop: true });
      showToast('🛑 Dur dedin! Sonuçlar hesaplanıyor...');
    }
  });

  // Podyum aksiyonları
  $('btn-next-round').addEventListener('click', () => {
    sfx.pop();
    if (state.currentRound >= state.totalRounds) {
      startNewGameAsHost();
    } else {
      startNextRoundAsHost();
    }
  });

  $('btn-back-lobby').addEventListener('click', () => {
    sfx.pop();
    stopRoundTimers();
    if (state.isHost) net.broadcast({ type: 'back_to_lobby' });
    showScreen('lobby');
    renderLobbyPlayers();
  });

  // Emoji tepkileri
  document.querySelectorAll('.emoji-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const em = btn.dataset.emoji;
      spawnFloatingEmoji(em);
      net.broadcast({ type: 'emoji', emoji: em });
    });
  });

  // Ses & Kurallar
  document.querySelectorAll('.js-sound-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const muted = sfx.toggleMute();
      document.querySelectorAll('.js-sound-btn').forEach((b) => { b.textContent = muted ? '🔇' : '🔊'; });
      showToast(muted ? '🔇 Sesler kapatıldı' : '🔊 Sesler açıldı');
    });
  });

  document.querySelectorAll('.js-rules-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.pop();
      $('rules-overlay').classList.remove('hidden');
    });
  });
  $('btn-close-rules').addEventListener('click', () => $('rules-overlay').classList.add('hidden'));
  $('btn-rules-ok').addEventListener('click', () => $('rules-overlay').classList.add('hidden'));
}

// ==================== BAŞLATMA ====================
function init() {
  ensureInitialPlayers();
  renderAvatarPicker();
  renderOptionChips();
  renderCategoryToggles();
  renderLobbyPlayers();
  updateHostControlsLock();
  bindEvents();

  $('lobby-room-code').textContent = state.roomCode;

  // URL'de ?oda=XXXX varsa otomatik katılma alanını doldur
  const params = new URLSearchParams(window.location.search);
  const invitedCode = (params.get('oda') || '').trim().toUpperCase();
  if (invitedCode.length === 4) {
    $('join-code-input').value = invitedCode;
    $('net-status').textContent = `🎉 ${invitedCode} odasına davet edildin! "Katıl →" butonuna bas.`;
  } else {
    // PeerJS yüklenince odayı otomatik aç
    const startHosting = () => {
      if (state.mode === 'multi') {
        net.hostRoom(state.roomCode);
      }
    };
    if (document.readyState === 'complete') {
      startHosting();
    } else {
      window.addEventListener('load', startHosting);
    }
  }
}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);

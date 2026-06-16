// ── Theme toggle ──────────────────────────────────────────────────────────────

(function () {
  const btn = document.getElementById('themeToggle');

  function applyTheme(light) {
    if (light) {
      document.documentElement.dataset.theme = 'light';
      btn.textContent = '🌙';
      btn.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      delete document.documentElement.dataset.theme;
      btn.textContent = '☀️';
      btn.setAttribute('aria-label', 'Switch to light theme');
    }
    localStorage.setItem('theme', light ? 'light' : 'dark');
  }

  if (document.documentElement.dataset.theme === 'light') {
    btn.textContent = '🌙';
    btn.setAttribute('aria-label', 'Switch to dark theme');
  }

  btn.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme !== 'light');
  });
})();

// ── Text-to-speech ────────────────────────────────────────────────────────────

const SPEAK_OVERRIDE = {
  'ㄲ':'까', 'ㄸ':'따', 'ㅃ':'빠', 'ㅆ':'싸', 'ㅉ':'짜',
};

let koreanVoice = null;

function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  koreanVoice = voices.find(v => v.lang.startsWith('ko')) || null;
}

if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

function speak(text, btn) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(SPEAK_OVERRIDE[text] ?? text);
  utter.lang = 'ko-KR';
  utter.rate = 0.85;
  if (koreanVoice) utter.voice = koreanVoice;
  if (btn) {
    btn.classList.add('speaking');
    utter.onend = () => btn.classList.remove('speaking');
  }
  window.speechSynthesis.speak(utter);
}

// ── Sound effects ─────────────────────────────────────────────────────────────

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playCorrect() {
  const ctx = getAudioCtx();
  [[523, 0, 0.15], [784, 0.12, 0.45]].forEach(([freq, start, end]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + end);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + end);
  });
}

function playWrong() {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

// ── Tab navigation ───────────────────────────────────────────────────────────

let activeTab = 'practice';

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t === tab));
    clearTimer();
    if (activeTab === 'theory') {
      show('theory');
    } else if (activeTab === 'quiz') {
      document.getElementById('timerCard').style.display = '';
      document.getElementById('startBtn').textContent = 'Start Quiz →';
      show('setup');
    } else {
      document.getElementById('timerCard').style.display = '';
      document.getElementById('startBtn').textContent = 'Start Round →';
      show('setup');
    }
  });
});

// ── Data ─────────────────────────────────────────────────────────────────────

const DATA = {
  1: [ // consonants + vowels
    {k:'ㄱ', r:'g/k', m:'consonant'},
    {k:'ㄴ', r:'n',   m:'consonant'},
    {k:'ㄷ', r:'d/t', m:'consonant'},
    {k:'ㄹ', r:'r/l', m:'consonant'},
    {k:'ㅁ', r:'m',   m:'consonant'},
    {k:'ㅂ', r:'b/p', m:'consonant'},
    {k:'ㅅ', r:'s',   m:'consonant'},
    {k:'ㅇ', r:'ng',  m:'consonant'},
    {k:'ㅈ', r:'j',   m:'consonant'},
    {k:'ㅊ', r:'ch',  m:'consonant'},
    {k:'ㅋ', r:'k',   m:'consonant'},
    {k:'ㅌ', r:'t',   m:'consonant'},
    {k:'ㅍ', r:'p',   m:'consonant'},
    {k:'ㅎ', r:'h',   m:'consonant'},
    {k:'ㅏ', r:'a',   m:'vowel'},
    {k:'ㅓ', r:'eo',  m:'vowel'},
    {k:'ㅗ', r:'o',   m:'vowel'},
    {k:'ㅜ', r:'u',   m:'vowel'},
    {k:'ㅡ', r:'eu',  m:'vowel'},
    {k:'ㅣ', r:'i',   m:'vowel'},
    {k:'ㅐ', r:'ae',  m:'vowel'},
    {k:'ㅔ', r:'e',   m:'vowel'},
    {k:'ㅑ', r:'ya',  m:'vowel'},
    {k:'ㅕ', r:'yeo', m:'vowel'},
    {k:'ㅛ', r:'yo',  m:'vowel'},
    {k:'ㅠ', r:'yu',  m:'vowel'},
    {k:'ㅒ', r:'yae', m:'vowel'},
    {k:'ㅖ', r:'ye',  m:'vowel'},
    {k:'ㅘ', r:'wa',  m:'vowel'},
    {k:'ㅙ', r:'wae', m:'vowel'},
    {k:'ㅚ', r:'oe',  m:'vowel'},
    {k:'ㅝ', r:'wo',  m:'vowel'},
    {k:'ㅞ', r:'we',  m:'vowel'},
    {k:'ㅟ', r:'wi',  m:'vowel'},
    {k:'ㅢ', r:'ui',  m:'vowel'},
    {k:'ㄲ', r:'kk',  m:'tense consonant'},
    {k:'ㄸ', r:'tt',  m:'tense consonant'},
    {k:'ㅃ', r:'pp',  m:'tense consonant'},
    {k:'ㅆ', r:'ss',  m:'tense consonant'},
    {k:'ㅉ', r:'jj',  m:'tense consonant'},
  ],
  2: [ // syllables
    {k:'가', r:'ga',  m:''},
    {k:'나', r:'na',  m:''},
    {k:'다', r:'da',  m:''},
    {k:'라', r:'ra',  m:''},
    {k:'마', r:'ma',  m:''},
    {k:'바', r:'ba',  m:''},
    {k:'사', r:'sa',  m:''},
    {k:'아', r:'a',   m:''},
    {k:'자', r:'ja',  m:''},
    {k:'하', r:'ha',  m:''},
    {k:'한', r:'han', m:'Korea/one'},
    {k:'글', r:'geul',m:'writing'},
    {k:'고', r:'go',  m:''},
    {k:'도', r:'do',  m:''},
    {k:'보', r:'bo',  m:''},
    {k:'소', r:'so',  m:''},
    {k:'오', r:'o',   m:''},
    {k:'우', r:'u',   m:''},
    {k:'이', r:'i',   m:'this/name suffix'},
    {k:'지', r:'ji',  m:''},
    {k:'기', r:'gi',  m:''},
    {k:'미', r:'mi',  m:'beauty'},
    {k:'시', r:'si',  m:''},
    {k:'니', r:'ni',  m:''},
    {k:'리', r:'ri',  m:''},
    {k:'수', r:'su',  m:'number'},
    {k:'두', r:'du',  m:'two'},
    {k:'구', r:'gu',  m:'nine'},
    {k:'투', r:'tu',  m:''},
    {k:'물', r:'mul', m:'water'},
    {k:'까', r:'kka', m:''},
    {k:'따', r:'tta', m:''},
    {k:'빠', r:'ppa', m:'fast / dad (informal)'},
    {k:'싸', r:'ssa', m:'cheap / fight'},
    {k:'짜', r:'jja', m:'salty'},
    {k:'와', r:'wa',  m:'come / wow'},
    {k:'왜', r:'wae', m:'why'},
    {k:'위', r:'wi',  m:'above / stomach'},
    {k:'의', r:'ui',  m:'\'s (possessive particle)'},
    {k:'뭐', r:'mwo', m:'what'},
    {k:'봐', r:'bwa', m:'see'},
    {k:'쉬', r:'swi', m:'rest'},
    {k:'뛰', r:'twi',  m:'jump'},
  ],
  3: [ // short words
    {k:'하늘', r:'ha-neul', m:'sky'},
    {k:'바다', r:'ba-da',   m:'sea'},
    {k:'나무', r:'na-mu',   m:'tree'},
    {k:'사람', r:'sa-ram',  m:'person'},
    {k:'물고기', r:'mul-go-gi', m:'fish'},
    {k:'고양이', r:'go-yang-i', m:'cat'},
    {k:'강아지', r:'gang-a-ji', m:'puppy/dog'},
    {k:'사과', r:'sa-gwa',  m:'apple'},
    {k:'집', r:'jip',      m:'house/home'},
    {k:'책', r:'chaek',    m:'book'},
    {k:'밥', r:'bap',      m:'rice/meal'},
    {k:'물', r:'mul',      m:'water'},
    {k:'불', r:'bul',      m:'fire'},
    {k:'산', r:'san',      m:'mountain'},
    {k:'길', r:'gil',      m:'road/path'},
    {k:'꽃', r:'kkot',     m:'flower'},
    {k:'눈', r:'nun',      m:'eye/snow'},
    {k:'손', r:'son',      m:'hand'},
    {k:'발', r:'bal',      m:'foot'},
    {k:'입', r:'ip',       m:'mouth'},
    {k:'배', r:'bae',      m:'belly/pear/ship'},
    {k:'코', r:'ko',       m:'nose'},
    {k:'귀', r:'gwi',      m:'ear'},
    {k:'몸', r:'mom',      m:'body'},
    {k:'마음', r:'ma-eum',  m:'heart/mind'},
    {k:'시간', r:'si-gan',  m:'time'},
    {k:'음악', r:'eum-ak',  m:'music'},
    {k:'학교', r:'hak-gyo', m:'school'},
    {k:'친구', r:'chin-gu', m:'friend'},
    {k:'가족', r:'ga-jok',  m:'family'},
    {k:'사랑', r:'sa-rang',  m:'love'},
    {k:'이름', r:'i-reum',   m:'name'},
    {k:'나이', r:'na-i',     m:'age'},
    {k:'남자', r:'nam-ja',   m:'man'},
    {k:'여자', r:'yeo-ja',   m:'woman'},
    {k:'아이', r:'a-i',      m:'child'},
    {k:'아기', r:'a-gi',     m:'baby'},
    {k:'엄마', r:'eom-ma',   m:'mom'},
    {k:'아빠', r:'a-ppa',    m:'dad'},
    {k:'나라', r:'na-ra',    m:'country'},
    {k:'도시', r:'do-si',    m:'city'},
    {k:'강', r:'gang',       m:'river'},
    {k:'해', r:'hae',        m:'sun / year'},
    {k:'달', r:'dal',        m:'moon / month'},
    {k:'별', r:'byeol',      m:'star'},
    {k:'비', r:'bi',         m:'rain'},
    {k:'바람', r:'ba-ram',   m:'wind'},
    {k:'날씨', r:'nal-ssi',  m:'weather'},
    {k:'차', r:'cha',        m:'car / tea'},
    {k:'버스', r:'beo-seu',  m:'bus'},
    {k:'음식', r:'eum-sik',  m:'food'},
    {k:'빵', r:'ppang',      m:'bread'},
    {k:'우유', r:'u-yu',     m:'milk'},
    {k:'옷', r:'ot',         m:'clothes'},
    {k:'돈', r:'don',        m:'money'},
    {k:'노래', r:'no-rae',   m:'song'},
    {k:'춤', r:'chum',       m:'dance'},
    {k:'영화', r:'yeong-hwa', m:'movie'},
    {k:'여행', r:'yeo-haeng', m:'travel'},
    {k:'운동', r:'un-dong',  m:'exercise / sport'},
    {k:'학생', r:'hak-saeng', m:'student'},
    {k:'의사', r:'ui-sa',    m:'doctor'},
    {k:'가게', r:'ga-ge',    m:'store / shop'},
  ],
  4: [ // micro sentences
    {k:'안녕하세요', r:'an-nyeong-ha-se-yo', m:'Hello (formal)'},
    {k:'감사합니다', r:'gam-sa-ham-ni-da',   m:'Thank you'},
    {k:'괜찮아요',   r:'gwaen-chan-a-yo',    m:'It\'s okay'},
    {k:'모르겠어요', r:'mo-reu-ge-sseo-yo',  m:'I don\'t know'},
    {k:'저는 학생이에요', r:'jeo-neun hak-saeng-i-e-yo', m:'I am a student'},
    {k:'이름이 뭐예요?', r:'i-reum-i mwo-ye-yo', m:'What is your name?'},
    {k:'반갑습니다', r:'ban-gap-seum-ni-da', m:'Nice to meet you'},
    {k:'잘 지내요?', r:'jal ji-nae-yo',      m:'How are you?'},
    {k:'네, 맞아요', r:'ne, ma-ja-yo',       m:'Yes, that\'s right'},
    {k:'아니요', r:'a-ni-yo',               m:'No'},
    {k:'잠깐만요', r:'jam-kkan-man-yo',      m:'Just a moment'},
    {k:'천천히요', r:'cheon-cheon-hi-yo',    m:'Slowly please'},
    {k:'다시 말해 주세요', r:'da-si mal-hae ju-se-yo', m:'Please say it again'},
    {k:'한국어를 배워요', r:'han-gu-geo-reul bae-wo-yo', m:'I am learning Korean'},
    {k:'물 주세요', r:'mul ju-se-yo',        m:'Water please'},
    {k:'얼마예요?', r:'eol-ma-ye-yo',        m:'How much is it?'},
    {k:'화장실이 어디예요?', r:'hwa-jang-si-ri eo-di-ye-yo', m:'Where is the bathroom?'},
    {k:'도와주세요', r:'do-wa-ju-se-yo',     m:'Please help me'},
    {k:'좋아요', r:'jo-a-yo',               m:'I like it / It\'s good'},
    {k:'싫어요', r:'si-reo-yo',             m:'I don\'t like it'},
    {k:'안녕히 가세요', r:'an-nyeong-hi ga-se-yo',   m:'Goodbye (to person leaving)'},
    {k:'잘 자요',       r:'jal ja-yo',               m:'Good night'},
    {k:'맛있어요',      r:'ma-si-sseo-yo',            m:'It\'s delicious'},
    {k:'배고파요',      r:'bae-go-pa-yo',             m:'I\'m hungry'},
    {k:'배불러요',      r:'bae-bul-leo-yo',           m:'I\'m full'},
    {k:'이거 주세요',   r:'i-geo ju-se-yo',           m:'I\'ll have this'},
    {k:'계산해 주세요', r:'gye-san-hae ju-se-yo',     m:'Bill please'},
    {k:'피곤해요',      r:'pi-gon-hae-yo',            m:'I\'m tired'},
    {k:'아파요',        r:'a-pa-yo',                  m:'I\'m sick / It hurts'},
    {k:'바빠요',        r:'ba-ppa-yo',                m:'I\'m busy'},
    {k:'심심해요',      r:'sim-sim-hae-yo',           m:'I\'m bored'},
    {k:'알겠어요',      r:'al-ge-sseo-yo',            m:'I understand / Got it'},
    {k:'미안해요',      r:'mi-an-hae-yo',             m:'I\'m sorry (casual)'},
    {k:'죄송합니다',    r:'joe-song-ham-ni-da',       m:'I\'m sorry (formal)'},
    {k:'실례합니다',    r:'sil-lye-ham-ni-da',        m:'Excuse me'},
    {k:'축하해요',      r:'chu-ka-hae-yo',            m:'Congratulations'},
    {k:'잘했어요',      r:'jal-hae-sseo-yo',          m:'Good job / Well done'},
    {k:'정말요?',       r:'jeong-mal-yo',             m:'Really?'},
    {k:'왜요?',         r:'wae-yo',                   m:'Why?'},
    {k:'몇 시예요?',    r:'myeot si-ye-yo',           m:'What time is it?'},
    {k:'얼마나 걸려요?', r:'eol-ma-na geol-lyeo-yo',  m:'How long does it take?'},
    {k:'영어 하세요?',  r:'yeong-eo ha-se-yo',        m:'Do you speak English?'},
    {k:'와이파이 있어요?', r:'wa-i-pa-i i-sseo-yo',   m:'Is there WiFi?'},
    {k:'사진 찍어도 돼요?', r:'sa-jin jji-geo-do dwae-yo', m:'Can I take a photo?'},
    {k:'조심하세요',    r:'jo-sim-ha-se-yo',          m:'Be careful / Take care'},
    {k:'내일 봐요',     r:'nae-il bwa-yo',            m:'See you tomorrow'},
  ],
};

const LEVEL_NAMES = { 1:'Letters', 2:'Syllables', 3:'Words', 4:'Sentences' };

// ── State ─────────────────────────────────────────────────────────────────────

let config = { level: 1, timer: 0, rounds: 10 };
let session = { queue: [], idx: 0, grades: [], timerHandle: null, timerRemaining: 0 };

function saveConfig() {
  localStorage.setItem('hangul-config', JSON.stringify(config));
}

(function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem('hangul-config'));
    if (!saved) return;
    if (saved.level) config.level = saved.level;
    if (saved.timer !== undefined) config.timer = saved.timer;
    if (saved.rounds) config.rounds = saved.rounds;
  } catch (e) {}
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SCREENS = ['setup','flash','results','theory','quiz','quizResults'];

const SCREEN_DISPLAY = { setup: 'grid' };

function show(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? (SCREEN_DISPLAY[s] || 'flex') : 'none';
  });
}

// ── Setup interactions ────────────────────────────────────────────────────────

document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    config.level = +btn.dataset.level;
    saveConfig();
  });
});

document.querySelectorAll('.timer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    config.timer = +btn.dataset.timer;
    saveConfig();
  });
});

const slider = document.getElementById('roundSlider');
const roundVal = document.getElementById('roundVal');
slider.addEventListener('input', () => {
  roundVal.textContent = slider.value;
  config.rounds = +slider.value;
  saveConfig();
});

// Apply loaded config to UI
document.querySelectorAll('.level-btn').forEach(b => b.classList.toggle('active', +b.dataset.level === config.level));
document.querySelectorAll('.timer-btn').forEach(b => b.classList.toggle('active', +b.dataset.timer === config.timer));
slider.value = config.rounds;
roundVal.textContent = config.rounds;

document.getElementById('startBtn').addEventListener('click', () => {
  if (activeTab === 'quiz') startQuiz();
  else startSession();
});

// ── Session logic ─────────────────────────────────────────────────────────────

function startSession() {
  const pool = DATA[config.level];
  session.queue = shuffle(pool).slice(0, config.rounds);
  session.idx = 0;
  session.grades = [];
  show('flash');
  document.getElementById('levelLabel').textContent =
    `Level ${config.level} · ${LEVEL_NAMES[config.level]}`;
  showCard();
}

function showCard() {
  clearTimer();
  const card = session.queue[session.idx];
  const total = session.queue.length;
  const current = session.idx + 1;

  document.getElementById('cardCounter').textContent = `${current} / ${total}`;
  document.getElementById('progressBar').style.width = `${((current - 1) / total) * 100}%`;

  const flashCard = document.getElementById('flashCard');
  flashCard.classList.remove('revealed');
  document.getElementById('koreanText').textContent = card.k;
  document.getElementById('romanText').textContent = card.r;
  document.getElementById('meaningText').textContent = card.m || '';

  flashCard.classList.remove('pop');
  void flashCard.offsetWidth; // reflow
  flashCard.classList.add('pop');

  setGradeButtons(false);

  if (config.timer > 0) {
    document.getElementById('timerBarWrap').style.display = 'block';
    startTimer();
  } else {
    document.getElementById('timerBarWrap').style.display = 'none';
  }
}

function revealCard() {
  document.getElementById('flashCard').classList.add('revealed');
  clearTimer();
  setGradeButtons(true);
}

function setGradeButtons(enabled) {
  document.getElementById('btnHard').disabled = !enabled;
  document.getElementById('btnOk').disabled   = !enabled;
  document.getElementById('btnEasy').disabled  = !enabled;
}

document.getElementById('flashCard').addEventListener('click', () => {
  if (!document.getElementById('flashCard').classList.contains('revealed')) {
    revealCard();
  }
});

document.getElementById('speakBtn').addEventListener('click', e => {
  e.stopPropagation();
  speak(document.getElementById('koreanText').textContent, e.currentTarget);
});

['btnHard','btnOk','btnEasy'].forEach((id, i) => {
  const grades = ['hard','ok','easy'];
  document.getElementById(id).addEventListener('click', () => {
    session.grades.push({ card: session.queue[session.idx], grade: grades[i] });
    session.idx++;
    if (session.idx < session.queue.length) {
      showCard();
    } else {
      showResults();
    }
  });
});

// ── Timer ─────────────────────────────────────────────────────────────────────

function startTimer() {
  const bar = document.getElementById('timerBar');
  const total = config.timer * 1000;
  let start = null;

  function tick(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const pct = Math.max(0, 1 - elapsed / total);
    bar.style.width = `${pct * 100}%`;
    bar.style.background = pct > 0.4 ? '#acd157' : pct > 0.15 ? '#ffc300' : '#ffadad';

    if (pct > 0) {
      session.timerHandle = requestAnimationFrame(tick);
    } else {
      revealCard();
    }
  }

  session.timerHandle = requestAnimationFrame(tick);
}

function clearTimer() {
  if (session.timerHandle) {
    cancelAnimationFrame(session.timerHandle);
    session.timerHandle = null;
  }
  document.getElementById('timerBar').style.width = '100%';
  document.getElementById('timerBar').style.background = 'var(--green)';
}

// ── Results ───────────────────────────────────────────────────────────────────

function showResults() {
  clearTimer();
  const counts = { hard: 0, ok: 0, easy: 0 };
  const missed = [];

  session.grades.forEach(g => {
    counts[g.grade]++;
    if (g.grade === 'hard') missed.push(g.card);
  });

  const total = session.grades.length;
  const pct = Math.round(((counts.ok + counts.easy) / total) * 100);

  document.getElementById('scoreText').textContent = `${pct}%`;
  document.getElementById('scoreSubtext').textContent =
    pct === 100 ? '🎉 Perfect round!' :
    pct >= 80   ? 'Great work!' :
    pct >= 60   ? 'Keep it up!' :
    'Practice makes perfect!';

  document.getElementById('statHard').textContent = counts.hard;
  document.getElementById('statOk').textContent   = counts.ok;
  document.getElementById('statEasy').textContent  = counts.easy;

  const missedItems = document.getElementById('missedItems');
  missedItems.innerHTML = '';
  const section = document.getElementById('missedSection');
  section.style.display = missed.length > 0 ? 'block' : 'none';

  missed.forEach(c => {
    const el = document.createElement('div');
    el.className = 'missed-item';
    el.innerHTML = `<span>${c.k}</span><span class="rom">${c.r}${c.m ? ' · ' + c.m : ''}</span>`;
    missedItems.appendChild(el);
  });

  const nextBtn = document.getElementById('btnNext');
  nextBtn.textContent = config.level < 4 ? 'Next level →' : 'Restart →';

  show('results');
}

document.getElementById('btnRetry').addEventListener('click', () => {
  startSession();
});

document.getElementById('btnNext').addEventListener('click', () => {
  if (config.level < 4) {
    config.level++;
    document.querySelectorAll('.level-btn').forEach(b => {
      b.classList.toggle('active', +b.dataset.level === config.level);
    });
  }
  startSession();
});

document.getElementById('btnLeave').addEventListener('click', () => {
  clearTimer();
  show('setup');
});

document.getElementById('btnHome').addEventListener('click', () => {
  show('setup');
});

// ── Quiz ──────────────────────────────────────────────────────────────────────

let quizSession = { queue: [], idx: 0, results: [], timerHandle: null };

function getOptionLabel(card) {
  if (config.level === 1) return card.r;
  if (config.level === 2) return card.m ? `${card.r} · ${card.m}` : card.r;
  return card.m;
}

function startQuiz() {
  const pool = DATA[config.level];
  quizSession.queue = shuffle(pool).slice(0, config.rounds);
  quizSession.idx = 0;
  quizSession.results = [];
  show('quiz');
  document.getElementById('quizLevelLabel').textContent =
    `Level ${config.level} · ${LEVEL_NAMES[config.level]}`;
  showQuizQuestion();
}

function startQuizTimer(correctK) {
  const bar = document.getElementById('quizTimerBar');
  const total = config.timer * 1000;
  let start = null;

  function tick(ts) {
    if (!start) start = ts;
    const pct = Math.max(0, 1 - (ts - start) / total);
    bar.style.width = `${pct * 100}%`;
    bar.style.background = pct > 0.4 ? '#acd157' : pct > 0.15 ? '#ffc300' : '#ffadad';
    if (pct > 0) {
      quizSession.timerHandle = requestAnimationFrame(tick);
    } else {
      handleOptionClick(null, false, correctK);
    }
  }

  quizSession.timerHandle = requestAnimationFrame(tick);
}

function clearQuizTimer() {
  if (quizSession.timerHandle) {
    cancelAnimationFrame(quizSession.timerHandle);
    quizSession.timerHandle = null;
  }
  const bar = document.getElementById('quizTimerBar');
  if (bar) { bar.style.width = '100%'; bar.style.background = 'var(--green)'; }
}

function showQuizQuestion() {
  clearQuizTimer();
  const card = quizSession.queue[quizSession.idx];
  const total = quizSession.queue.length;
  const current = quizSession.idx + 1;

  document.getElementById('quizCounter').textContent = `${current} / ${total}`;
  document.getElementById('quizProgressBar').style.width = `${((current - 1) / total) * 100}%`;
  document.getElementById('quizKoreanText').textContent = card.k;
  document.getElementById('quizNextBtn').style.display = 'none';

  const pool = DATA[config.level];
  const distractors = shuffle(pool.filter(c => c.k !== card.k)).slice(0, 3);
  const options = shuffle([card, ...distractors]);

  const container = document.getElementById('quizOptions');
  container.className = 'quiz-options' + (config.level <= 2 ? ' cols-2' : '');
  container.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = getOptionLabel(opt);
    btn.dataset.k = opt.k;
    btn.addEventListener('click', () => handleOptionClick(btn, opt.k === card.k, card.k));
    container.appendChild(btn);
  });

  if (config.timer > 0) {
    document.getElementById('quizTimerBarWrap').style.display = 'block';
    startQuizTimer(card.k);
  } else {
    document.getElementById('quizTimerBarWrap').style.display = 'none';
  }
}

function handleOptionClick(selectedBtn, isCorrect, correctK) {
  clearQuizTimer();
  document.getElementById('quizOptions').querySelectorAll('.quiz-option').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.k === correctK) btn.classList.add('correct');
  });
  if (selectedBtn && !isCorrect) selectedBtn.classList.add('wrong');
  isCorrect ? playCorrect() : playWrong();
  quizSession.results.push({ card: quizSession.queue[quizSession.idx], correct: isCorrect });
  document.getElementById('quizNextBtn').style.display = 'block';
}

function showQuizResults() {
  const total = quizSession.results.length;
  const correct = quizSession.results.filter(r => r.correct).length;

  document.getElementById('quizScoreText').textContent = `${correct} / ${total}`;
  document.getElementById('quizScoreSubtext').textContent =
    correct === total     ? '🎉 Perfect!' :
    correct >= total * 0.8 ? 'Great work!' :
    correct >= total * 0.6 ? 'Keep it up!' :
    'Practice makes perfect!';

  const missed = quizSession.results.filter(r => !r.correct).map(r => r.card);
  const missedItems = document.getElementById('quizMissedItems');
  missedItems.innerHTML = '';
  document.getElementById('quizMissedSection').style.display = missed.length ? 'block' : 'none';

  missed.forEach(c => {
    const el = document.createElement('div');
    el.className = 'missed-item';
    el.innerHTML = `<span>${c.k}</span><span class="rom">${c.r}${c.m ? ' · ' + c.m : ''}</span>`;
    missedItems.appendChild(el);
  });

  show('quizResults');
}

document.getElementById('quizNextBtn').addEventListener('click', () => {
  quizSession.idx++;
  if (quizSession.idx < quizSession.queue.length) showQuizQuestion();
  else showQuizResults();
});

document.getElementById('quizSpeakBtn').addEventListener('click', e => {
  e.stopPropagation();
  speak(document.getElementById('quizKoreanText').textContent, e.currentTarget);
});

document.getElementById('quizLeaveBtn').addEventListener('click', () => { clearQuizTimer(); show('setup'); });

// ── Theory audio ──────────────────────────────────────────────────────────────

document.getElementById('theory').addEventListener('click', e => {
  const cell = e.target.closest('.alpha-cell, .syl-box');
  if (cell) {
    const charEl = cell.querySelector('.char, .big');
    if (charEl) speak(charEl.textContent.trim());
    return;
  }
  const row = e.target.closest('.alpha-table tr');
  if (row) {
    const charTd = row.querySelector('.char');
    if (charTd) speak(charTd.textContent.trim());
  }
});
document.getElementById('quizBtnHome').addEventListener('click', () => show('setup'));
document.getElementById('quizBtnRetry').addEventListener('click', () => startQuiz());

// init
show('setup');

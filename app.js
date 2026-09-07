/* ===== Lillaフェス2026 出演順ルーレット ===== */
(function () {
  'use strict';

  /* ---------------- 出演者データ（名前, 形態, 曲） ---------------- */
  const DEFAULT_ROSTER = `
フジモンヒトシ, プロバンド, 青い瞳のエリス安全地帯
Shuji, ギター弾き語り, ドライフラワー/優里
かず, プロバンド, 誕生/中島みゆき
みなこ, プロバンド, 恋のスーパーボール/aiko
tailsnana, プロバンド, sign/ミスチル
yuki, 弾き語り+プロバンド, 一輪/little glee monster
HARU, 弾き語り+プロバンド, Hotel California ／Eagles
ミキコ, プロバンド, 「たからもの」ナオト・インティライミ
Cookie, プロバンド, Stand by me
Haruko, プロバンド, Beautiful/ Anne-Marie
ふーじー, プロバンド, 一粒の私 (Original)
砂倉ほたる, プロバンド, 好きが辞められない/砂倉ほたる
なみ, プロバンド, 才能が無いから何だ/甲斐田晴
マツダレコード, 弾き語り+プロバンド, DO YOU REMEMBER ROCK'N'ROLL RADIO? / ラモーンズ
みき, プロバンド, HANABI /ミスチル, 20-25
TORAI, ギター弾き語り, オリジナル曲
Kotomi, プロバンド, Mela! /緑黄色社会
齊藤公美子, プロバンド, キラーチューン/東京事変
ななみ, 弾き語り+プロバンド, 人生は夢だらけ／椎名林檎
カズヒコ, 弾き語り+プロバンド, Just the Way You Are/ BILLY JOEL
ぴぃ, プロバンド, Girl on Fire / Alicia Keys
寺川香純, プロバンド, more than words/羊文学
かな, プロバンド, 初恋サイダー　Buono!, 前半
水澤洸樹, プロバンド, Uru/あなたがいることで(原曲から−6)
足立匠, プロバンド, wherever you are/ONE OK ROCK(原曲から−2)
奥山聡, 弾き語り+プロバンド, 春よ、来い / 松任谷由実, 1
西井 祥太, ギター弾き語り, 夜行/ヨルシカ
aSa, プロバンド, ラブストーリー/安室奈美恵
葉月, プロバンド, グラマラススカイ　中島美嘉, 33-38
尾崎裕大, プロバンド, Tokimeki/ Vaundy
おうか, プロバンド, ノーダウト/Official髭男dism
ゆめ, 弾き語り+プロバンド, ヒカリへ/miwa
東埜美紗子, プロバンド, 茜さす/Aimer
yume, 弾き語り+プロバンド, 私が選んだもの／『ユイカ』
とくゆー, プロバンド, ドライフラワー　優里
tama, ギター弾き語り, 春泥棒/ヨルシカ
さゆ, プロバンド, Dance The Night Away (TWICE)
あい, プロバンド, 完璧主義で☆/FRUITSZIPPER
中田智子, プロバンド, 少年時代/宇多田ヒカル(井上陽水さんのカバー)原曲から＋6
`.trim();

  /* ---------------- 小道具 ---------------- */
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const COLORS = ['#FF3D7F', '#FFC93C', '#46E0FF', '#A162FF', '#FFF6EA'];

  /* ---------------- 入力のパース ---------------- */
  function parseLine(line) {
    let s = line.replace(/　/g, (m) => m).trim();
    if (!s) return null;
    let parts = s.indexOf('\t') >= 0 ? s.split('\t') : s.split(/[,，]/);
    parts = parts.map((p) => p.trim());
    if (parts.length >= 3 && /^\d+$/.test(parts[0])) parts.shift();
    if (parts.length === 1) parts[0] = parts[0].replace(/^\d+[.．)）、]\s*/, '');
    parts = parts.filter((p, i) => i === 0 || p !== '');
    if (!parts[0]) return null;
    const isKind = (t) => /弾き語り|バンド|ピアノ|アカペラ|ダンス|DJ/.test(t || '');
    let pin = '';
    if (parts.length >= 4 && POS_RE.test(parts[parts.length - 1])) pin = parts.pop().trim();
    if (parts.length >= 3) return { name: parts[0], kind: parts[1], song: parts.slice(2).join(', '), pin: pin };
    if (parts.length === 2) {
      return isKind(parts[1])
        ? { name: parts[0], kind: parts[1], song: '', pin: pin }
        : { name: parts[0], kind: '', song: parts[1], pin: pin };
    }
    return { name: parts[0], kind: '', song: '', pin: pin };
  }
  const POS_RE = /^(?:\d+\s*[-–—〜~]\s*\d+|\d+|前半|後半)$/;
  const parseRoster = (text) => text.split(/\r?\n/).map(parseLine).filter(Boolean);

  // 「番手の指定」を [最小, 最大] に直す。指定なしは null
  function rangeOf(a, N) {
    if (!a || !a.pin) return null;
    N = N || S.acts.length;
    const sp = S.split > 0 && S.split < N ? S.split : 0;
    const p = String(a.pin).trim();
    if (p === '前半') return sp ? [1, sp] : [1, N];
    if (p === '後半') return sp ? [sp + 1, N] : [1, N];
    const m = p.match(/^(\d+)\s*[-–—〜~]\s*(\d+)$/);
    if (m) {
      const lo = Math.max(1, Math.min(+m[1], +m[2]));
      const hi = Math.min(N, Math.max(+m[1], +m[2]));
      return hi >= lo ? [lo, hi] : null;
    }
    const n = parseInt(p, 10);
    return n >= 1 && n <= N ? [n, n] : null;
  }
  const isPinAct = (a, N) => {
    const r = rangeOf(a, N);
    return !!r && r[0] === r[1];
  };
  const allows = (a, i, N) => {
    const r = rangeOf(a, N);
    return !r || (i + 1 >= r[0] && i + 1 <= r[1]);
  };

  // 残りの出演者を、残りの枠に矛盾なく割り当てる（きつい指定の人から埋める）
  function buildAssignment(openSlots, acts, N) {
    if (!acts.length) return {};
    const width = (a) => openSlots.filter((i) => allows(a, i, N)).length;
    for (let attempt = 0; attempt < 300; attempt++) {
      const order = shuffle(acts).sort((x, y) => width(x) - width(y));
      const free = openSlots.slice();
      const map = {};
      let ok = true;
      for (const a of order) {
        const cand = free.filter((i) => allows(a, i, N));
        if (!cand.length) {
          ok = false;
          break;
        }
        const slot = pick(cand);
        map[slot] = a;
        free.splice(free.indexOf(slot), 1);
      }
      if (ok) return map;
    }
    return null;
  }
  const rosterToText = (acts) =>
    acts
      .map((a) => {
        const base = [a.name, a.kind, a.song].filter(Boolean).join(', ');
        return a.pin ? base + ', ' + a.pin : base;
      })
      .join('\n');

  function kindClass(k) {
    if (!k) return '';
    if (/[+＋&＆]/.test(k)) return 'mix';
    if (/弾き語り|ソロ|アカペラ/.test(k)) return 'solo';
    return 'pro';
  }
  function visualLen(s) {
    let n = 0;
    for (const c of s) n += /[\x20-\x7E]/.test(c) ? 0.55 : 1;
    return n;
  }
  function sizeClass(name) {
    const n = visualLen(name);
    return n <= 6 ? 's-xl' : n <= 11 ? 's-lg' : 's-md';
  }

  /* ---------------- 効果音（合成・音源ファイル不要） ---------------- */
  const SFX = {
    on: true,
    ctx: null,
    master: null,
    _noise: null,
    ready() {
      if (!this.on) return null;
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.9;
          this.master.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      } catch (e) {
        return null;
      }
    },
    noise() {
      const c = this.ctx;
      if (this._noise) return this._noise;
      const len = c.sampleRate * 2;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noise = buf;
      return buf;
    },
    tick(v) {
      const c = this.ready();
      if (!c) return;
      const t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = 1250 + Math.random() * 420;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.075 * (v || 1), t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 0.07);
    },
    whoosh() {
      const c = this.ready();
      if (!c) return;
      const t = c.currentTime;
      const s = c.createBufferSource();
      s.buffer = this.noise();
      const lp = c.createBiquadFilter();
      lp.type = 'bandpass';
      lp.Q.value = 1.4;
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.exponentialRampToValueAtTime(4200, t + 0.5);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.32, t + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      s.connect(lp).connect(g).connect(this.master);
      s.start(t);
      s.stop(t + 0.7);
    },
    roll(dur) {
      const c = this.ready();
      if (!c) return function () {};
      const t = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = this.noise();
      src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1900;
      bp.Q.value = 0.85;
      const amp = c.createGain();
      amp.gain.value = 0.1;
      const lfo = c.createOscillator();
      lfo.type = 'sawtooth';
      lfo.frequency.setValueAtTime(52, t);
      lfo.frequency.linearRampToValueAtTime(13, t + dur);
      const lfoG = c.createGain();
      lfoG.gain.value = 0.085;
      lfo.connect(lfoG).connect(amp.gain);
      const env = c.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.85, t + 0.3);
      env.gain.setValueAtTime(0.85, t + Math.max(0.4, dur - 0.35));
      env.gain.linearRampToValueAtTime(0.05, t + dur);
      src.connect(bp).connect(amp).connect(env).connect(this.master);
      src.start(t);
      lfo.start(t);
      return function stop() {
        try {
          const now = c.currentTime;
          env.gain.cancelScheduledValues(now);
          env.gain.setValueAtTime(env.gain.value, now);
          env.gain.linearRampToValueAtTime(0.0001, now + 0.08);
          src.stop(now + 0.14);
          lfo.stop(now + 0.14);
        } catch (e) {}
      };
    },
    fanfare(big) {
      const c = this.ready();
      if (!c) return;
      const t0 = c.currentTime;
      const notes = big ? [0, 4, 7, 12, 16, 19, 24] : [0, 4, 7, 12];
      const step = big ? 0.085 : 0.075;
      notes.forEach((n, i) => {
        const t = t0 + i * step;
        const last = i === notes.length - 1;
        const dur = last ? (big ? 1.7 : 1.0) : 0.34;
        ['sawtooth', 'triangle'].forEach((type, k) => {
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = type;
          o.frequency.value = 523.25 * Math.pow(2, n / 12) * (k ? 1.005 : 1);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(k ? 0.045 : 0.08, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          o.connect(g).connect(this.master);
          o.start(t);
          o.stop(t + dur + 0.05);
        });
      });
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(155, t0);
      o.frequency.exponentialRampToValueAtTime(42, t0 + 0.22);
      g.gain.setValueAtTime(0.45, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
      o.connect(g).connect(this.master);
      o.start(t0);
      o.stop(t0 + 0.45);

      const s = c.createBufferSource();
      s.buffer = this.noise();
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5200;
      const cg = c.createGain();
      cg.gain.setValueAtTime(0.26, t0);
      cg.gain.exponentialRampToValueAtTime(0.0001, t0 + (big ? 2.0 : 1.1));
      s.connect(hp).connect(cg).connect(this.master);
      s.start(t0);
      s.stop(t0 + 2.2);
    },
  };

  /* ---------------- 紙吹雪・リング（canvas） ---------------- */
  const FX = {
    cv: null,
    ctx: null,
    parts: [],
    rings: [],
    motes: [],
    running: false,
    init() {
      this.cv = $('#fx');
      this.ctx = this.cv.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
      for (let i = 0; i < 34; i++) this.motes.push(this.newMote(true));
      this.start();
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.start();
      });
    },
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.cv.width = this.w * dpr;
      this.cv.height = this.h * dpr;
      this.cv.style.width = this.w + 'px';
      this.cv.style.height = this.h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    newMote(spread) {
      return {
        x: Math.random() * this.w,
        y: spread ? Math.random() * this.h : this.h + 10,
        r: rand(0.7, 2.2),
        vy: rand(-0.42, -0.12),
        vx: rand(-0.15, 0.15),
        a: rand(0.12, 0.45),
        c: pick(COLORS),
      };
    },
    add(p) {
      if (this.parts.length < 1100) this.parts.push(p);
    },
    burst(x, y, n, opt) {
      opt = opt || {};
      const spd = opt.speed || 15;
      const colors = opt.colors || COLORS;
      for (let i = 0; i < n; i++) {
        const a = opt.angle != null ? opt.angle + rand(-opt.spread, opt.spread) : rand(0, Math.PI * 2);
        const v = rand(spd * 0.25, spd);
        this.add({
          x: x,
          y: y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          w: rand(5, 13),
          h: rand(7, 18),
          rot: rand(0, 6.28),
          vr: rand(-0.3, 0.3),
          flip: rand(0, 6.28),
          vf: rand(0.12, 0.34),
          c: pick(colors),
          life: rand(90, 165),
          max: 165,
          g: rand(0.2, 0.34),
        });
      }
      this.start();
    },
    ring(x, y, color) {
      this.rings.push({ x: x, y: y, r: 10, vr: rand(9, 13), life: 1, c: color || '#FFF6EA' });
      this.start();
    },
    rain(n) {
      for (let i = 0; i < n; i++) {
        this.add({
          x: Math.random() * this.w,
          y: rand(-this.h * 0.7, -20),
          vx: rand(-1.2, 1.2),
          vy: rand(2.5, 6),
          w: rand(5, 12),
          h: rand(8, 20),
          rot: rand(0, 6.28),
          vr: rand(-0.22, 0.22),
          flip: rand(0, 6.28),
          vf: rand(0.1, 0.28),
          c: pick(COLORS),
          life: 320,
          max: 320,
          g: 0.055,
        });
      }
      this.start();
    },
    start() {
      if (this.running) return;
      this.running = true;
      requestAnimationFrame(this.loop.bind(this));
    },
    loop() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);

      // ちいさな光の粒
      for (const m of this.motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -12) Object.assign(m, this.newMote(false));
        ctx.globalAlpha = m.a;
        ctx.fillStyle = m.c;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, 6.2832);
        ctx.fill();
      }

      // 拡がる光の輪
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.r += r.vr;
        r.vr *= 0.955;
        r.life -= 0.016;
        if (r.life <= 0) {
          this.rings.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = r.life * 0.55;
        ctx.strokeStyle = r.c;
        ctx.lineWidth = Math.max(1, 7 * r.life);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, 6.2832);
        ctx.stroke();
      }

      // 紙吹雪
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.vy += p.g;
        p.vx *= 0.988;
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.flip += p.vf;
        p.life--;
        if (p.life <= 0 || p.y > this.h + 60) {
          this.parts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = clamp(p.life / 45, 0, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(Math.cos(p.flip), 1);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      if (document.hidden) {
        this.running = false;
        return;
      }
      requestAnimationFrame(this.loop.bind(this));
    },
  };

  /* ---------------- 状態 ---------------- */
  const KEY = 'lilla-fest-2026-roulette';
  const S = {
    acts: [], slots: [], dir: 'forward', speed: 4600, sound: true, spinning: false,
    split: 19, timeA: '14:10', timeB: '17:00',
  };
  const hasSplit = () => S.split > 0 && S.split < S.acts.length;
  const blockOf = (pos) => (hasSplit() && pos >= S.split ? 1 : 0);
  const blockName = (b) => (b ? '後半' : '前半');
  const blockTime = (b) => (b ? S.timeB : S.timeA);

  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          text: rosterToText(S.acts),
          slots: S.slots.map((a) => (a ? S.acts.indexOf(a) : null)),
          dir: S.dir,
          speed: S.speed,
          sound: S.sound,
          split: S.split,
          timeA: S.timeA,
          timeB: S.timeB,
        })
      );
    } catch (e) {}
  }
  function load() {
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {}
    if (d && d.text) {
      S.acts = parseRoster(d.text);
      S.dir = d.dir === 'reverse' ? 'reverse' : 'forward';
      S.speed = Number(d.speed) || 4600;
      S.sound = d.sound !== false;
      if (typeof d.split === 'number') S.split = d.split;
      if (d.timeA) S.timeA = d.timeA;
      if (d.timeB) S.timeB = d.timeB;
      S.slots = new Array(S.acts.length).fill(null);
      if (Array.isArray(d.slots) && d.slots.length === S.acts.length) {
        d.slots.forEach((i, k) => {
          if (typeof i === 'number' && S.acts[i]) S.slots[k] = S.acts[i];
        });
      }
      applyPins();
    } else {
      S.acts = parseRoster(DEFAULT_ROSTER);
      freshSlots();
    }
    SFX.on = S.sound;
  }

  function applyPins() {
    S.acts.forEach((a) => {
      const r = rangeOf(a, S.slots.length);
      if (r && r[0] === r[1] && !S.slots[r[0] - 1]) S.slots[r[0] - 1] = a;
    });
  }
  const isPinned = (i) => {
    const a = S.slots[i];
    if (!a) return false;
    const r = rangeOf(a, S.slots.length);
    return !!r && r[0] === r[1] && r[0] === i + 1;
  };
  const pinnedCount = () => S.slots.filter((a, i) => isPinned(i)).length;
  function freshSlots() {
    S.slots = new Array(S.acts.length).fill(null);
    applyPins();
  }
  const remaining = () => S.acts.filter((a) => S.slots.indexOf(a) < 0);
  const decidedCount = () => S.slots.filter(Boolean).length;
  function nextSlot() {
    const open = [];
    S.slots.forEach((v, i) => {
      if (!v) open.push(i);
    });
    if (!open.length) return -1;
    return S.dir === 'reverse' ? open[open.length - 1] : open[0];
  }

  /* ---------------- 画面切替 ---------------- */
  const screens = { setup: $('#screen-setup'), stage: $('#screen-stage'), result: $('#screen-result') };
  let current = 'setup';
  function show(name) {
    Object.keys(screens).forEach((k) => screens[k].classList.toggle('is-active', k === name));
    current = name;
  }

  /* ---------------- 設定画面 ---------------- */
  const elNames = $('#names');
  const elCount = $('#count');
  const elNote = $('#setup-note');

  function refreshCount() {
    const n = parseRoster(elNames.value).length;
    elCount.textContent = n;
    const sp = parseInt($('#opt-split').value, 10) || 0;
    const withPos = parseRoster(elNames.value).filter((a) => a.pin);
    const pins = withPos.filter((a) => /^\d+$/.test(String(a.pin))).length;
    const ranges = withPos.length - pins;
    const bits = [];
    if (sp > 0 && sp < n) bits.push('前半 ' + sp + ' 組 ・ 後半 ' + (n - sp) + ' 組');
    if (pins) bits.push('固定 ' + pins + ' 組');
    if (ranges) bits.push('範囲指定 ' + ranges + ' 組');
    $('#split-hint').textContent = bits.length ? '（' + bits.join(' ／ ') + '）' : '';
  }
  elNames.addEventListener('input', refreshCount);
  $('#opt-split').addEventListener('input', refreshCount);

  $('#sample').addEventListener('click', () => {
    elNames.value = DEFAULT_ROSTER;
    refreshCount();
    elNote.textContent = 'Lillaフェス2026の39組を入れ直しました。';
  });

  $('#opt-dir').addEventListener('change', (e) => {
    S.dir = e.target.value;
    save();
  });
  $('#opt-speed').addEventListener('change', (e) => {
    S.speed = Number(e.target.value);
    save();
  });
  $('#opt-sound').addEventListener('change', (e) => {
    S.sound = e.target.checked;
    SFX.on = S.sound;
    save();
  });

  $('#start').addEventListener('click', () => {
    const acts = parseRoster(elNames.value);
    if (acts.length < 2) {
      elNote.textContent = '出演者を2組以上入れてください。';
      return;
    }
    S.split = clamp(parseInt($('#opt-split').value, 10) || 0, 0, acts.length);
    S.timeA = ($('#opt-timea').value || '').trim() || '14:10';
    S.timeB = ($('#opt-timeb').value || '').trim() || '17:00';
    const same =
      acts.length === S.acts.length &&
      acts.every(
        (a, i) =>
          S.acts[i] && a.name === S.acts[i].name && a.song === S.acts[i].song && a.pin === S.acts[i].pin
      );
    if (!same) {
      S.acts = acts;
      freshSlots();
    }
    const tmp = new Array(acts.length).fill(null);
    const openAll = tmp.map((_, i) => i);
    const savedActs = S.acts;
    S.acts = acts;
    const fits = buildAssignment(openAll, acts, acts.length);
    S.acts = savedActs;
    if (!fits) {
      elNote.textContent = '番手の指定がきつすぎて全員を並べられません。範囲を広げてください。';
      return;
    }
    elNote.textContent = '';
    save();
    enterStage();
  });

  /* ---------------- ステージ ---------------- */
  const marquee = $('#marquee');
  const reel = $('#reel');
  const label = $('#label');
  const blockTag = $('#block-tag');
  const winnerBlock = $('#winner-block');
  const winnerNum = $('#winner-num');
  const winnerName = $('#winner-name');
  const winnerSong = $('#winner-song');
  const winnerBadge = $('#winner-badge');
  const winnerTag = $('#winner-tag');
  const spinBtn = $('#spin');
  const spinLabel = $('#spin-label');
  const orderList = $('#order-list');
  const beams = $('#beams');
  const flash = $('#flash');
  const stageMain = $('.stage-main');

  function enterStage() {
    show('stage');
    $('#total').textContent = S.acts.length;
    renderReelIdle();
    renderOrder();
    updateButton();
    marquee.classList.remove('is-revealed', 'is-finale', 'is-halffinale', 'is-first');
    label.textContent = decidedCount() - pinnedCount() > 0 ? 'NEXT ACT' : 'READY';
    setBlockTag(nextSlot());
  }

  function setBlockTag(pos) {
    if (pos < 0 || !hasSplit()) {
      if (!hasSplit()) blockTag.textContent = '';
      return;
    }
    const b = blockOf(pos);
    blockTag.textContent = blockName(b) + ' ・ ' + blockTime(b) + '〜';
    blockTag.dataset.block = b;
  }

  function sectionRow(b) {
    const li = document.createElement('li');
    li.className = 'order-sect';
    li.dataset.b = b;
    const t = document.createElement('span');
    t.textContent = blockName(b) + '　' + (b ? S.split + 1 : 1) + '〜' + (b ? S.slots.length : S.split) + '組';
    const time = document.createElement('b');
    time.textContent = blockTime(b) + '〜';
    li.appendChild(t);
    li.appendChild(time);
    return li;
  }

  function renderReelIdle() {
    const left = remaining();
    const names = shuffle(left.length >= 3 ? left : S.acts).slice(0, 24);
    reel.innerHTML = '';
    names.forEach((a) => {
      const d = document.createElement('div');
      d.className = 'reel-item';
      d.textContent = a.name;
      reel.appendChild(d);
    });
    reel.style.transform = 'translate3d(0,calc(-1 * var(--item-h)),0)';
    reel.style.filter = '';
  }

  function renderOrder(newIndex) {
    orderList.innerHTML = '';
    const N = S.slots.length;
    S.slots.forEach((a, i) => {
      if (hasSplit() && (i === 0 || i === S.split)) orderList.appendChild(sectionRow(i === 0 ? 0 : 1));
      const li = document.createElement('li');
      li.className = 'order-row' + (a ? ' is-filled' : ' is-empty') + (i === N - 1 ? ' is-last' : '');
      if (i === newIndex) li.classList.add('is-new');
      const no = document.createElement('span');
      no.className = 'order-no';
      no.textContent = String(i + 1).padStart(2, '0');
      const body = document.createElement('span');
      body.className = 'order-body';
      const nm = document.createElement('span');
      nm.className = 'order-name';
      nm.textContent = a ? a.name : '—';
      body.appendChild(nm);
      if (a && a.song) {
        const sg = document.createElement('span');
        sg.className = 'order-song';
        sg.textContent = a.song;
        body.appendChild(sg);
      }
      li.appendChild(no);
      li.appendChild(body);
      if (isPinned(i)) {
        const pin = document.createElement('span');
        pin.className = 'order-pin';
        pin.textContent = '固定';
        li.appendChild(pin);
      }
      orderList.appendChild(li);
      if (i === newIndex) setTimeout(() => li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    });
    $('#done').textContent = decidedCount();
  }

  function updateButton() {
    const left = remaining().length;
    const N = S.slots.length;
    const nx = nextSlot();
    const isFin = nx === N - 1;
    const isHalf = hasSplit() && nx === S.split - 1;
    spinBtn.disabled = false;
    spinBtn.classList.toggle('is-final', left === 0 || isFin);
    spinBtn.classList.toggle('is-half', !isFin && isHalf);
    if (left === 0) {
      spinLabel.textContent = '全出演順を見る';
    } else if (isFin) {
      spinLabel.textContent = '大トリを決める';
    } else if (isHalf) {
      spinLabel.textContent = '前半ラストを決める';
    } else {
      spinLabel.textContent = decidedCount() - pinnedCount() > 0 ? '次の出演者' : '回す';
    }
  }

  function pulse(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------------- 抽選 ---------------- */
  function spin() {
    if (S.spinning) return;
    const pool = remaining();
    if (!pool.length) {
      showResult();
      return;
    }
    S.spinning = true;
    spinBtn.disabled = true;
    spinLabel.textContent = '抽選中…';

    const pos = nextSlot();
    const open = [];
    S.slots.forEach((v, i) => {
      if (!v) open.push(i);
    });
    const plan = buildAssignment(open, pool, S.slots.length);
    const winner =
      (plan && plan[pos]) ||
      pick(pool.filter((a) => allows(a, pos, S.slots.length)).length
        ? pool.filter((a) => allows(a, pos, S.slots.length))
        : pool);
    setBlockTag(pos);

    marquee.classList.remove('is-revealed', 'is-finale', 'is-halffinale', 'is-first');
    marquee.classList.add('is-spinning');
    beams.classList.add('is-hot');
    label.textContent = 'SPINNING';
    label.classList.add('is-live');
    SFX.whoosh();

    // リール生成（囮＋最後に当選者）
    const decoys = pool.length >= 4 ? pool : S.acts;
    const strip = [];
    while (strip.length < 34) strip.push.apply(strip, shuffle(decoys));
    const winIndex = strip.length;
    strip.push(winner);
    strip.push.apply(strip, shuffle(decoys).slice(0, 3));

    reel.innerHTML = '';
    strip.forEach((a, i) => {
      const d = document.createElement('div');
      d.className = 'reel-item';
      d.textContent = a.name;
      if (i === winIndex) d.dataset.hit = '1';
      reel.appendChild(d);
    });
    reel.style.transform = 'translate3d(0,0,0)';

    const itemH = reel.firstElementChild.getBoundingClientRect().height || 80;
    const total = winIndex * itemH;
    const dur = S.speed;
    const stopRoll = SFX.roll(dur / 1000 + 0.15);

    let prevIdx = 0;
    let lastOff = 0;
    const t0 = performance.now();

    function frame(now) {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - t, 5);
      const off = total * e;
      const v = off - lastOff;
      lastOff = off;
      reel.style.transform = 'translate3d(0,' + -off + 'px,0)';
      reel.style.filter = v > 2 ? 'blur(' + Math.min(15, v * 0.2) + 'px)' : '';
      const idx = Math.round(off / itemH);
      if (idx !== prevIdx) {
        prevIdx = idx;
        if (v < itemH * 0.85) SFX.tick(clamp(1.4 - v / itemH, 0.45, 1.2));
      }
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        reel.style.filter = '';
        stopRoll();
        setTimeout(() => reveal(pos, winner), 190);
      }
    }
    requestAnimationFrame(frame);
  }

  function reveal(pos, act) {
    const N = S.slots.length;
    S.slots[pos] = act;
    save();

    const isFin = pos === N - 1;
    const isHalf = hasSplit() && pos === S.split - 1 && !isFin;

    marquee.classList.remove('is-spinning');
    marquee.classList.add('is-revealed');
    marquee.classList.toggle('is-finale', isFin);
    marquee.classList.toggle('is-halffinale', isHalf);
    marquee.classList.toggle('is-first', pos === 0);

    winnerBlock.textContent = hasSplit() ? blockName(blockOf(pos)) + '　' : '';
    winnerNum.textContent = pos + 1;
    winnerName.textContent = act.name;
    winnerName.className = 'winner-name ' + sizeClass(act.name);
    winnerSong.textContent = act.song || '';
    winnerBadge.textContent = act.kind || '';
    winnerBadge.dataset.kind = kindClass(act.kind);
    winnerTag.textContent = isFin
      ? '大トリ'
      : isHalf
      ? '前半ラスト'
      : pos === 0
      ? 'TOP BATTER'
      : hasSplit() && pos === S.split
      ? '後半トップ'
      : '';

    label.classList.remove('is-live');
    label.textContent = 'DECIDED';

    // 演出
    pulse(flash, 'go');
    pulse(stageMain, 'shake');
    const r = marquee.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const big = isFin;
    const mid = isHalf;
    const coolers = ['#46E0FF', '#A162FF', '#FFF6EA', '#FF3D7F'];
    const sideN = big ? 110 : mid ? 90 : 70;

    FX.ring(cx, cy, big ? '#FFC93C' : mid ? '#46E0FF' : '#FFF6EA');
    setTimeout(() => FX.ring(cx, cy, big ? '#FF9A3C' : mid ? '#A162FF' : '#FF3D7F'), 110);
    FX.burst(cx, cy, big ? 260 : mid ? 200 : 150, {
      speed: big ? 21 : mid ? 18 : 16,
      colors: mid ? coolers : null,
    });
    FX.burst(10, window.innerHeight - 10, sideN, { speed: 24, angle: -Math.PI / 3, spread: 0.42 });
    FX.burst(window.innerWidth - 10, window.innerHeight - 10, sideN, {
      speed: 24,
      angle: (-Math.PI * 2) / 3,
      spread: 0.42,
    });
    if (big) {
      FX.rain(220);
      setTimeout(() => FX.burst(cx, cy, 180, { speed: 18, colors: ['#FFC93C', '#FFF0C2', '#FF9A3C', '#FFF6EA'] }), 480);
    } else if (mid) {
      FX.rain(110);
    }

    beams.classList.remove('is-hot');
    beams.classList.add('is-blast');
    setTimeout(() => beams.classList.remove('is-blast'), big ? 3200 : mid ? 2600 : 1900);

    SFX.fanfare(big || mid);

    renderOrder(pos);
    S.spinning = false;
    updateButton();

    if (!remaining().length) setTimeout(() => (label.textContent = 'FULL LINE-UP'), 1200);
  }

  spinBtn.addEventListener('click', () => {
    if (!remaining().length) {
      showResult();
      return;
    }
    if (marquee.classList.contains('is-revealed')) label.textContent = 'NEXT ACT';
    spin();
  });

  $('#reset').addEventListener('click', () => {
    if (!decidedCount() || confirm('決まった順番をぜんぶ消して、はじめから抽選します。よろしいですか？')) {
      freshSlots();
      save();
      enterStage();
    }
  });
  $('#back').addEventListener('click', () => {
    elNames.value = rosterToText(S.acts);
    refreshCount();
    show('setup');
  });
  $('#fs').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });

  /* ---------------- 結果 ---------------- */
  function showResult() {
    const ul = $('#lineup');
    ul.innerHTML = '';
    S.slots.forEach((a, i) => {
      if (hasSplit() && (i === 0 || i === S.split)) {
        const b = i === 0 ? 0 : 1;
        const sec = document.createElement('li');
        sec.className = 'lineup-sect';
        sec.dataset.b = b;
        const sn = document.createElement('span');
        sn.className = 's-name';
        sn.textContent = blockName(b);
        const st = document.createElement('b');
        st.className = 's-time';
        st.textContent = blockTime(b) + '〜　' + (b ? S.split + 1 : 1) + '〜' + (b ? S.slots.length : S.split) + '組';
        sec.appendChild(sn);
        sec.appendChild(st);
        ul.appendChild(sec);
      }
      const li = document.createElement('li');
      li.style.animationDelay = Math.min(i * 28, 900) + 'ms';
      const b = document.createElement('b');
      b.textContent = String(i + 1).padStart(2, '0');
      const body = document.createElement('span');
      body.className = 'l-body';
      const nm = document.createElement('span');
      nm.className = 'l-name';
      nm.textContent = a ? a.name : '—';
      body.appendChild(nm);
      if (a && (a.song || a.kind)) {
        const sg = document.createElement('span');
        sg.className = 'l-song';
        sg.textContent = [a.kind, a.song].filter(Boolean).join(' ・ ');
        body.appendChild(sg);
      }
      li.appendChild(b);
      li.appendChild(body);
      ul.appendChild(li);
    });
    show('result');
    FX.rain(160);
    SFX.fanfare(true);
  }

  function resultText() {
    const out = ['Lillaフェス2026 出演順'];
    S.slots.forEach((a, i) => {
      if (hasSplit() && i === 0) out.push('', '■ 前半 ' + S.timeA + '〜');
      if (hasSplit() && i === S.split) out.push('', '■ 後半 ' + S.timeB + '〜');
      if (!hasSplit() && i === 0) out.push('');
      const tail = a ? [a.kind, a.song].filter(Boolean).join(' / ') : '';
      out.push(i + 1 + '. ' + (a ? a.name : '—') + (tail ? '　' + tail : ''));
    });
    return out.join('\n');
  }

  $('#copy').addEventListener('click', () => {
    const txt = resultText();
    const done = () => {
      $('#copy-note').textContent = 'コピーしました。';
      setTimeout(() => ($('#copy-note').textContent = ''), 2600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch (e) {
        $('#copy-note').textContent = 'コピーできませんでした。';
      }
      document.body.removeChild(ta);
    }
  });
  $('#again').addEventListener('click', () => {
    freshSlots();
    save();
    enterStage();
  });
  $('#edit').addEventListener('click', () => {
    elNames.value = rosterToText(S.acts);
    refreshCount();
    show('setup');
  });

  /* ---------------- キーボード ---------------- */
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (current === 'stage' && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      spinBtn.click();
    }
    if (e.key === 'f' || e.key === 'F') $('#fs').click();
    if (e.key === 'Escape' && current === 'stage') $('#back').click();
  });

  /* ---------------- 起動 ---------------- */
  load();
  FX.init();
  elNames.value = rosterToText(S.acts);
  refreshCount();
  $('#opt-dir').value = S.dir;
  $('#opt-speed').value = String(S.speed);
  $('#opt-sound').checked = S.sound;
  $('#opt-split').value = String(S.split);
  $('#opt-timea').value = S.timeA;
  $('#opt-timeb').value = S.timeB;
  $('#total').textContent = S.acts.length;
  if (decidedCount() > 0) enterStage();
})();

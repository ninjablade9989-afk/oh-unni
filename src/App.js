import React, { useState, useEffect, useRef, useCallback } from "react";
import { subscribeToRoom } from './supabase';

/* ---------------------------------------------------------------
   PHASE 10 — Play With Friends / Solo vs Computer
   With Sound Effects, Music, and Celebrations!
--------------------------------------------------------------- */

// Audio Manager
const AudioManager = {
  context: null,
  musicPlaying: false,
  
  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.context;
  },
  
  playDrawSound() {
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 600;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  },
  
  playPhaseCompleteSound() {
    try {
      const ctx = this.init();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    } catch (e) {}
  },
  
  playWinSound() {
    try {
      const ctx = this.init();
      const notes = [523, 587, 659, 784, 880, 988, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {}
  },
  
  playDiscardSound() {
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 300;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  },
  
  playBackgroundMusic() {
    if (this.musicPlaying) return;
    try {
      this.musicPlaying = true;
      this.playMusicLoop();
    } catch (e) {}
  },
  
  playMusicLoop() {
    if (!this.musicPlaying) return;
    try {
      const ctx = this.init();
      const notes = [261, 293, 329, 392, 440, 493, 523];
      const durations = [0.3, 0.3, 0.3, 0.4, 0.3, 0.3, 0.6];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.25;
        gain.gain.setValueAtTime(0.03, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + durations[i]);
        osc.start(startTime);
        osc.stop(startTime + durations[i]);
      });
      const totalDuration = notes.length * 0.25 + 0.6;
      setTimeout(() => {
        if (this.musicPlaying) {
          this.playMusicLoop();
        }
      }, totalDuration * 1000 + 500);
    } catch (e) {}
  },
  
  stopBackgroundMusic() {
    this.musicPlaying = false;
  },
  
  toggleMute() {
    if (this.context) {
      if (this.context.state === 'suspended') {
        this.context.resume();
      } else if (this.context.state === 'running') {
        this.context.suspend();
      }
    }
  }
};

// Celebration Component
function Celebration({ message, onClose, type }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getEmojis = () => {
    if (type === 'win') return ['🏆', '🎊', '👑', '🥇'];
    if (type === 'round') return ['🎉', '👏', '⭐', '🎊'];
    return ['🌟', '✨', '💫', '🎉'];
  };

  const emojis = getEmojis();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      pointerEvents: 'none',
    }}>
      <div style={{
        animation: 'celebrate 0.5s ease-out',
        background: type === 'win' 
          ? 'linear-gradient(135deg, #FFD700, #FF6B6B, #FFD700)' 
          : type === 'round'
          ? 'linear-gradient(135deg, #4ECDC4, #45B7D1, #4ECDC4)'
          : 'linear-gradient(135deg, #E8B84B, #FF6B6B, #4ECDC4)',
        padding: '40px 60px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        textAlign: 'center',
        maxWidth: '500px',
        pointerEvents: 'auto',
      }}>
        <div style={{ fontSize: '60px', marginBottom: '10px' }}>
          {emojis.map((emoji, i) => (
            <span key={i} style={{ 
              display: 'inline-block',
              animation: `float ${1.5 + i * 0.3}s ease-in-out infinite`,
              margin: '0 5px'
            }}>
              {emoji}
            </span>
          ))}
        </div>
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: 'white', 
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '10px'
        }}>
          {message}
        </div>
        <div style={{ fontSize: '16px', color: 'white', marginTop: '10px', opacity: 0.9 }}>
          {type === 'win' ? '🏆 CHAMPION! 🏆' : type === 'round' ? '🎯 Ready for next round! 🎯' : '✨ Amazing! ✨'}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '10px 30px',
            borderRadius: '10px',
            border: 'none',
            background: 'white',
            color: '#1B4332',
            fontWeight: 'bold',
            cursor: 'pointer',
            pointerEvents: 'auto',
            fontSize: '16px',
          }}
        >
          {type === 'win' ? '🏆 Continue' : '🎮 Continue'}
        </button>
      </div>
      <style>{`
        @keyframes celebrate {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}

const COLORS = ["red", "blue", "green", "yellow"];
const COLOR_HEX = { red: "#C4453E", blue: "#2E6DA8", green: "#3E8E5A", yellow: "#D9A029" };
const TURN_SECONDS = 40;
const BOT_NAMES = ["Aaron", "Hardy", "Milo", "Nadia", "Priya"];

const PHASES = [
  { id: 1, label: "2 Sets of 3", reqs: [{ type: "set", count: 3 }, { type: "set", count: 3 }] },
  { id: 2, label: "1 Set of 3 + 1 Run of 4", reqs: [{ type: "set", count: 3 }, { type: "run", count: 4 }] },
  { id: 3, label: "1 Set of 4 + 1 Run of 4", reqs: [{ type: "set", count: 4 }, { type: "run", count: 4 }] },
  { id: 4, label: "1 Run of 7", reqs: [{ type: "run", count: 7 }] },
  { id: 5, label: "1 Run of 8", reqs: [{ type: "run", count: 8 }] },
  { id: 6, label: "1 Run of 9", reqs: [{ type: "run", count: 9 }] },
  { id: 7, label: "2 Sets of 4", reqs: [{ type: "set", count: 4 }, { type: "set", count: 4 }] },
  { id: 8, label: "7 Cards of One Color", reqs: [{ type: "color", count: 7 }] },
  { id: 9, label: "1 Set of 5 + 1 Set of 2", reqs: [{ type: "set", count: 5 }, { type: "set", count: 2 }] },
  { id: 10, label: "1 Set of 5 + 1 Set of 3", reqs: [{ type: "set", count: 5 }, { type: "set", count: 3 }] },
];

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function makeDeck() {
  const cards = [];
  for (const color of COLORS) {
    for (let n = 1; n <= 12; n++) {
      for (let copy = 0; copy < 2; copy++) cards.push({ id: uid("c"), kind: "number", color, number: n });
    }
  }
  for (let i = 0; i < 8; i++) cards.push({ id: uid("s"), kind: "skip", color: null, number: null });
  for (let i = 0; i < 4; i++) cards.push({ id: uid("w"), kind: "wild", color: null, number: null });
  return shuffle(cards);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardScore(card) {
  if (card.kind === "wild") return 25;
  if (card.kind === "skip") return 15;
  if (card.number >= 1 && card.number <= 9) return 5;
  return 10;
}

/* ---------- validation ---------- */

function validateSet(group, count) {
  if (group.length !== count) return false;
  if (group.some((c) => c.kind === "skip")) return false;
  const numbered = group.filter((c) => c.kind === "number");
  const wilds = group.filter((c) => c.kind === "wild");
  if (numbered.length === 0) return wilds.length === count;
  const target = numbered[0].number;
  return numbered.every((c) => c.number === target);
}

function validateRun(group, count) {
  if (group.length !== count) return false;
  if (group.some((c) => c.kind === "skip")) return false;
  const numbered = group.filter((c) => c.kind === "number");
  const wilds = group.filter((c) => c.kind === "wild").length;
  const nums = numbered.map((c) => c.number);
  if (new Set(nums).size !== nums.length) return false;
  for (let start = 1; start <= 12 - count + 1; start++) {
    const slots = [];
    for (let k = 0; k < count; k++) slots.push(start + k);
    const remaining = new Set(nums);
    let needed = 0;
    for (const s of slots) {
      if (remaining.has(s)) remaining.delete(s);
      else needed++;
    }
    if (remaining.size === 0 && needed <= wilds) return true;
  }
  return false;
}

function validateColor(group, count) {
  if (group.length !== count) return false;
  if (group.some((c) => c.kind === "skip")) return false;
  const nonWild = group.filter((c) => c.kind !== "wild");
  if (nonWild.length === 0) return true;
  const target = nonWild[0].color;
  return nonWild.every((c) => c.color === target);
}

function validateGroup(group, req) {
  if (req.type === "set") return validateSet(group, req.count);
  if (req.type === "run") return validateRun(group, req.count);
  if (req.type === "color") return validateColor(group, req.count);
  return false;
}

function canHit(card, tableGroup) {
  if (!tableGroup || card.kind === "skip") return false;
  if (tableGroup.reqType === "set") {
    if (card.kind === "wild") return true;
    const numbered = tableGroup.cards.find((c) => c.kind === "number");
    return numbered ? card.number === numbered.number : true;
  }
  if (tableGroup.reqType === "color") {
    if (card.kind === "wild") return true;
    const nonWild = tableGroup.cards.find((c) => c.kind !== "wild");
    return nonWild ? card.color === nonWild.color : true;
  }
  if (tableGroup.reqType === "run") {
    if (card.kind === "wild") return true;
    const numbered = tableGroup.cards.filter((c) => c.kind === "number").map((c) => c.number);
    if (numbered.length === 0) return true;
    const min = Math.min(...numbered);
    const max = Math.max(...numbered);
    return card.number === min - 1 || card.number === max + 1;
  }
  return false;
}

/* ---------- bot brain ---------- */

function combinationsOf(indices, k, cap, counter) {
  const results = [];
  function comb(start, chosen) {
    if (counter.n > cap) return;
    if (chosen.length === k) {
      results.push(chosen.slice());
      counter.n++;
      return;
    }
    for (let i = start; i <= indices.length - (k - chosen.length); i++) {
      chosen.push(indices[i]);
      comb(i + 1, chosen);
      chosen.pop();
      if (counter.n > cap) return;
    }
  }
  comb(0, []);
  return results;
}

function attemptAutoLayout(hand, reqs) {
  const n = hand.length;
  const used = new Array(n).fill(false);
  const groups = reqs.map(() => []);
  const counter = { n: 0 };
  const CAP = 4000;

  function backtrack(reqIdx) {
    if (counter.n > CAP) return false;
    if (reqIdx === reqs.length) return true;
    const req = reqs[reqIdx];
    const unused = [];
    for (let i = 0; i < n; i++) if (!used[i]) unused.push(i);
    const combos = combinationsOf(unused, req.count, CAP, counter);
    for (const combo of combos) {
      const groupCards = combo.map((i) => hand[i]);
      if (validateGroup(groupCards, req)) {
        combo.forEach((i) => (used[i] = true));
        groups[reqIdx] = groupCards;
        if (backtrack(reqIdx + 1)) return true;
        combo.forEach((i) => (used[i] = false));
      }
      if (counter.n > CAP) return false;
    }
    return false;
  }
  return backtrack(0) ? groups : null;
}

/* ---------- turn-resolution engine ---------- */

function resolveDraw(r, playerId, source) {
  if (r.players[r.currentPlayerIndex].id !== playerId || r.turnState !== "draw") return r;
  const players = r.players.map((p) => ({ ...p }));
  const player = players[r.currentPlayerIndex];
  let deck = r.deck.slice();
  let discard = r.discard.slice();
  let card;
  if (source === "deck") {
    if (deck.length === 0) {
      const keep = discard[discard.length - 1];
      deck = shuffle(discard.slice(0, -1));
      discard = [keep];
    }
    if (deck.length === 0) return r;
    card = deck.pop();
  } else {
    if (discard.length === 0) return r;
    card = discard.pop();
  }
  player.hand = [...player.hand, card];
  
  AudioManager.playDrawSound();
  
  return { ...r, players, deck, discard, turnState: "action" };
}

function resolveLayDown(r, playerId, activeGroups) {
  const player = r.players.find((p) => p.id === playerId);
  if (!player || player.laidDownThisRound) return r;
  const phase = PHASES[player.phaseIndex];
  const ok = phase.reqs.every((req, i) => validateGroup(activeGroups[i] || [], req));
  if (!ok) return r;
  const players = r.players.map((p) => ({ ...p, hand: p.hand.slice() }));
  const pl = players.find((p) => p.id === playerId);
  const usedIds = new Set(activeGroups.flat().map((c) => c.id));
  pl.hand = pl.hand.filter((c) => !usedIds.has(c.id));
  pl.laidDownThisRound = true;
  const table = { ...r.table };
  table[playerId] = phase.reqs.map((req, i) => ({
    reqType: req.type,
    label: `${req.type === "set" ? "Set" : req.type === "run" ? "Run" : "Color"} of ${req.count}`,
    cards: activeGroups[i],
  }));
  
  AudioManager.playPhaseCompleteSound();
  
  return { ...r, players, table, log: [...r.log, `${pl.name} laid down Phase ${phase.id}!`] };
}

function resolveHit(r, playerId, cardId, ownerId, groupIdx) {
  const player = r.players.find((p) => p.id === playerId);
  if (!player || !player.laidDownThisRound) return r;
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return r;
  const targetGroup = r.table[ownerId] && r.table[ownerId][groupIdx];
  if (!canHit(card, targetGroup)) return r;
  const table = { ...r.table };
  table[ownerId] = table[ownerId].map((g, i) => (i === groupIdx ? { ...g, cards: [...g.cards, card] } : g));
  const players = r.players.map((p) => (p.id === playerId ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p));
  return { ...r, players, table };
}

function resolveDiscard(r, playerId, cardId) {
  if (r.players[r.currentPlayerIndex].id !== playerId || r.turnState !== "action") return r;
  const players = r.players.map((p) => ({ ...p, hand: p.hand.slice() }));
  const player = players[r.currentPlayerIndex];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return r;
  player.hand = player.hand.filter((c) => c.id !== cardId);
  const discard = [...r.discard, card];
  let log = [...r.log, `${player.name} discarded.`];
  
  AudioManager.playDiscardSound();

  if (player.hand.length === 0) {
    const results = players.map((p) => {
      if (p.id === player.id) return { ...p, phaseIndex: p.laidDownThisRound ? Math.min(p.phaseIndex + 1, 10) : p.phaseIndex };
      const roundScore = p.hand.reduce((s, c) => s + cardScore(c), 0);
      return { ...p, score: p.score + roundScore, phaseIndex: p.laidDownThisRound ? Math.min(p.phaseIndex + 1, 10) : p.phaseIndex };
    });
    const finished = results.some((p) => p.phaseIndex >= 10);
    if (finished) {
      const winner = results.slice().sort((a, b) => a.score - b.score)[0];
      log.push(`Round ${r.round} complete. ${winner.name} wins the game with the lowest score!`);
      
      AudioManager.playWinSound();
      AudioManager.stopBackgroundMusic();
      
      return { ...r, players: results.map((p) => ({ ...p, laidDownThisRound: false })), discard, status: "gameOver", winnerId: winner.id, log };
    }
    const deck = makeDeck();
    const dealt = results.map((p) => ({ ...p, hand: [], laidDownThisRound: false }));
    for (let i = 0; i < 10; i++) for (const p of dealt) p.hand.push(deck.pop());
    const newDiscard = [deck.pop()];
    log.push(`Round ${r.round} complete — dealing round ${r.round + 1}.`);
    return {
      ...r,
      players: dealt,
      deck,
      discard: newDiscard,
      table: {},
      round: r.round + 1,
      currentPlayerIndex: (r.currentPlayerIndex + 1) % r.players.length,
      turnState: "draw",
      turnStartedAt: Date.now(),
      log,
    };
  }

  let nextIdx = (r.currentPlayerIndex + 1) % r.players.length;
  let skipNext = r.skipNext;
  if (card.kind === "skip") {
    log.push(`${player.name} played a Skip — next player loses a turn!`);
    skipNext = true;
  }
  if (skipNext) {
    nextIdx = (nextIdx + 1) % r.players.length;
    skipNext = false;
  }
  return { ...r, players, discard, currentPlayerIndex: nextIdx, turnState: "draw", skipNext, turnStartedAt: Date.now(), log };
}

/* ---------- BOT PLAY TURN ---------- */
function botPlayTurn(r0, playerId) {
  console.log('🤖 Bot turn started for:', playerId);
  let r = r0;
  
  if (r.turnState === "draw") {
    console.log('🤖 Bot drawing from deck');
    r = resolveDraw(r, playerId, "deck");
  }
  
  const player = r.players.find((p) => p.id === playerId);
  if (player && !player.laidDownThisRound) {
    const phase = PHASES[player.phaseIndex];
    const layout = attemptAutoLayout(player.hand, phase.reqs);
    if (layout) {
      console.log('🤖 Bot laying down phase');
      r = resolveLayDown(r, playerId, layout);
    }
  }
  
  const updatedPlayer = r.players.find((p) => p.id === playerId);
  if (updatedPlayer && updatedPlayer.hand.length > 0) {
    const nonWild = updatedPlayer.hand.filter((c) => c.kind !== "wild");
    const pool = nonWild.length ? nonWild : updatedPlayer.hand;
    const target = pool.slice().sort((a, b) => cardScore(b) - cardScore(a))[0];
    console.log('🤖 Bot discarding card');
    r = resolveDiscard(r, playerId, target.id);
  }
  
  console.log('🤖 Bot turn complete');
  return r;
}

/* ---------- storage helpers ---------- */

const roomKey = (code) => `phase10:room:${code}`;
async function loadRoom(code) {
  try {
    const res = await window.storage.get(roomKey(code), true);
    return res ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}
async function saveRoom(room) {
  await window.storage.set(roomKey(room.code), JSON.stringify(room), true);
}

/* ---------- card visual ---------- */

const CardFace = React.forwardRef(function CardFace(
  { card, size = "md", selected, onClick, faceDown, dim, draggable, onPointerDownDrag },
  ref
) {
  const dims = size === "sm" ? { w: 42, h: 60, fs: 14 } : size === "lg" ? { w: 68, h: 96, fs: 22 } : { w: 54, h: 78, fs: 17 };
  if (faceDown) {
    return (
      <div
        onClick={onClick}
        style={{
          width: dims.w,
          height: dims.h,
          borderRadius: 8,
          background: "repeating-linear-gradient(135deg, #1B4332, #1B4332 6px, #133326 6px, #133326 12px)",
          border: "2px solid #0d2419",
          boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
          cursor: onClick ? "pointer" : "default",
          flexShrink: 0,
        }}
      />
    );
  }
  const bg = card.kind === "wild" ? "#3A3A4E" : card.kind === "skip" ? "#2B2B2B" : "#FAF6ED";
  const fg = card.kind === "number" ? COLOR_HEX[card.color] : "#F4E9C9";
  const label = card.kind === "wild" ? "★" : card.kind === "skip" ? "⊘" : card.number;
  return (
    <div
      ref={ref}
      onClick={onClick}
      onPointerDown={draggable ? onPointerDownDrag : undefined}
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: 8,
        background: bg,
        border: selected ? "3px solid #E8B84B" : "2px solid rgba(0,0,0,0.25)",
        boxShadow: selected ? "0 0 0 2px #E8B84B, 0 4px 10px rgba(0,0,0,0.35)" : "0 2px 5px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Poppins', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: dims.fs,
        color: fg,
        cursor: draggable ? "grab" : onClick ? "pointer" : "default",
        opacity: dim ? 0.4 : 1,
        flexShrink: 0,
        touchAction: draggable ? "none" : "auto",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
});

/* ---------- main app ---------- */

export default function Phase10App() {
  const [screen, setScreen] = useState("home");
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [room, setRoom] = useState(null);
  const [myId, setMyId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState([[], []]);
  const [botCount, setBotCount] = useState(2);
  const [nowTick, setNowTick] = useState(Date.now());
  const [drag, setDrag] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const lastLogRef = useRef([]);
  const pollRef = useRef(null);
  const codeRef = useRef(null);
  const autoActedRef = useRef(false);

  // Real-time sync for multiplayer
  useEffect(() => {
    if (!room || room.isSolo || !codeRef.current) {
      return;
    }
    
    console.log('Setting up real-time sync for room:', codeRef.current);
    
    const unsubscribe = subscribeToRoom(
      codeRef.current,
      (updatedRoom) => {
        console.log('Received room update from Supabase');
        setRoom(updatedRoom);
      }
    );
    
    return () => {
      unsubscribe?.();
    };
  }, [room?.code, room?.isSolo]);

  // Play background music when game starts
  useEffect(() => {
    if (room?.status === "playing" && !room.isSolo) {
      if (!isMuted) {
        AudioManager.playBackgroundMusic();
      }
    } else if (room?.isSolo && room?.status === "playing") {
      if (!isMuted) {
        AudioManager.playBackgroundMusic();
      }
    } else {
      AudioManager.stopBackgroundMusic();
    }
    
    return () => {
      AudioManager.stopBackgroundMusic();
    };
  }, [room?.status, room?.isSolo, isMuted]);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("phase10:last", false);
        if (res) {
          const saved = JSON.parse(res.value);
          if (saved.code && saved.playerId) {
            const r = await loadRoom(saved.code);
            if (r && r.players.some((p) => p.id === saved.playerId)) {
              setRoom(r);
              setMyId(saved.playerId);
              setName(saved.name || "");
              codeRef.current = saved.code;
              setScreen(r.status === "playing" || r.status === "gameOver" ? "game" : "lobby");
              startPolling(saved.code);
            }
          }
        }
      } catch {}
    })();
    return () => pollRef.current && clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = useCallback((code) => {
    if (pollRef.current) clearInterval(pollRef.current);
    codeRef.current = code;
    pollRef.current = setInterval(async () => {
      const r = await loadRoom(code);
      if (r) setRoom(r);
    }, 1500);
  }, []);

  async function persistSession(code, playerId, nm) {
    try {
      await window.storage.set("phase10:last", JSON.stringify({ code, playerId, name: nm }), false);
    } catch {}
  }

  /* ---- room create / join ---- */

  async function createRoom() {
    if (!name.trim()) return setError("Enter your name first.");
    setBusy(true);
    setError("");
    let code;
    for (let tries = 0; tries < 8; tries++) {
      code = Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]).join("");
      const existing = await loadRoom(code);
      if (!existing) break;
    }
    const pid = uid("p");
    const newRoom = {
      code,
      isSolo: false,
      status: "waiting",
      hostId: pid,
      createdAt: Date.now(),
      players: [{ id: pid, name: name.trim(), phaseIndex: 0, hand: [], laidDownThisRound: false, score: 0 }],
      currentPlayerIndex: 0,
      deck: [],
      discard: [],
      round: 1,
      table: {},
      skipNext: false,
      turnState: "draw",
      turnStartedAt: null,
      log: [`${name.trim()} created the room.`],
      winnerId: null,
    };
    await saveRoom(newRoom);
    setRoom(newRoom);
    setMyId(pid);
    setScreen("lobby");
    startPolling(code);
    await persistSession(code, pid, name.trim());
    setBusy(false);
  }

  async function joinRoom() {
    if (!name.trim()) return setError("Enter your name first.");
    const code = codeInput.trim().toUpperCase();
    if (!code) return setError("Enter a room code.");
    setBusy(true);
    setError("");
    const r = await loadRoom(code);
    if (!r) { setBusy(false); return setError("No room found with that code."); }
    if (r.status !== "waiting") { setBusy(false); return setError("That game has already started."); }
    if (r.players.length >= 6) { setBusy(false); return setError("Room is full (max 6)."); }
    const pid = uid("p");
    r.players.push({ id: pid, name: name.trim(), phaseIndex: 0, hand: [], laidDownThisRound: false, score: 0 });
    r.log.push(`${name.trim()} joined.`);
    await saveRoom(r);
    setRoom(r);
    setMyId(pid);
    setScreen("lobby");
    startPolling(code);
    await persistSession(code, pid, name.trim());
    setBusy(false);
  }

  async function leaveRoom() {
    pollRef.current && clearInterval(pollRef.current);
    try { await window.storage.set("phase10:last", JSON.stringify({}), false); } catch {}
    setRoom(null);
    setMyId(null);
    setGroups([[], []]);
    setScreen("home");
    AudioManager.stopBackgroundMusic();
  }

  async function startGame() {
    if (!room || room.hostId !== myId) return;
    if (room.players.length < 2) return setError("Need at least 2 players.");
    setBusy(true);
    const deck = makeDeck();
    const players = room.players.map((p) => ({ ...p, hand: [], phaseIndex: 0, laidDownThisRound: false, score: 0 }));
    for (let i = 0; i < 10; i++) for (const p of players) p.hand.push(deck.pop());
    const discard = [deck.pop()];
    const updated = {
      ...room, 
      status: "playing", 
      players, 
      deck, 
      discard, 
      currentPlayerIndex: 0, 
      round: 1,
      table: {}, 
      skipNext: false, 
      turnState: "draw", 
      turnStartedAt: Date.now(),
      log: [...room.log, "Game started! Dealing 10 cards to each player."],
    };
    await saveRoom(updated);
    setRoom(updated);
    setScreen("game");
    setBusy(false);
  }

  /* ---- solo vs computer ---- */

  function startSoloGame() {
    const you = { 
      id: "you", 
      name: name.trim() || "You", 
      phaseIndex: 0, 
      hand: [], 
      laidDownThisRound: false, 
      score: 0 
    };
    
    const bots = Array.from({ length: botCount }, (_, i) => ({
      id: `bot${i}`, 
      name: BOT_NAMES[i], 
      isBot: true,
      phaseIndex: 0, 
      hand: [], 
      laidDownThisRound: false, 
      score: 0
    }));
    
    const players = [you, ...bots];
    const deck = makeDeck();
    
    for (let i = 0; i < 10; i++) {
      for (const p of players) {
        p.hand.push(deck.pop());
      }
    }
    
    const discard = [deck.pop()];
    
    const soloRoom = {
      code: "SOLO", 
      isSolo: true, 
      status: "playing", 
      hostId: "you",
      players, 
      currentPlayerIndex: 0, 
      deck, 
      discard, 
      round: 1, 
      table: {},
      skipNext: false, 
      turnState: "draw", 
      turnStartedAt: Date.now(),
      log: ["Solo game started — good luck!"], 
      winnerId: null,
    };
    
    setRoom(soloRoom);
    setMyId("you");
    setScreen("game");
  }

  /* ---- unified turn engine ---- */

  async function updateRoom(mutator) {
    if (!room) return;
    if (room.isSolo) {
      setRoom((prev) => (prev ? mutator(prev) : prev));
      return;
    }
    setBusy(true);
    const fresh = await loadRoom(codeRef.current);
    if (!fresh) { setBusy(false); return; }
    const next = mutator(fresh);
    if (next && next !== fresh) { await saveRoom(next); setRoom(next); }
    setBusy(false);
  }

  const me = room?.players.find((p) => p.id === myId);
  const isMyTurn = room && (room.status === "playing") && room.players[room.currentPlayerIndex]?.id === myId;
  const phase = me ? PHASES[Math.min(me.phaseIndex, 9)] : null;

  // Celebration detection - DETECTS ROUND WINS, PHASE COMPLETIONS, AND GAME WINS
  useEffect(() => {
    if (!room || !room.log) return;
    
    const logs = room.log;
    const lastLog = logs[logs.length - 1];
    
    if (lastLog && lastLogRef.current !== lastLog) {
      lastLogRef.current = lastLog;
      
      // Check for phase completion
      if (lastLog.includes('laid down Phase')) {
        const playerName = lastLog.split(' laid down')[0];
        const isCurrentPlayer = room.isSolo || (me && playerName === me.name);
        if (isCurrentPlayer) {
          setCelebration({
            message: `🌟 ${playerName} completed Phase! 🌟`,
            type: 'phase'
          });
          AudioManager.playPhaseCompleteSound();
          setTimeout(() => setCelebration(null), 4000);
        }
      }
      
      // Check for round winner (when someone finishes their hand)
      if (lastLog.includes('Round') && lastLog.includes('complete')) {
        // Find who has 0 cards (they finished their hand)
        const roundWinner = room.players.find(p => p.hand && p.hand.length === 0);
        if (roundWinner) {
          const roundMatch = lastLog.match(/Round (\d+)/);
          const roundNum = roundMatch ? roundMatch[1] : '';
          setCelebration({
            message: `🎉 ${roundWinner.name} WON ROUND ${roundNum}! 🎉`,
            type: 'round'
          });
          AudioManager.playPhaseCompleteSound();
          setTimeout(() => setCelebration(null), 5000);
        }
      }
      
      // Check for game winner
      if (lastLog.includes('wins the game')) {
        const winnerMatch = lastLog.match(/(.+?) wins the game/);
        if (winnerMatch) {
          const winnerName = winnerMatch[1];
          setCelebration({
            message: `🏆 ${winnerName} WINS THE GAME! 🏆`,
            type: 'win'
          });
          AudioManager.playWinSound();
          AudioManager.stopBackgroundMusic();
          setTimeout(() => setCelebration(null), 6000);
        }
      }
    }
  }, [room?.log, room?.isSolo, me?.name, room?.players]);

  function drawFrom(source) {
    updateRoom((r) => resolveDraw(r, myId, source));
  }

  function layDownPhase() {
    if (!me || !phase) return;
    const activeGroups = groups.slice(0, phase.reqs.length);
    const allValid = phase.reqs.every((req, i) => validateGroup(activeGroups[i] || [], req));
    if (!allValid) {
      return setError("Those groups don't match the phase requirement yet.");
    }
    updateRoom((r) => resolveLayDown(r, myId, activeGroups));
    setGroups([[], []]);
    setError("");
  }

  function hitCard(cardId, ownerId, groupIdx) {
    updateRoom((r) => resolveHit(r, myId, cardId, ownerId, groupIdx));
  }

  function discardCard(cardId) {
    updateRoom((r) => resolveDiscard(r, myId, cardId));
    setGroups([[], []]);
  }

  function autoEndTurn() {
    updateRoom((r) => {
      let rr = r;
      if (rr.turnState === "draw") rr = resolveDraw(rr, myId, "deck");
      const player = rr.players.find((p) => p.id === myId);
      if (!player || player.hand.length === 0) return rr;
      const nonWild = player.hand.filter((c) => c.kind !== "wild");
      const pool = nonWild.length ? nonWild : player.hand;
      const target = pool.slice().sort((a, b) => cardScore(b) - cardScore(a))[0];
      return resolveDiscard(rr, myId, target.id);
    });
    setGroups([[], []]);
    setError("⏰ Time's up — a card was auto-discarded for you.");
  }

  /* ---- bot turn driver (solo mode) ---- */

  useEffect(() => {
    if (!room || !room.isSolo || room.status !== "playing") return;
    
    const current = room.players[room.currentPlayerIndex];
    if (current && current.isBot) {
      console.log('🤖 Bot turn detected for:', current.name);
      
      const t = setTimeout(() => {
        setRoom((prev) => {
          if (!prev || prev.status !== "playing") return prev;
          const cur = prev.players[prev.currentPlayerIndex];
          if (!cur || !cur.isBot) return prev;
          console.log('🤖 Executing bot turn for:', cur.name);
          return botPlayTurn(prev, cur.id);
        });
      }, 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.currentPlayerIndex, room?.round, room?.status, room?.isSolo, room?.players]);

  /* ---- 40s turn timer ---- */

  useEffect(() => {
    if (!room || room.status !== "playing") return;
    const iv = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [room?.status]);

  useEffect(() => {
    autoActedRef.current = false;
  }, [room?.turnStartedAt]);

  useEffect(() => {
    if (!room || room.status !== "playing" || !isMyTurn || !room.turnStartedAt) return;
    const remaining = TURN_SECONDS - Math.floor((nowTick - room.turnStartedAt) / 1000);
    if (remaining <= 0 && !autoActedRef.current) {
      autoActedRef.current = true;
      autoEndTurn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowTick, isMyTurn, room?.turnStartedAt, room?.status]);

  const timeRemaining = room?.turnStartedAt ? Math.max(0, TURN_SECONDS - Math.floor((nowTick - room.turnStartedAt) / 1000)) : TURN_SECONDS;

  /* ---- drag & drop ---- */

  function beginDrag(e, card) {
    if (!(isMyTurn && room.turnState === "action")) return;
    e.preventDefault();
    setDrag({ cardId: card.id, card, x: e.clientX, y: e.clientY });
  }

  useEffect(() => {
    if (!drag) return;
    function move(e) {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    }
    function up(e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const zoneEl = el ? el.closest("[data-dropzone]") : null;
      if (zoneEl) handleDrop(zoneEl.getAttribute("data-dropzone"), drag.card);
      setDrag(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag]);

  function handleDrop(zoneKey, card) {
    if (zoneKey === "discard") {
      if (isMyTurn && room.turnState === "action") discardCard(card.id);
      return;
    }
    if (zoneKey === "hand") {
      setGroups((g) => g.map((arr) => arr.filter((c) => c.id !== card.id)));
      return;
    }
    if (zoneKey.startsWith("group:")) {
      const idx = Number(zoneKey.split(":")[1]);
      if (!phase) return;
      setGroups((g) => {
        const copy = g.map((a) => a.slice());
        const already = copy.some((arr) => arr.some((c) => c.id === card.id));
        if (already) copy.forEach((arr, i) => (copy[i] = arr.filter((c) => c.id !== card.id)));
        if (copy[idx].length < phase.reqs[idx].count) copy[idx].push(card);
        return copy;
      });
      return;
    }
    if (zoneKey.startsWith("hit:")) {
      const [, ownerId, giStr] = zoneKey.split(":");
      hitCard(card.id, ownerId, Number(giStr));
      return;
    }
  }

  const inAnyGroup = (cardId) => groups.some((arr) => arr.some((c) => c.id === cardId));

  // Toggle mute function
  const toggleMute = () => {
    setIsMuted(!isMuted);
    AudioManager.toggleMute();
  };

  /* ---------------- render ---------------- */

  const bgStyle = {
    minHeight: 480,
    background: "radial-gradient(ellipse at top, #1F5C42 0%, #0F3D2E 55%, #0A2A20 100%)",
    fontFamily: "'Poppins', system-ui, sans-serif",
    color: "#F4E9C9",
    padding: "20px 16px 32px",
    boxSizing: "border-box",
    position: "relative",
  };

  const dragGhost = drag && (
    <div style={{ position: "fixed", left: drag.x - 27, top: drag.y - 39, zIndex: 9999, pointerEvents: "none", transform: "scale(1.08) rotate(-4deg)" }}>
      <CardFace card={drag.card} />
    </div>
  );

  if (screen === "home") {
    return (
      <div style={bgStyle}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');`}</style>
        <div style={{ maxWidth: 380, margin: "40px auto", textAlign: "center" }}>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>♫ Oh Unni</div>
          <div style={{ opacity: 0.75, marginBottom: 28, fontSize: 14 }}>Friends online, or solo vs computer</div>

          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "none", marginBottom: 14, fontSize: 15, boxSizing: "border-box", fontFamily: "inherit" }}
          />

          <button onClick={createRoom} disabled={busy} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#E8B84B", color: "#1B4332", fontWeight: 700, fontSize: 15, marginBottom: 10, cursor: "pointer" }}>
            🎮 Create Room (Play with Friends)
          </button>

          <button
            onClick={() => { if (!name.trim()) return setError("Enter your name first."); setError(""); setScreen("soloSetup"); }}
            style={{ width: "100%", padding: "13px", borderRadius: 10, border: "2px solid #E8B84B", background: "transparent", color: "#E8B84B", fontWeight: 700, fontSize: 15, marginBottom: 18, cursor: "pointer" }}
          >
            🤖 Solo vs Computer
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", opacity: 0.6 }}>
            <div style={{ flex: 1, height: 1, background: "#F4E9C9" }} />
            <span style={{ fontSize: 12 }}>OR JOIN A ROOM</span>
            <div style={{ flex: 1, height: 1, background: "#F4E9C9" }} />
          </div>

          <input
            placeholder="Room code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            maxLength={4}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "none", marginBottom: 10, fontSize: 15, textAlign: "center", letterSpacing: 4, boxSizing: "border-box", fontFamily: "inherit", textTransform: "uppercase" }}
          />
          <button onClick={joinRoom} disabled={busy} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "2px solid #E8B84B", background: "transparent", color: "#E8B84B", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            🔗 Join Room
          </button>

          {error && <div style={{ marginTop: 16, color: "#F2A5A0", fontSize: 13 }}>{error}</div>}
        </div>
      </div>
    );
  }

  if (screen === "soloSetup") {
    return (
      <div style={bgStyle}>
        <div style={{ maxWidth: 380, margin: "50px auto", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>🤖 Solo vs Computer</div>
          <div style={{ opacity: 0.75, fontSize: 13, marginBottom: 22 }}>How many bots do you want to play against?</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 26 }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setBotCount(n)}
                style={{
                  width: 60, height: 60, borderRadius: 12, fontSize: 20, fontWeight: 800, cursor: "pointer",
                  border: botCount === n ? "2px solid #E8B84B" : "2px solid rgba(244,233,201,0.3)",
                  background: botCount === n ? "rgba(232,184,75,0.18)" : "transparent",
                  color: "#F4E9C9",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 24 }}>
            You'll play against: {BOT_NAMES.slice(0, botCount).join(", ")}
          </div>
          <button onClick={startSoloGame} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: "#E8B84B", color: "#1B4332", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>
            🎮 Start Game
          </button>
          <button onClick={() => setScreen("home")} style={{ width: "100%", background: "none", border: "none", color: "#F4E9C9", opacity: 0.6, fontSize: 13, cursor: "pointer" }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (screen === "lobby" && room) {
    return (
      <div style={bgStyle}>
        <div style={{ maxWidth: 420, margin: "20px auto" }}>
          <div style={{ textAlign: "center", marginBottom: 6, fontSize: 13, opacity: 0.7 }}>ROOM CODE</div>
          <div style={{ textAlign: "center", fontSize: 44, fontWeight: 800, letterSpacing: 6, marginBottom: 20, color: "#E8B84B" }}>{room.code}</div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 16, marginBottom: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>PLAYERS ({room.players.length}/6)</div>
            {room.players.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 15 }}>
                <span>{p.name} {p.id === room.hostId ? "★" : ""}</span>
                {p.id === myId && <span style={{ opacity: 0.6, fontSize: 12 }}>you</span>}
              </div>
            ))}
          </div>
          {myId === room.hostId ? (
            <button onClick={startGame} disabled={busy || room.players.length < 2} style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none", background: room.players.length < 2 ? "#5a5a4a" : "#E8B84B", color: "#1B4332", fontWeight: 700, fontSize: 16, cursor: room.players.length < 2 ? "default" : "pointer" }}>
              {room.players.length < 2 ? "⏳ Waiting for more players…" : "🚀 Start Game"}
            </button>
          ) : (
            <div style={{ textAlign: "center", opacity: 0.75, fontSize: 14 }}>⏳ Waiting for host to start…</div>
          )}
          {error && <div style={{ marginTop: 14, color: "#F2A5A0", fontSize: 13, textAlign: "center" }}>{error}</div>}
          <button onClick={leaveRoom} style={{ marginTop: 22, width: "100%", background: "none", border: "none", color: "#F4E9C9", opacity: 0.5, fontSize: 13, cursor: "pointer" }}>Leave room</button>
        </div>
      </div>
    );
  }

  if ((screen === "game" || room?.status === "gameOver") && room) {
    const currentPlayer = room.players[room.currentPlayerIndex];
    const topDiscard = room.discard[room.discard.length - 1];
    const timerColor = timeRemaining <= 10 ? "#C4453E" : timeRemaining <= 20 ? "#D9A029" : "#7DBE8C";

    return (
      <>
        {celebration && (
          <Celebration 
            message={celebration.message} 
            type={celebration.type}
            onClose={() => setCelebration(null)} 
          />
        )}
        <div style={bgStyle}>
          {dragGhost}
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 20 }}>
                ♫ PHASE 10 <span style={{ fontSize: 12, opacity: 0.6, fontWeight: 400 }}>· {room.isSolo ? "solo" : `room ${room.code}`} · round {room.round}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={toggleMute} style={{ background: "none", border: "1px solid rgba(244,233,201,0.4)", color: "#F4E9C9", borderRadius: 8, padding: "5px 10px", fontSize: 16, cursor: "pointer" }}>
                  {isMuted ? "🔇" : "🔊"}
                </button>
                {room.status === "playing" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.25)", borderRadius: 20, padding: "4px 12px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: timerColor }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: timerColor, minWidth: 26 }}>{timeRemaining}s</span>
                  </div>
                )}
                <button onClick={leaveRoom} style={{ background: "none", border: "1px solid rgba(244,233,201,0.4)", color: "#F4E9C9", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Leave</button>
              </div>
            </div>

            {room.status === "gameOver" && (
              <div style={{ background: "#E8B84B", color: "#1B4332", borderRadius: 12, padding: 14, marginBottom: 14, textAlign: "center", fontWeight: 700, fontSize: 18 }}>
                🏆 {room.players.find((p) => p.id === room.winnerId)?.name} wins the game! 🎉
              </div>
            )}

            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
              {room.players.map((p) => (
                <div key={p.id} style={{
                  minWidth: 132,
                  background: p.id === currentPlayer?.id && room.status === "playing" ? "rgba(232,184,75,0.18)" : "rgba(0,0,0,0.22)",
                  border: p.id === currentPlayer?.id && room.status === "playing" ? "1.5px solid #E8B84B" : "1px solid rgba(244,233,201,0.15)",
                  borderRadius: 10, padding: "8px 10px", flexShrink: 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2E6DA8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {p.name[0]}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}{p.id === myId ? " (you)" : p.isBot ? " 🤖" : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>Phase {Math.min(p.phaseIndex + 1, 10)} · {p.hand.length} cards · {p.score} pts</div>
                  <div style={{ display: "flex", gap: 2, marginTop: 5 }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: 2, background: i < p.phaseIndex ? "#E8B84B" : "rgba(244,233,201,0.2)" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, background: "rgba(0,0,0,0.18)", borderRadius: 14, padding: "16px 10px", marginBottom: 14 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>DECK ({room.deck.length})</div>
                <CardFace faceDown onClick={isMyTurn && room.turnState === "draw" ? () => drawFrom("deck") : undefined} />
              </div>
              <div style={{ textAlign: "center" }} data-dropzone="discard">
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>DISCARD {isMyTurn && room.turnState === "action" ? "(drop here)" : ""}</div>
                {topDiscard ? (
                  <CardFace card={topDiscard} onClick={isMyTurn && room.turnState === "draw" ? () => drawFrom("discard") : undefined} />
                ) : (
                  <div style={{ width: 54, height: 78, border: "2px dashed rgba(244,233,201,0.3)", borderRadius: 8 }} />
                )}
              </div>
              {phase && room.status === "playing" && (
                <div style={{ textAlign: "center", maxWidth: 150 }}>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>YOUR PHASE {phase.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{phase.label}</div>
                </div>
              )}
            </div>

            {room.status === "playing" && (
              <div style={{ textAlign: "center", marginBottom: 12, fontSize: 13, opacity: 0.85 }}>
                {isMyTurn
                  ? room.turnState === "draw"
                    ? "Your turn — tap the deck or discard pile to draw."
                    : "Your turn — drag cards into a phase slot, onto a laid-down group to hit, or onto the discard pile to end your turn."
                  : `⏳ Waiting for ${currentPlayer?.name}…`}
              </div>
            )}

            {Object.keys(room.table).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {Object.entries(room.table).map(([ownerId, groupsArr]) => {
                  const owner = room.players.find((p) => p.id === ownerId);
                  const canHitHere = isMyTurn && me?.laidDownThisRound && room.turnState === "action";
                  return (
                    <div key={ownerId} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{owner?.name}'s laid-down phase</div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        {groupsArr.map((g, gi) => (
                          <div
                            key={gi}
                            data-dropzone={`hit:${ownerId}:${gi}`}
                            style={{
                              display: "flex", gap: 3, background: "rgba(0,0,0,0.15)", padding: 6, borderRadius: 8,
                              border: canHitHere ? "1.5px dashed rgba(232,184,75,0.5)" : "1.5px dashed transparent",
                            }}
                          >
                            {g.cards.map((c) => <CardFace key={c.id} card={c} size="sm" />)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isMyTurn && room.turnState === "action" && me && !me.laidDownThisRound && phase && (
              <div style={{ background: "rgba(0,0,0,0.18)", borderRadius: 12, padding: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                  🎯 Build Phase {phase.id}: drag cards from your hand into a slot below, then confirm.
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {phase.reqs.map((req, i) => (
                    <div
                      key={i}
                      data-dropzone={`group:${i}`}
                      style={{
                        background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 8, minWidth: 150,
                        border: "2px dashed rgba(232,184,75,0.45)",
                      }}
                    >
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
                        Group {i + 1}: {req.type === "set" ? "Set" : req.type === "run" ? "Run" : "Color"} of {req.count} ({groups[i]?.length || 0}/{req.count})
                      </div>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", minHeight: 48 }}>
                        {(groups[i] || []).length === 0 && <div style={{ fontSize: 11, opacity: 0.4, alignSelf: "center" }}>⬇️ drop cards here</div>}
                        {(groups[i] || []).map((c) => (
                          <CardFace key={c.id} card={c} size="sm" draggable onPointerDownDrag={(e) => beginDrag(e, c)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={layDownPhase} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#E8B84B", color: "#1B4332", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    ✅ Confirm &amp; Lay Down Phase
                  </button>
                  <button onClick={() => setGroups([[], []])} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(244,233,201,0.4)", background: "transparent", color: "#F4E9C9", fontSize: 13, cursor: "pointer" }}>
                    Clear groups
                  </button>
                </div>
                {error && <div style={{ marginTop: 8, color: "#F2A5A0", fontSize: 12 }}>{error}</div>}
              </div>
            )}

            {me && (
              <div style={{ marginTop: 8 }} data-dropzone="hand">
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Your hand ({me.hand.length})</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center", background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 12, minHeight: 90 }}>
                  {me.hand.slice().sort((a, b) => (a.number || 99) - (b.number || 99)).map((c) => (
                    <CardFace
                      key={c.id}
                      card={c}
                      dim={inAnyGroup(c.id) || (drag?.cardId === c.id)}
                      draggable={isMyTurn && room.turnState === "action"}
                      onPointerDownDrag={(e) => beginDrag(e, c)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 11, opacity: 0.55, maxHeight: 70, overflowY: "auto" }}>
              {room.log.slice(-6).map((l, i) => <div key={i}>📝 {l}</div>)}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <div style={bgStyle}>Loading…</div>;
}
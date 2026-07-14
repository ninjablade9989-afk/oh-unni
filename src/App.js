import React, { useState, useEffect, useRef, useCallback } from "react";
import { subscribeToRoom } from './supabase';

/* ---------------------------------------------------------------
   OH UNNI - Card Game
   Complete Feature Update:
   - Phase box always visible
   - Pre-build phases anytime
   - Confirm only after drawing
   - Turn indicator (glow/bounce)
   - Round winner celebration with player name
   - Help/How-to-play modal
   - Phase cards stay when discarding
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
  
  playTurnStartSound() {
    try {
      const ctx = this.init();
      const notes = [523, 659];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
        osc.start(startTime);
        osc.stop(startTime + 0.12);
      });
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

// Help Modal Component
function HelpModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
    }}>
      <div style={{
        background: '#1F5C42',
        padding: '30px',
        borderRadius: '16px',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        color: '#F4E9C9',
        border: '2px solid #E8B84B',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center', color: '#E8B84B' }}>
          🃏 How to Play OH UNNI
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#E8B84B', marginBottom: '6px' }}>🎯 Goal</h3>
          <p>Complete 10 phases before your opponents!</p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#E8B84B', marginBottom: '6px' }}>📋 Phase Cards</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>2 Sets of 3</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 3 + Run of 4</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 4 + Run of 4</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Run of 7</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Run of 8</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Run of 9</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>2 Sets of 4</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>7 of One Color</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 5 + Set of 2</span>
            <span style={{ background: 'rgba(232,184,75,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 5 + Set of 3</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#E8B84B', marginBottom: '6px' }}>🃏 Cards</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ background: '#FAF6ED', color: '#C4453E', padding: '4px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>1-12</div>
            <div style={{ background: '#3A3A4E', color: '#F4E9C9', padding: '4px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>★ Wild</div>
            <div style={{ background: '#2B2B2B', color: '#F4E9C9', padding: '4px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>⊘ Skip</div>
          </div>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Wild = any card • Skip = opponent loses turn</p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#E8B84B', marginBottom: '6px' }}>🎮 How to Play</h3>
          <ol style={{ fontSize: '13px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '4px' }}>Draw a card from DECK or DISCARD</li>
            <li style={{ marginBottom: '4px' }}>Drag cards to build your phase</li>
            <li style={{ marginBottom: '4px' }}>Click ✓ Confirm to lay down phase</li>
            <li style={{ marginBottom: '4px' }}>Discard one card to end turn</li>
            <li style={{ marginBottom: '4px' }}>First to finish all 10 phases wins!</li>
          </ol>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#E8B84B', marginBottom: '6px' }}>🎯 Scoring</h3>
          <p style={{ fontSize: '13px' }}>
            Cards 1-9 = 5 pts • Cards 10-12 = 10 pts • Skip = 15 pts • Wild = 25 pts<br/>
            <span style={{ opacity: 0.7 }}>Lowest score wins!</span>
          </p>
        </div>
        
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: '#E8B84B',
            color: '#1B4332',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Got it! 🎮
        </button>
      </div>
    </div>
  );
}

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
    if (type === 'phase') return ['🌟', '✨', '💫', '🎉'];
    return ['🎯', '⭐', '💪', '🎉'];
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
        padding: '30px 50px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        textAlign: 'center',
        maxWidth: '450px',
        pointerEvents: 'auto',
      }}>
        <div style={{ fontSize: '50px', marginBottom: '10px' }}>
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
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: 'white', 
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '10px'
        }}>
          {message}
        </div>
        <div style={{ fontSize: '14px', color: 'white', marginTop: '10px', opacity: 0.9 }}>
          {type === 'win' ? '🏆 CHAMPION! 🏆' : type === 'round' ? '🎯 Ready for next round! 🎯' : '✨ Amazing! ✨'}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '15px',
            padding: '8px 25px',
            borderRadius: '10px',
            border: 'none',
            background: 'white',
            color: '#1B4332',
            fontWeight: 'bold',
            cursor: 'pointer',
            pointerEvents: 'auto',
            fontSize: '14px',
          }}
        >
          Continue
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
          50% { transform: translateY(-15px) rotate(5deg); }
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
  return { ...r, players, deck, discard, turnState: "action", hasDrawn: true };
}

function resolveLayDown(r, playerId, activeGroups) {
  const player = r.players.find((p) => p.id === playerId);
  if (!player || player.laidDownThisRound) return r;
  if (!r.hasDrawn) return r;
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
      log.push(`🏆 ${winner.name} WINS THE GAME! 🏆`);
      AudioManager.playWinSound();
      AudioManager.stopBackgroundMusic();
      return { 
        ...r, 
        players: results.map((p) => ({ ...p, laidDownThisRound: false })), 
        discard, 
        status: "gameOver", 
        winnerId: winner.id, 
        log,
        table: {},
        hasDrawn: false,
      };
    }
    const deck = makeDeck();
    const dealt = results.map((p) => ({ ...p, hand: [], laidDownThisRound: false }));
    for (let i = 0; i < 10; i++) for (const p of dealt) p.hand.push(deck.pop());
    const newDiscard = [deck.pop()];
    
    // ROUND WINNER CELEBRATION
    const roundWinner = player;
    log.push(`🎉🎊 ${roundWinner.name} WON ROUND ${r.round}! 🎊🎉`);
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
      hasDrawn: false,
      roundWinner: roundWinner.name,
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
  
  return { 
    ...r, 
    players, 
    discard, 
    currentPlayerIndex: nextIdx, 
    turnState: "draw", 
    skipNext, 
    turnStartedAt: Date.now(), 
    log,
    hasDrawn: false,
  };
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

/* ---------- card visual - Compact ---------- */
const CardFace = React.forwardRef(function CardFace(
  { card, size = "md", selected, onClick, faceDown, dim, draggable, onPointerDownDrag, glowing, bouncing },
  ref
) {
  const dims = size === "sm" ? { w: 32, h: 46, fs: 11 } : 
               size === "lg" ? { w: 55, h: 78, fs: 18 } : 
               { w: 42, h: 60, fs: 14 };
  
  if (faceDown) {
    return (
      <div
        onClick={onClick}
        style={{
          width: dims.w,
          height: dims.h,
          borderRadius: 6,
          background: "repeating-linear-gradient(135deg, #1B4332, #1B4332 6px, #133326 6px, #133326 12px)",
          border: glowing ? "2px solid #E8B84B" : "2px solid #0d2419",
          boxShadow: glowing ? "0 0 20px rgba(232,184,75,0.5), 0 0 40px rgba(232,184,75,0.2)" : "0 2px 4px rgba(0,0,0,0.4)",
          cursor: onClick ? "pointer" : "default",
          flexShrink: 0,
          animation: bouncing ? 'bounce 1s ease-in-out infinite' : 'none',
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
        borderRadius: 6,
        background: bg,
        border: selected ? "2px solid #E8B84B" : "1px solid rgba(0,0,0,0.25)",
        boxShadow: glowing 
          ? "0 0 20px rgba(232,184,75,0.5), 0 0 40px rgba(232,184,75,0.2), 0 4px 8px rgba(0,0,0,0.3)" 
          : "0 1px 4px rgba(0,0,0,0.3)",
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
        animation: bouncing ? 'bounce 1s ease-in-out infinite' : 'none',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        transform: glowing ? 'scale(1.05)' : 'scale(1)',
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
  const [showHelp, setShowHelp] = useState(false);
  const lastLogRef = useRef([]);
  const pollRef = useRef(null);
  const codeRef = useRef(null);
  const autoActedRef = useRef(false);
  const turnSoundPlayedRef = useRef(false);

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

  // Play turn start sound when it becomes your turn
  useEffect(() => {
    const current = room?.players[room?.currentPlayerIndex];
    if (current && current.id === myId && room?.status === "playing" && !turnSoundPlayedRef.current) {
      turnSoundPlayedRef.current = true;
      if (!isMuted) {
        AudioManager.playTurnStartSound();
      }
    }
    if (current && current.id !== myId) {
      turnSoundPlayedRef.current = false;
    }
  }, [room?.currentPlayerIndex, room?.status, myId, isMuted]);

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
      hasDrawn: false,
      roundWinner: null,
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
      hasDrawn: false,
      roundWinner: null,
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
      hasDrawn: false,
      roundWinner: null,
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
  const hasDrawn = room?.hasDrawn || false;

  // Celebration detection - ROUND WINNER FIXED
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
      
      // Check for round winner - FIXED
      if (lastLog.includes('WON ROUND')) {
        const winnerMatch = lastLog.match(/🎉🎊 (.+?) WON ROUND/);
        if (winnerMatch) {
          const winnerName = winnerMatch[1];
          const roundMatch = lastLog.match(/ROUND (\d+)/);
          const roundNum = roundMatch ? roundMatch[1] : '';
          setCelebration({
            message: `🎉 ${winnerName} WON ROUND ${roundNum}! 🎉`,
            type: 'round'
          });
          AudioManager.playPhaseCompleteSound();
          setTimeout(() => setCelebration(null), 5000);
        }
      }
      
      // Check for game winner
      if (lastLog.includes('WINS THE GAME')) {
        const winnerMatch = lastLog.match(/🏆 (.+?) WINS THE GAME/);
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
  }, [room?.log, room?.isSolo, me?.name]);

  function drawFrom(source) {
    if (!isMyTurn || room?.turnState !== "draw") return;
    updateRoom((r) => resolveDraw(r, myId, source));
  }

  function layDownPhase() {
    if (!me || !phase) return;
    if (!hasDrawn) {
      setError("⚠️ You must draw a card first!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (!isMyTurn) {
      setError("⚠️ It's not your turn!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (me.laidDownThisRound) {
      setError("⚠️ You already laid down this round!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    const activeGroups = groups.slice(0, phase.reqs.length);
    const allValid = phase.reqs.every((req, i) => validateGroup(activeGroups[i] || [], req));
    if (!allValid) {
      setError("⚠️ Groups don't match the phase requirement!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    updateRoom((r) => resolveLayDown(r, myId, activeGroups));
    setGroups([[], []]);
    setError("");
  }

  function hitCard(cardId, ownerId, groupIdx) {
    updateRoom((r) => resolveHit(r, myId, cardId, ownerId, groupIdx));
  }

  function discardCard(cardId) {
    if (!isMyTurn) {
      setError("⚠️ It's not your turn!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (!hasDrawn) {
      setError("⚠️ You must draw a card first!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    updateRoom((r) => resolveDiscard(r, myId, cardId));
    setError("");
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
    setError("⏰ Time's up — a card was auto-discarded for you.");
  }

  function clearAllGroups() {
    setGroups([[], []]);
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
    if (!room || room.status !== "playing") return;
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
      if (zoneEl) {
        const zone = zoneEl.getAttribute("data-dropzone");
        if (zone.startsWith("group:") || zone.startsWith("hit:") || zone === "hand") {
          if (isMyTurn) {
            handleDrop(zone, drag.card);
          } else {
            setError("⚠️ You can only play on your turn!");
            setTimeout(() => setError(""), 1500);
          }
        } else if (zone === "discard" && isMyTurn) {
          handleDrop(zone, drag.card);
        }
      }
      setDrag(null);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, isMyTurn]);

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

  const toggleMute = () => {
    setIsMuted(!isMuted);
    AudioManager.toggleMute();
  };

  /* ---------------- RENDER ---------------- */

  const bgStyle = {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top, #1F5C42 0%, #0F3D2E 55%, #0A2A20 100%)",
    fontFamily: "'Poppins', system-ui, sans-serif",
    color: "#F4E9C9",
    padding: "8px 10px",
    boxSizing: "border-box",
  };

  const dragGhost = drag && (
    <div style={{ position: "fixed", left: drag.x - 20, top: drag.y - 30, zIndex: 9999, pointerEvents: "none", transform: "scale(1.05) rotate(-3deg)" }}>
      <CardFace card={drag.card} size="sm" />
    </div>
  );

  /* ---- HOME SCREEN ---- */
  if (screen === "home") {
    return (
      <div style={bgStyle}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
          @keyframes bounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
        <div style={{ maxWidth: 360, margin: "20px auto", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>♫ OH UNNI</div>
          <div style={{ opacity: 0.7, marginBottom: 20, fontSize: 13 }}>Friends online, or solo vs computer</div>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", marginBottom: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }}
          />
          <button onClick={createRoom} disabled={busy} style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: "#E8B84B", color: "#1B4332", fontWeight: 700, fontSize: 14, marginBottom: 8, cursor: "pointer" }}>
            🎮 Create Room
          </button>
          <button
            onClick={() => { if (!name.trim()) return setError("Enter your name first."); setError(""); setScreen("soloSetup"); }}
            style={{ width: "100%", padding: "11px", borderRadius: 8, border: "2px solid #E8B84B", background: "transparent", color: "#E8B84B", fontWeight: 700, fontSize: 14, marginBottom: 14, cursor: "pointer" }}
          >
            🤖 Solo vs Computer
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", opacity: 0.5 }}>
            <div style={{ flex: 1, height: 1, background: "#F4E9C9" }} />
            <span style={{ fontSize: 11 }}>OR JOIN</span>
            <div style={{ flex: 1, height: 1, background: "#F4E9C9" }} />
          </div>
          <input
            placeholder="Room code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            maxLength={4}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", marginBottom: 8, fontSize: 14, textAlign: "center", letterSpacing: 4, boxSizing: "border-box", fontFamily: "inherit", textTransform: "uppercase" }}
          />
          <button onClick={joinRoom} disabled={busy} style={{ width: "100%", padding: "11px", borderRadius: 8, border: "2px solid #E8B84B", background: "transparent", color: "#E8B84B", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            🔗 Join Room
          </button>
          {error && <div style={{ marginTop: 12, color: "#F2A5A0", fontSize: 12 }}>{error}</div>}
        </div>
      </div>
    );
  }

  /* ---- SOLO SETUP ---- */
  if (screen === "soloSetup") {
    return (
      <div style={bgStyle}>
        <div style={{ maxWidth: 360, margin: "30px auto", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🤖 Solo vs Computer</div>
          <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 16 }}>How many bots?</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 18 }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setBotCount(n)}
                style={{
                  width: 50, height: 50, borderRadius: 10, fontSize: 18, fontWeight: 800, cursor: "pointer",
                  border: botCount === n ? "2px solid #E8B84B" : "2px solid rgba(244,233,201,0.3)",
                  background: botCount === n ? "rgba(232,184,75,0.18)" : "transparent",
                  color: "#F4E9C9",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 16 }}>
            vs: {BOT_NAMES.slice(0, botCount).join(", ")}
          </div>
          <button onClick={startSoloGame} style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: "#E8B84B", color: "#1B4332", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
            🎮 Start Game
          </button>
          <button onClick={() => setScreen("home")} style={{ width: "100%", background: "none", border: "none", color: "#F4E9C9", opacity: 0.6, fontSize: 12, cursor: "pointer" }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  /* ---- LOBBY ---- */
  if (screen === "lobby" && room) {
    return (
      <div style={bgStyle}>
        <div style={{ maxWidth: 380, margin: "20px auto" }}>
          <div style={{ textAlign: "center", fontSize: 11, opacity: 0.6 }}>ROOM CODE</div>
          <div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, letterSpacing: 5, marginBottom: 16, color: "#E8B84B" }}>{room.code}</div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>PLAYERS ({room.players.length}/6)</div>
            {room.players.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
                <span>{p.name} {p.id === room.hostId ? "★" : ""}</span>
                {p.id === myId && <span style={{ opacity: 0.6, fontSize: 11 }}>you</span>}
              </div>
            ))}
          </div>
          {myId === room.hostId ? (
            <button onClick={startGame} disabled={busy || room.players.length < 2} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: room.players.length < 2 ? "#5a5a4a" : "#E8B84B", color: "#1B4332", fontWeight: 700, fontSize: 15, cursor: room.players.length < 2 ? "default" : "pointer" }}>
              {room.players.length < 2 ? "⏳ Waiting…" : "🚀 Start Game"}
            </button>
          ) : (
            <div style={{ textAlign: "center", opacity: 0.7, fontSize: 13 }}>⏳ Waiting for host…</div>
          )}
          {error && <div style={{ marginTop: 10, color: "#F2A5A0", fontSize: 12, textAlign: "center" }}>{error}</div>}
          <button onClick={leaveRoom} style={{ marginTop: 16, width: "100%", background: "none", border: "none", color: "#F4E9C9", opacity: 0.5, fontSize: 12, cursor: "pointer" }}>Leave room</button>
        </div>
      </div>
    );
  }

  /* ---- GAME SCREEN ---- */
  if ((screen === "game" || room?.status === "gameOver") && room) {
    const currentPlayer = room.players[room.currentPlayerIndex];
    const topDiscard = room.discard[room.discard.length - 1];
    const timerColor = timeRemaining <= 10 ? "#C4453E" : timeRemaining <= 20 ? "#D9A029" : "#7DBE8C";
    const isMyTurnGlow = isMyTurn && room.status === "playing";

    return (
      <>
        {celebration && (
          <Celebration 
            message={celebration.message} 
            type={celebration.type}
            onClose={() => setCelebration(null)} 
          />
        )}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        <div style={bgStyle}>
          {dragGhost}
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            
            {/* Compact Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "16px" }}>OH UNNI</span>
                <span style={{ fontSize: "11px", opacity: 0.6 }}>· round {room.round}</span>
                {room.isSolo && <span style={{ fontSize: "10px", opacity: 0.5, background: "rgba(0,0,0,0.2)", padding: "1px 8px", borderRadius: "10px" }}>solo</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={() => setShowHelp(true)} style={{ background: "none", border: "1px solid rgba(244,233,201,0.2)", color: "#F4E9C9", borderRadius: "5px", padding: "2px 8px", fontSize: "14px", cursor: "pointer" }}>❓</button>
                {room.status === "playing" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.25)", borderRadius: "12px", padding: "2px 10px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: timerColor }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: timerColor }}>{timeRemaining}s</span>
                  </div>
                )}
                <button onClick={toggleMute} style={{ background: "none", border: "none", color: "#F4E9C9", fontSize: "15px", cursor: "pointer", padding: "2px 4px" }}>
                  {isMuted ? "🔇" : "🔊"}
                </button>
                <button onClick={leaveRoom} style={{ background: "none", border: "1px solid rgba(244,233,201,0.2)", color: "#F4E9C9", borderRadius: "5px", padding: "2px 8px", fontSize: "10px", cursor: "pointer" }}>Leave</button>
              </div>
            </div>

            {/* Game Over Banner */}
            {room.status === "gameOver" && (
              <div style={{ background: "#E8B84B", color: "#1B4332", borderRadius: "8px", padding: "8px", marginBottom: "8px", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>
                🏆 {room.players.find((p) => p.id === room.winnerId)?.name} WINS! 🎉
              </div>
            )}

            {/* Compact Player Row */}
            <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "5px", marginBottom: "8px", flexWrap: "nowrap" }}>
              {room.players.map((p) => {
                const isActive = p.id === currentPlayer?.id && room.status === "playing";
                return (
                  <div key={p.id} style={{
                    background: isActive ? "rgba(232,184,75,0.25)" : "rgba(0,0,0,0.2)",
                    border: isActive ? "2px solid #E8B84B" : "1px solid rgba(244,233,201,0.08)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "10px",
                    whiteSpace: "nowrap",
                    minWidth: "60px",
                    flex: "0 0 auto",
                    boxShadow: isActive ? "0 0 20px rgba(232,184,75,0.3)" : "none",
                    transition: "all 0.3s ease",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: "11px", color: isActive ? "#E8B84B" : "#F4E9C9" }}>
                      {p.name}{p.id === myId ? "" : p.isBot ? " 🤖" : ""}
                      {p.id === myId && <span style={{ opacity: 0.5, fontSize: "8px", marginLeft: "2px" }}>you</span>}
                      {isActive && <span style={{ marginLeft: "4px", fontSize: "10px" }}>🎯</span>}
                    </div>
                    <div style={{ opacity: 0.7, fontSize: "9px" }}>
                      Ph{Math.min(p.phaseIndex + 1, 10)} · {p.hand.length} cards
                    </div>
                    <div style={{ display: "flex", gap: "1px", marginTop: "2px" }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{ width: "5px", height: "5px", borderRadius: "1px", background: i < p.phaseIndex ? "#E8B84B" : "rgba(244,233,201,0.15)" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deck & Discard Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(0,0,0,0.15)", borderRadius: "10px", padding: "8px 12px", marginBottom: "8px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "8px", opacity: 0.5, marginBottom: "2px" }}>DECK ({room.deck.length})</div>
                <CardFace 
                  faceDown 
                  size="sm" 
                  glowing={isMyTurnGlow}
                  bouncing={isMyTurnGlow}
                  onClick={isMyTurn && room.turnState === "draw" ? () => drawFrom("deck") : undefined} 
                />
              </div>
              <div style={{ fontSize: "18px", opacity: 0.3 }}>→</div>
              <div style={{ textAlign: "center" }} data-dropzone="discard">
                <div style={{ fontSize: "8px", opacity: 0.5, marginBottom: "2px" }}>
                  DISCARD {isMyTurn && room.turnState === "action" ? "⬇️" : ""}
                </div>
                <CardFace 
                  card={topDiscard} 
                  size="sm" 
                  glowing={isMyTurnGlow}
                  bouncing={isMyTurnGlow}
                  onClick={isMyTurn && room.turnState === "draw" ? () => drawFrom("discard") : undefined} 
                />
              </div>
              {phase && room.status === "playing" && (
                <div style={{ textAlign: "center", maxWidth: "120px" }}>
                  <div style={{ fontSize: "8px", opacity: 0.5 }}>PHASE {phase.id}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, lineHeight: "1.2" }}>{phase.label}</div>
                  {me?.laidDownThisRound && (
                    <div style={{ fontSize: "8px", color: "#7DBE8C", fontWeight: "bold" }}>✅ Done</div>
                  )}
                </div>
              )}
            </div>

            {/* Turn Status */}
            {room.status === "playing" && (
              <div style={{ 
                textAlign: "center", 
                fontSize: "11px", 
                opacity: 0.7, 
                marginBottom: "6px",
                color: isMyTurnGlow ? "#E8B84B" : "#F4E9C9",
                fontWeight: isMyTurnGlow ? "bold" : "normal",
              }}>
                {isMyTurn
                  ? room.turnState === "draw"
                    ? "🎯 Tap deck or discard to draw!"
                    : "🃏 Drag cards to phase slots or discard"
                  : `⏳ ${currentPlayer?.name}'s turn…`}
              </div>
            )}

            {/* Laid Down Phases */}
            {Object.keys(room.table).length > 0 && (
              <div style={{ marginBottom: "8px" }}>
                {Object.entries(room.table).map(([ownerId, groupsArr]) => {
                  const owner = room.players.find((p) => p.id === ownerId);
                  const canHitHere = isMyTurn && me?.laidDownThisRound && room.turnState === "action";
                  return (
                    <div key={ownerId} style={{ marginBottom: "4px" }}>
                      <div style={{ fontSize: "9px", opacity: 0.5, marginBottom: "2px" }}>{owner?.name}'s phase</div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {groupsArr.map((g, gi) => (
                          <div
                            key={gi}
                            data-dropzone={`hit:${ownerId}:${gi}`}
                            style={{
                              display: "flex", gap: "2px", background: "rgba(0,0,0,0.1)", padding: "4px", borderRadius: "4px",
                              border: canHitHere ? "2px dashed rgba(232,184,75,0.5)" : "1px dashed transparent",
                              boxShadow: canHitHere ? "0 0 15px rgba(232,184,75,0.15)" : "none",
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

            {/* Phase Builder - ALWAYS VISIBLE */}
            {phase && room.status === "playing" && !me?.laidDownThisRound && (
              <div style={{ 
                background: "rgba(0,0,0,0.25)", 
                borderRadius: "8px", 
                padding: "8px", 
                marginBottom: "8px",
                border: isMyTurnGlow ? "1px solid #E8B84B" : "1px solid rgba(232,184,75,0.15)",
                boxShadow: isMyTurnGlow ? "0 0 30px rgba(232,184,75,0.1)" : "none",
              }}>
                <div style={{ fontSize: "10px", opacity: 0.6, marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>🎯 Build Phase {phase.id}</span>
                  <span style={{ fontSize: "9px" }}>
                    {hasDrawn ? "🃏 Drawn - Ready!" : "⏳ Draw first!"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {phase.reqs.map((req, i) => (
                    <div
                      key={i}
                      data-dropzone={`group:${i}`}
                      style={{
                        background: "rgba(0,0,0,0.15)", borderRadius: "6px", padding: "4px", minWidth: "100px", flex: "1",
                        border: isMyTurnGlow ? "2px dashed rgba(232,184,75,0.4)" : "1px dashed rgba(232,184,75,0.15)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div style={{ fontSize: "8px", opacity: 0.5, marginBottom: "2px" }}>
                        {req.type === "set" ? "Set" : req.type === "run" ? "Run" : "Color"} of {req.count} ({groups[i]?.length || 0}/{req.count})
                      </div>
                      <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", minHeight: "30px" }}>
                        {(groups[i] || []).length === 0 && <div style={{ fontSize: "9px", opacity: 0.3, alignSelf: "center" }}>⬇️ drop</div>}
                        {(groups[i] || []).map((c) => (
                          <CardFace key={c.id} card={c} size="sm" draggable onPointerDownDrag={(e) => beginDrag(e, c)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px", alignItems: "center" }}>
                  <button 
                    onClick={layDownPhase} 
                    disabled={!isMyTurn || !hasDrawn || me?.laidDownThisRound}
                    style={{ 
                      padding: "4px 12px", 
                      borderRadius: "6px", 
                      border: "none", 
                      background: (!isMyTurn || !hasDrawn) ? "#5a5a4a" : "#E8B84B", 
                      color: (!isMyTurn || !hasDrawn) ? "#888" : "#1B4332", 
                      fontWeight: 700, 
                      fontSize: "11px", 
                      cursor: (!isMyTurn || !hasDrawn) ? "default" : "pointer",
                      opacity: (!isMyTurn || !hasDrawn) ? 0.5 : 1,
                    }}
                  >
                    ✅ Confirm
                  </button>
                  <button 
                    onClick={clearAllGroups}
                    style={{ 
                      padding: "4px 12px", 
                      borderRadius: "6px", 
                      border: "1px solid rgba(244,233,201,0.3)", 
                      background: "transparent", 
                      color: "#F4E9C9", 
                      fontSize: "11px", 
                      cursor: "pointer" 
                    }}
                  >
                    ✖ Clear All
                  </button>
                  {!isMyTurn && <span style={{ fontSize: "9px", opacity: 0.5 }}>⏳ Wait for your turn</span>}
                  {isMyTurn && !hasDrawn && <span style={{ fontSize: "9px", color: "#E8B84B" }}>⚠️ Draw a card first!</span>}
                </div>
                {error && <div style={{ marginTop: "4px", color: "#F2A5A0", fontSize: "10px" }}>{error}</div>}
              </div>
            )}

            {/* Phase Complete Message */}
            {phase && room.status === "playing" && me?.laidDownThisRound && (
              <div style={{ 
                background: "rgba(0,0,0,0.15)", 
                borderRadius: "8px", 
                padding: "8px", 
                marginBottom: "8px",
                textAlign: "center",
                border: "1px solid #7DBE8C",
              }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#7DBE8C" }}>
                  ✅ Phase {phase.id} Complete! 🎉
                </div>
                <div style={{ fontSize: "10px", opacity: 0.6 }}>
                  You laid down: {phase.label}
                </div>
              </div>
            )}

            {/* Hand - with glow/bounce when it's your turn */}
            {me && (
              <div style={{ marginTop: "6px" }} data-dropzone="hand">
                <div style={{ fontSize: "10px", opacity: 0.5, marginBottom: "4px" }}>
                  Your hand ({me.hand.length})
                  {isMyTurnGlow && <span style={{ marginLeft: "8px", color: "#E8B84B" }}>✨ Your turn!</span>}
                </div>
                <div style={{ 
                  display: "flex", 
                  gap: "3px", 
                  flexWrap: "wrap", 
                  justifyContent: "center", 
                  background: isMyTurnGlow ? "rgba(232,184,75,0.08)" : "rgba(0,0,0,0.1)", 
                  borderRadius: "8px", 
                  padding: "6px", 
                  minHeight: "50px",
                  boxShadow: isMyTurnGlow ? "0 0 40px rgba(232,184,75,0.08)" : "none",
                  transition: "all 0.5s ease",
                }}>
                  {me.hand.slice().sort((a, b) => (a.number || 99) - (b.number || 99)).map((c) => (
                    <CardFace
                      key={c.id}
                      card={c}
                      size="sm"
                      dim={inAnyGroup(c.id) || (drag?.cardId === c.id)}
                      draggable={true}
                      glowing={isMyTurnGlow}
                      bouncing={isMyTurnGlow}
                      onPointerDownDrag={(e) => beginDrag(e, c)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Log */}
            <div style={{ marginTop: "6px", fontSize: "9px", opacity: 0.4, maxHeight: "40px", overflowY: "auto" }}>
              {room.log.slice(-4).map((l, i) => <div key={i}>📝 {l}</div>)}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <div style={bgStyle}>Loading…</div>;
}
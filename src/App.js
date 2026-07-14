import React, { useState, useEffect, useRef, useCallback } from "react";
import { subscribeToRoom } from './supabase';

/* ---------------------------------------------------------------
   🐱 PAWSOME PHASE 10 - Cat Themed Card Game
   Features: Random Phases | Random Music | Cat Theme | All Features
--------------------------------------------------------------- */

// Cat Theme Colors
const CAT_THEME = {
  bg: "linear-gradient(135deg, #FFE4E1, #FFB6C1, #FFD4D4)",
  primary: "#FF6B8A",
  secondary: "#C8A2C8",
  accent: "#FFB6C1",
  text: "#5C3D6B",
  cardBg: "#FFF5F5",
  cardBorder: "#FF6B8A",
  gold: "#FFD700",
  dark: "#4A2D5A",
  light: "#FFE4E1",
  paw: "#D4A0A0",
};

// Random Cat Music Tracks
const CAT_MUSIC = [
  // Track 1: Happy Cat
  {
    name: "🐱 Happy Cat",
    notes: [523, 587, 659, 784, 880, 988, 1047],
    durations: [0.3, 0.3, 0.3, 0.4, 0.3, 0.3, 0.6],
    tempo: 0.25,
  },
  // Track 2: Purring Cat
  {
    name: "😸 Purring Cat",
    notes: [392, 440, 493, 523, 440, 493, 523, 587],
    durations: [0.4, 0.4, 0.4, 0.6, 0.4, 0.4, 0.4, 0.6],
    tempo: 0.3,
  },
  // Track 3: Playful Kitten
  {
    name: "🐾 Playful Kitten",
    notes: [659, 784, 880, 784, 880, 988, 784, 880, 988, 1047],
    durations: [0.2, 0.2, 0.3, 0.2, 0.2, 0.3, 0.2, 0.2, 0.3, 0.4],
    tempo: 0.15,
  },
  // Track 4: Sleepy Cat
  {
    name: "😴 Sleepy Cat",
    notes: [261, 293, 329, 392, 440, 493, 392, 329],
    durations: [0.5, 0.5, 0.5, 0.7, 0.5, 0.5, 0.5, 0.7],
    tempo: 0.4,
  },
  // Track 5: Cat Dance
  {
    name: "💃 Cat Dance",
    notes: [523, 523, 587, 587, 659, 659, 784, 784, 880, 880, 988, 988, 1047],
    durations: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.2, 0.15, 0.15, 0.15, 0.15, 0.2, 0.4],
    tempo: 0.12,
  },
];

// Audio Manager with Random Music
const AudioManager = {
  context: null,
  musicPlaying: false,
  currentTrack: null,
  trackIndex: 0,
  timeoutId: null,
  
  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.context;
  },
  
  getRandomTrack() {
    const track = CAT_MUSIC[Math.floor(Math.random() * CAT_MUSIC.length)];
    this.currentTrack = track;
    return track;
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
  
  playDealSound() {
    try {
      const ctx = this.init();
      const notes = [400, 500, 600, 700, 800];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * 0.05;
        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);
        osc.start(startTime);
        osc.stop(startTime + 0.06);
      });
    } catch (e) {}
  },
  
  playBackgroundMusic() {
    if (this.musicPlaying) return;
    try {
      this.musicPlaying = true;
      this.getRandomTrack();
      console.log('🎵 Playing:', this.currentTrack.name);
      this.playMusicLoop();
    } catch (e) {}
  },
  
  playMusicLoop() {
    if (!this.musicPlaying || !this.currentTrack) return;
    try {
      const ctx = this.init();
      const { notes, durations, tempo } = this.currentTrack;
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const startTime = ctx.currentTime + i * tempo;
        gain.gain.setValueAtTime(0.03, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + durations[i]);
        osc.start(startTime);
        osc.stop(startTime + durations[i]);
      });
      
      const totalDuration = notes.length * tempo + 0.6;
      this.timeoutId = setTimeout(() => {
        if (this.musicPlaying) {
          // Pick a new random track for variety
          this.getRandomTrack();
          console.log('🎵 Now playing:', this.currentTrack.name);
          this.playMusicLoop();
        }
      }, totalDuration * 1000 + 1000);
    } catch (e) {}
  },
  
  stopBackgroundMusic() {
    this.musicPlaying = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
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
        background: '#FFE4E1',
        padding: '30px',
        borderRadius: '16px',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        color: '#5C3D6B',
        border: '3px solid #FF6B8A',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center', color: '#FF6B8A' }}>
          🐱 How to Play PAWSOME PHASE 10
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#FF6B8A', marginBottom: '6px' }}>🎯 Goal</h3>
          <p>Complete 10 phases before your opponents!</p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#FF6B8A', marginBottom: '6px' }}>📋 Phase Cards</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>2 Sets of 3</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 3 + Run of 4</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 4 + Run of 4</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Run of 7</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Run of 8</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Run of 9</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>2 Sets of 4</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>7 of One Color</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 5 + Set of 2</span>
            <span style={{ background: '#FF6B8A20', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>Set of 5 + Set of 3</span>
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#FF6B8A', marginBottom: '6px' }}>🃏 Cards</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ background: '#FAF6ED', color: '#C4453E', padding: '4px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>1-12</div>
            <div style={{ background: '#3A3A4E', color: '#FFE4E1', padding: '4px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>★ Wild</div>
            <div style={{ background: '#2B2B2B', color: '#FFE4E1', padding: '4px 10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>⊘ Skip</div>
          </div>
          <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Wild = any card • Skip = opponent loses turn</p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#FF6B8A', marginBottom: '6px' }}>🎮 How to Play</h3>
          <ol style={{ fontSize: '13px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '4px' }}>Draw a card from 🐱 DECK or 🐾 DISCARD</li>
            <li style={{ marginBottom: '4px' }}>Drag cards to build your phase</li>
            <li style={{ marginBottom: '4px' }}>Click ✓ Confirm to lay down phase</li>
            <li style={{ marginBottom: '4px' }}>Discard one card to end turn</li>
            <li style={{ marginBottom: '4px' }}>First to finish all 10 phases wins!</li>
          </ol>
        </div>
        
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            background: '#FF6B8A',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Got it! 🐱
        </button>
      </div>
    </div>
  );
}

// Chat Component
function Chat({ messages, onSendMessage, currentPlayer }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div style={{
      background: "rgba(255,107,138,0.1)",
      borderRadius: "8px",
      padding: "8px",
      marginBottom: "8px",
      maxHeight: "150px",
      display: "flex",
      flexDirection: "column",
      border: "1px solid rgba(255,107,138,0.2)",
    }}>
      <div style={{
        fontSize: "10px",
        opacity: 0.6,
        marginBottom: "4px",
        display: "flex",
        justifyContent: "space-between",
        color: "#5C3D6B",
      }}>
        <span>💬 Meow Chat</span>
        <span style={{ fontSize: "8px", opacity: 0.4 }}>{messages.length} messages</span>
      </div>
      <div style={{
        flex: 1,
        overflowY: "auto",
        maxHeight: "80px",
        marginBottom: "4px",
        fontSize: "11px",
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: "2px 4px",
            borderBottom: "1px solid rgba(255,107,138,0.05)",
            color: msg.playerId === "system" ? "#FF6B8A" : "#5C3D6B",
          }}>
            <span style={{ fontWeight: "bold", opacity: 0.8 }}>
              {msg.playerName}:
            </span>
            <span style={{ marginLeft: "4px", opacity: 0.9 }}>{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={{ display: "flex", gap: "4px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Meow a message..."
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid rgba(255,107,138,0.2)",
            background: "rgba(255,255,255,0.5)",
            color: "#5C3D6B",
            fontSize: "11px",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "4px 12px",
            borderRadius: "4px",
            border: "none",
            background: "#FF6B8A",
            color: "white",
            fontWeight: "bold",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Meow!
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
    if (type === 'win') return ['🏆', '🐱', '👑', '🎊'];
    if (type === 'round') return ['🎉', '🐾', '⭐', '🎊'];
    if (type === 'phase') return ['🌟', '🐱', '💫', '🎉'];
    return ['🐱', '⭐', '💪', '🎉'];
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
          ? 'linear-gradient(135deg, #FFD700, #FF6B8A, #FFD700)' 
          : type === 'round'
          ? 'linear-gradient(135deg, #C8A2C8, #FF6B8A, #C8A2C8)'
          : 'linear-gradient(135deg, #FF6B8A, #C8A2C8, #FF6B8A)',
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
          {type === 'win' ? '🏆 PAWSOME CHAMPION! 🏆' : type === 'round' ? '🐱 Meow-velous! 🐱' : '✨ Purr-fect! ✨'}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: '15px',
            padding: '8px 25px',
            borderRadius: '10px',
            border: 'none',
            background: 'white',
            color: '#FF6B8A',
            fontWeight: 'bold',
            cursor: 'pointer',
            pointerEvents: 'auto',
            fontSize: '14px',
          }}
        >
          Continue 🐾
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

/* ---------- Phase Deck with Random Phases ---------- */

function createPhaseDeck() {
  const deck = [];
  PHASES.forEach((phase, index) => {
    deck.push({ ...phase, cardIndex: index });
    deck.push({ ...phase, cardIndex: index });
  });
  return shuffle(deck);
}

function shufflePhaseDeck() {
  return shuffle(createPhaseDeck());
}

function getCurrentPhase(room, player) {
  if (!room || !player) return null;
  if (!room.shuffledPhases || !room.phaseDeck) {
    return PHASES[Math.min(player.phaseIndex, 9)] || null;
  }
  const idx = Math.min(player.phaseIndex, room.phaseDeck.length - 1);
  return room.phaseDeck[idx] || null;
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

/* ---------- Helper functions for bot ---------- */

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

function getPhaseCards(hand, phase) {
  if (!phase) return [];
  const used = new Set();
  const result = [];
  phase.reqs.forEach(req => {
    const combos = getCombinations(hand, req.count);
    for (const combo of combos) {
      if (validateGroup(combo, req) && !combo.some(c => used.has(c.id))) {
        combo.forEach(c => used.add(c.id));
        result.push(...combo);
        break;
      }
    }
  });
  return result;
}

function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function getHints(hand, phase) {
  if (!phase) return [];
  const hints = [];
  const reqs = phase.reqs;
  
  reqs.forEach((req, idx) => {
    const combinations = getCombinations(hand, req.count);
    combinations.forEach(combo => {
      if (validateGroup(combo, req)) {
        hints.push({
          groupIndex: idx,
          cards: combo,
          message: `Try ${req.type} of ${req.count} with cards: ${combo.map(c => c.number || '★').join(', ')}`
        });
      }
    });
  });
  
  return hints.slice(0, 3);
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
  
  if (pl.hand.length === 0) {
    AudioManager.playWinSound();
    const results = players.map((p) => {
      if (p.id === playerId) {
        return { ...p, phaseIndex: p.laidDownThisRound ? Math.min(p.phaseIndex + 1, 10) : p.phaseIndex };
      }
      const roundScore = p.hand.reduce((s, c) => s + cardScore(c), 0);
      return { ...p, score: p.score + roundScore, phaseIndex: p.laidDownThisRound ? Math.min(p.phaseIndex + 1, 10) : p.phaseIndex };
    });
    
    const finished = results.some((p) => p.phaseIndex >= 10);
    let log = [...r.log, `${pl.name} laid down Phase ${phase.id}!`];
    
    if (finished) {
      const winner = results.slice().sort((a, b) => a.score - b.score)[0];
      log.push(`🏆 ${winner.name} WINS THE GAME! 🏆`);
      AudioManager.playWinSound();
      AudioManager.stopBackgroundMusic();
      return { 
        ...r, 
        players: results.map((p) => ({ ...p, laidDownThisRound: false })), 
        table, 
        status: "gameOver", 
        winnerId: winner.id, 
        log,
        hasDrawn: false,
        chatMessages: r.chatMessages || [],
      };
    }
    
    const deck = makeDeck();
    const dealt = results.map((p) => ({ ...p, hand: [], laidDownThisRound: false }));
    for (let i = 0; i < 10; i++) for (const p of dealt) p.hand.push(deck.pop());
    const newDiscard = [deck.pop()];
    AudioManager.playDealSound();
    log.push(`${pl.name} WON ROUND ${r.round}!`);
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
      chatMessages: r.chatMessages || [],
      roundWinner: pl.name,
    };
  }
  
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
        hasDrawn: false,
        chatMessages: r.chatMessages || [],
      };
    }
    const deck = makeDeck();
    const dealt = results.map((p) => ({ ...p, hand: [], laidDownThisRound: false }));
    for (let i = 0; i < 10; i++) for (const p of dealt) p.hand.push(deck.pop());
    const newDiscard = [deck.pop()];
    AudioManager.playDealSound();
    log.push(`${player.name} WON ROUND ${r.round}!`);
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
      chatMessages: r.chatMessages || [],
      roundWinner: player.name,
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
    chatMessages: r.chatMessages || [],
  };
}

/* ---------- BOT PLAY TURN ---------- */
function botPlayTurn(r0, playerId, difficulty = "medium") {
  console.log('🤖 Bot turn started for:', playerId, 'Difficulty:', difficulty);
  let r = r0;
  
  const botDecision = {
    easy: {
      drawSource: () => Math.random() > 0.5 ? "deck" : "discard",
      discardStrategy: (hand) => {
        const sorted = [...hand].sort((a, b) => cardScore(b) - cardScore(a));
        return sorted[Math.floor(Math.random() * Math.min(sorted.length, 3))];
      },
      phasePriority: () => Math.random() > 0.3,
    },
    medium: {
      drawSource: (r) => {
        const top = r.discard[r.discard.length - 1];
        if (top && top.kind === "number") {
          const matches = r.players.find(p => p.id === playerId).hand.filter(c => c.number === top.number).length;
          return matches >= 1 ? "discard" : "deck";
        }
        return "deck";
      },
      discardStrategy: (hand) => {
        const nonWild = hand.filter(c => c.kind !== "wild");
        const sorted = nonWild.length ? nonWild.sort((a, b) => cardScore(b) - cardScore(a)) : hand;
        return sorted[0];
      },
      phasePriority: () => true,
    },
    hard: {
      drawSource: (r) => {
        const top = r.discard[r.discard.length - 1];
        if (top && top.kind === "number") {
          const matches = r.players.find(p => p.id === playerId).hand.filter(c => c.number === top.number).length;
          return matches >= 2 ? "discard" : "deck";
        }
        if (top && top.kind === "wild") return "discard";
        return "deck";
      },
      discardStrategy: (hand, phase) => {
        const phaseCards = phase ? getPhaseCards(hand, phase) : [];
        const nonPhase = hand.filter(c => !phaseCards.some(pc => pc.id === c.id));
        if (nonPhase.length > 0) {
          return nonPhase.sort((a, b) => cardScore(b) - cardScore(a))[0];
        }
        return hand.sort((a, b) => cardScore(b) - cardScore(a))[0];
      },
      phasePriority: () => true,
    }
  };
  
  const strategy = botDecision[difficulty] || botDecision.medium;
  
  if (r.turnState === "draw") {
    const source = typeof strategy.drawSource === 'function' ? strategy.drawSource(r) : "deck";
    console.log('🤖 Bot drawing from', source);
    r = resolveDraw(r, playerId, source);
  }
  
  const player = r.players.find((p) => p.id === playerId);
  if (!player) return r0;
  
  if (!player.laidDownThisRound && (typeof strategy.phasePriority === 'function' ? strategy.phasePriority() : true)) {
    const phase = PHASES[player.phaseIndex];
    const layout = attemptAutoLayout(player.hand, phase.reqs);
    if (layout) {
      console.log('🤖 Bot laying down phase');
      r = resolveLayDown(r, playerId, layout);
    }
  }
  
  const updatedPlayer = r.players.find((p) => p.id === playerId);
  if (updatedPlayer && updatedPlayer.laidDownThisRound) {
    let guard = 0;
    let progress = true;
    while (progress && guard < 25) {
      guard++;
      progress = false;
      const p2 = r.players.find((p) => p.id === playerId);
      if (!p2 || !p2.laidDownThisRound) break;
      for (const card of p2.hand) {
        for (const ownerId of Object.keys(r.table || {})) {
          const groupsArr = r.table[ownerId];
          if (!groupsArr) continue;
          for (let gi = 0; gi < groupsArr.length; gi++) {
            if (canHit(card, groupsArr[gi])) {
              r = resolveHit(r, playerId, card.id, ownerId, gi);
              progress = true;
              break;
            }
          }
          if (progress) break;
        }
        if (progress) break;
      }
    }
  }
  
  const pFinal = r.players.find((p) => p.id === playerId);
  if (pFinal && pFinal.hand.length > 0) {
    const phase = PHASES[pFinal.phaseIndex];
    let target;
    if (typeof strategy.discardStrategy === 'function') {
      target = strategy.discardStrategy(pFinal.hand, phase);
    } else {
      const sorted = [...pFinal.hand].sort((a, b) => cardScore(b) - cardScore(a));
      target = sorted[0];
    }
    if (target) {
      console.log('🤖 Bot discarding card');
      r = resolveDiscard(r, playerId, target.id);
    }
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

/* ---------- card visual - Cat Themed ---------- */
const CardFace = React.forwardRef(function CardFace(
  { card, size = "md", selected, onClick, faceDown, dim, draggable, onPointerDownDrag, glowing, bouncing, dealAnimation },
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
          background: "repeating-linear-gradient(135deg, #FFB6C1, #FFB6C1 6px, #FF9AAF 6px, #FF9AAF 12px)",
          border: glowing ? "2px solid #FF6B8A" : "2px solid #D4A0A0",
          boxShadow: glowing ? "0 0 20px rgba(255,107,138,0.5), 0 0 40px rgba(255,107,138,0.2)" : "0 2px 4px rgba(0,0,0,0.4)",
          cursor: onClick ? "pointer" : "default",
          flexShrink: 0,
          animation: bouncing ? 'bounce 1s ease-in-out infinite' : dealAnimation ? 'dealCard 0.5s ease-out' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}
      >
        🐾
      </div>
    );
  }
  const bg = card.kind === "wild" ? "#C8A2C8" : card.kind === "skip" ? "#D4A0A0" : "#FFF5F5";
  const fg = card.kind === "number" ? COLOR_HEX[card.color] : "#5C3D6B";
  const label = card.kind === "wild" ? "🐱" : card.kind === "skip" ? "🐾" : card.number;
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
        border: selected ? "2px solid #FF6B8A" : "1px solid rgba(255,107,138,0.3)",
        boxShadow: glowing 
          ? "0 0 20px rgba(255,107,138,0.5), 0 0 40px rgba(255,107,138,0.2), 0 4px 8px rgba(0,0,0,0.3)" 
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
        animation: bouncing ? 'bounce 1s ease-in-out infinite' : dealAnimation ? 'dealCard 0.5s ease-out' : 'none',
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
  const [botDifficulty, setBotDifficulty] = useState("medium");
  const [nowTick, setNowTick] = useState(Date.now());
  const [drag, setDrag] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [hints, setHints] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [dealAnimation, setDealAnimation] = useState(false);
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
        if (updatedRoom.chatMessages) {
          setChatMessages(updatedRoom.chatMessages);
        }
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

  // Deal animation when round starts
  useEffect(() => {
    if (room?.status === "playing" && room?.turnState === "draw") {
      setDealAnimation(true);
      AudioManager.playDealSound();
      setTimeout(() => setDealAnimation(false), 1000);
    }
  }, [room?.round, room?.status]);

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
              if (r.chatMessages) setChatMessages(r.chatMessages);
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
      if (r) {
        setRoom(r);
        if (r.chatMessages) setChatMessages(r.chatMessages);
      }
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
    const phaseDeck = shufflePhaseDeck();
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
      log: [`${name.trim()} created the room. 🐱`],
      winnerId: null,
      hasDrawn: false,
      roundWinner: null,
      chatMessages: [],
      difficulty: "medium",
      phaseDeck: phaseDeck,
      shuffledPhases: true,
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
    if (!r) { setBusy(false); return setError("No room found with that code. 🐱"); }
    if (r.status !== "waiting") { setBusy(false); return setError("That game has already started."); }
    if (r.players.length >= 6) { setBusy(false); return setError("Room is full (max 6)."); }
    const pid = uid("p");
    r.players.push({ id: pid, name: name.trim(), phaseIndex: 0, hand: [], laidDownThisRound: false, score: 0 });
    r.log.push(`${name.trim()} joined. 🐾`);
    r.chatMessages = r.chatMessages || [];
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
    const phaseDeck = shufflePhaseDeck();
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
      log: [...room.log, "🐱 Game started! Dealing 10 cards to each player."],
      hasDrawn: false,
      roundWinner: null,
      chatMessages: room.chatMessages || [],
      difficulty: room.difficulty || "medium",
      phaseDeck: phaseDeck,
      shuffledPhases: true,
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
    const phaseDeck = shufflePhaseDeck();
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
      log: ["🐱 Solo game started — good luck! 🐾"], 
      winnerId: null,
      hasDrawn: false,
      roundWinner: null,
      chatMessages: [],
      difficulty: botDifficulty,
      phaseDeck: phaseDeck,
      shuffledPhases: true,
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
  const phase = getCurrentPhase(room, me);
  const hasDrawn = room?.hasDrawn || false;

  // Celebration detection
  useEffect(() => {
    if (!room || !room.log) return;
    const logs = room.log;
    const lastLog = logs[logs.length - 1];
    
    if (lastLog && lastLogRef.current !== lastLog) {
      lastLogRef.current = lastLog;
      console.log('📝 New log detected:', lastLog);
      
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
      
      if (lastLog.includes('WON ROUND')) {
        console.log('🎯 Round winner detected!');
        const parts = lastLog.split(' ');
        let winnerName = null;
        let roundNum = null;
        
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].toUpperCase() === 'WON' && parts[i+1] && parts[i+1].toUpperCase() === 'ROUND') {
            if (i > 0) {
              winnerName = parts[i-1];
            }
            if (i+2 < parts.length) {
              roundNum = parts[i+2].replace(/[!.]/g, '');
            }
            break;
          }
        }
        
        if (winnerName) {
          console.log('🏆 Winner found:', winnerName);
          setCelebration({
            message: `🎉 ${winnerName} WON ROUND ${roundNum || '?'}! 🎉`,
            type: 'round'
          });
          AudioManager.playPhaseCompleteSound();
          setTimeout(() => setCelebration(null), 5000);
        }
      }
      
      if (lastLog.includes('WINS THE GAME')) {
        const parts = lastLog.split(' ');
        let winnerName = null;
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].toUpperCase() === 'WINS' && parts[i+1] && parts[i+1].toUpperCase() === 'THE' && parts[i+2] && parts[i+2].toUpperCase() === 'GAME') {
            if (i > 0) {
              winnerName = parts[i-1];
            }
            break;
          }
        }
        if (winnerName) {
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
    setUndoStack([...undoStack, { groups: groups.map(g => [...g]) }]);
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
    setUndoStack([...undoStack, { groups: groups.map(g => [...g]) }]);
    updateRoom((r) => resolveLayDown(r, myId, activeGroups));
    setGroups([[], []]);
    setError("");
    setHints([]);
    setShowHints(false);
  }

  function hitCard(cardId, ownerId, groupIdx) {
    setUndoStack([...undoStack, { groups: groups.map(g => [...g]) }]);
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
    setUndoStack([...undoStack, { groups: groups.map(g => [...g]) }]);
    updateRoom((r) => resolveDiscard(r, myId, cardId));
    setError("");
    setHints([]);
    setShowHints(false);
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
    setGroups([[], []]);
    setHints([]);
    setShowHints(false);
  }

  function clearAllGroups() {
    setUndoStack([...undoStack, { groups: groups.map(g => [...g]) }]);
    setGroups([[], []]);
    setHints([]);
    setShowHints(false);
  }

  function undoLastMove() {
    if (undoStack.length === 0) {
      setError("⚠️ Nothing to undo!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    const lastState = undoStack[undoStack.length - 1];
    setGroups(lastState.groups);
    setUndoStack(undoStack.slice(0, -1));
    setError("↩️ Undo successful!");
    setTimeout(() => setError(""), 1500);
  }

  function getHintsForHand() {
    if (!me || !phase) {
      setError("⚠️ No hints available!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    const hintResults = getHints(me.hand, phase);
    if (hintResults.length === 0) {
      setHints([{ message: "No possible moves found. Try drawing more cards! 🐱" }]);
    } else {
      setHints(hintResults);
    }
    setShowHints(true);
    setTimeout(() => setShowHints(false), 5000);
  }

  function sendChatMessage(text) {
    if (!room || !me) return;
    const newMsg = {
      playerId: myId,
      playerName: me.name,
      text: text,
      timestamp: Date.now(),
    };
    const updatedMessages = [...(room.chatMessages || []), newMsg];
    setChatMessages(updatedMessages);
    updateRoom((r) => {
      return { ...r, chatMessages: updatedMessages };
    });
  }

  /* ---- bot turn driver (solo mode) ---- */

  useEffect(() => {
    if (!room || !room.isSolo || room.status !== "playing") return;
    const current = room.players[room.currentPlayerIndex];
    if (current && current.isBot) {
      console.log('🤖 Bot turn detected for:', current.name);
      const difficulty = room.difficulty || "medium";
      const t = setTimeout(() => {
        setRoom((prev) => {
          if (!prev || prev.status !== "playing") return prev;
          const cur = prev.players[prev.currentPlayerIndex];
          if (!cur || !cur.isBot) return prev;
          console.log('🤖 Executing bot turn for:', cur.name, 'Difficulty:', difficulty);
          return botPlayTurn(prev, cur.id, difficulty);
        });
      }, 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.currentPlayerIndex, room?.round, room?.status, room?.isSolo, room?.players, room?.difficulty]);

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
    background: "linear-gradient(135deg, #FFE4E1, #FFB6C1, #FFD4D4)",
    fontFamily: "'Poppins', system-ui, sans-serif",
    color: "#5C3D6B",
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
          @keyframes dealCard {
            0% { transform: translateY(-50px) rotate(-10deg); opacity: 0; }
            100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          }
        `}</style>
        <div style={{ maxWidth: 360, margin: "20px auto", textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 1, marginBottom: 2, color: "#FF6B8A" }}>
            🐱 PAWSOME PHASE 10
          </div>
          <div style={{ opacity: 0.7, marginBottom: 20, fontSize: 13, color: "#5C3D6B" }}>
            Play with friends or vs computer 🐾
          </div>
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #FFB6C1", marginBottom: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", background: "white" }}
          />
          <button onClick={createRoom} disabled={busy} style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: "#FF6B8A", color: "white", fontWeight: 700, fontSize: 14, marginBottom: 8, cursor: "pointer" }}>
            🎮 Create Room
          </button>
          <button
            onClick={() => { if (!name.trim()) return setError("Enter your name first."); setError(""); setScreen("soloSetup"); }}
            style={{ width: "100%", padding: "11px", borderRadius: 8, border: "2px solid #FF6B8A", background: "transparent", color: "#FF6B8A", fontWeight: 700, fontSize: 14, marginBottom: 14, cursor: "pointer" }}
          >
            🤖 Solo vs Computer
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0", opacity: 0.5 }}>
            <div style={{ flex: 1, height: 1, background: "#5C3D6B" }} />
            <span style={{ fontSize: 11 }}>OR JOIN</span>
            <div style={{ flex: 1, height: 1, background: "#5C3D6B" }} />
          </div>
          <input
            placeholder="Room code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            maxLength={4}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "2px solid #FFB6C1", marginBottom: 8, fontSize: 14, textAlign: "center", letterSpacing: 4, boxSizing: "border-box", fontFamily: "inherit", textTransform: "uppercase", background: "white" }}
          />
          <button onClick={joinRoom} disabled={busy} style={{ width: "100%", padding: "11px", borderRadius: 8, border: "2px solid #FF6B8A", background: "transparent", color: "#FF6B8A", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            🔗 Join Room
          </button>
          {error && <div style={{ marginTop: 12, color: "#FF6B8A", fontSize: 12 }}>{error}</div>}
        </div>
      </div>
    );
  }

  /* ---- SOLO SETUP ---- */
  if (screen === "soloSetup") {
    return (
      <div style={bgStyle}>
        <div style={{ maxWidth: 360, margin: "30px auto", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: "#FF6B8A" }}>🤖 Solo vs Computer</div>
          <div style={{ opacity: 0.7, fontSize: 12, color: "#5C3D6B", marginBottom: 16 }}>How many bots?</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 18 }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setBotCount(n)}
                style={{
                  width: 50, height: 50, borderRadius: 10, fontSize: 18, fontWeight: 800, cursor: "pointer",
                  border: botCount === n ? "2px solid #FF6B8A" : "2px solid rgba(255,107,138,0.3)",
                  background: botCount === n ? "rgba(255,107,138,0.18)" : "transparent",
                  color: "#5C3D6B",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, color: "#5C3D6B", marginBottom: 16 }}>
            vs: {BOT_NAMES.slice(0, botCount).join(", ")}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, opacity: 0.6, color: "#5C3D6B", marginBottom: 6 }}>🤖 Bot Difficulty</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {["easy", "medium", "hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setBotDifficulty(diff)}
                  style={{
                    padding: "4px 16px",
                    borderRadius: "6px",
                    border: botDifficulty === diff ? "2px solid #FF6B8A" : "1px solid rgba(255,107,138,0.3)",
                    background: botDifficulty === diff ? "rgba(255,107,138,0.18)" : "transparent",
                    color: "#5C3D6B",
                    fontSize: "12px",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
          <button onClick={startSoloGame} style={{ width: "100%", padding: "11px", borderRadius: 8, border: "none", background: "#FF6B8A", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}>
            🎮 Start Game
          </button>
          <button onClick={() => setScreen("home")} style={{ width: "100%", background: "none", border: "none", color: "#5C3D6B", opacity: 0.6, fontSize: 12, cursor: "pointer" }}>
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
          <div style={{ textAlign: "center", fontSize: 11, opacity: 0.6, color: "#5C3D6B" }}>ROOM CODE</div>
          <div style={{ textAlign: "center", fontSize: 40, fontWeight: 800, letterSpacing: 5, marginBottom: 16, color: "#FF6B8A" }}>{room.code}</div>
          <div style={{ background: "rgba(255,107,138,0.1)", borderRadius: 10, padding: 14, marginBottom: 14, border: "1px solid rgba(255,107,138,0.2)" }}>
            <div style={{ fontSize: 12, opacity: 0.7, color: "#5C3D6B", marginBottom: 8 }}>🐱 PLAYERS ({room.players.length}/6)</div>
            {room.players.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, color: "#5C3D6B" }}>
                <span>{p.name} {p.id === room.hostId ? "⭐" : ""}</span>
                {p.id === myId && <span style={{ opacity: 0.6, fontSize: 11 }}>you</span>}
              </div>
            ))}
          </div>
          {myId === room.hostId ? (
            <button onClick={startGame} disabled={busy || room.players.length < 2} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: room.players.length < 2 ? "#D4A0A0" : "#FF6B8A", color: "white", fontWeight: 700, fontSize: 15, cursor: room.players.length < 2 ? "default" : "pointer" }}>
              {room.players.length < 2 ? "⏳ Waiting…" : "🚀 Start Game"}
            </button>
          ) : (
            <div style={{ textAlign: "center", opacity: 0.7, fontSize: 13, color: "#5C3D6B" }}>⏳ Waiting for host…</div>
          )}
          {error && <div style={{ marginTop: 10, color: "#FF6B8A", fontSize: 12, textAlign: "center" }}>{error}</div>}
          <button onClick={leaveRoom} style={{ marginTop: 16, width: "100%", background: "none", border: "none", color: "#5C3D6B", opacity: 0.5, fontSize: 12, cursor: "pointer" }}>Leave room</button>
        </div>
      </div>
    );
  }

  /* ---- GAME SCREEN ---- */
  if ((screen === "game" || room?.status === "gameOver") && room) {
    const currentPlayer = room.players[room.currentPlayerIndex];
    const topDiscard = room.discard[room.discard.length - 1];
    const timerColor = timeRemaining <= 10 ? "#FF6B8A" : timeRemaining <= 20 ? "#C8A2C8" : "#7DBE8C";
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
        {showHints && hints.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,107,138,0.95)',
            padding: '12px 20px',
            borderRadius: '10px',
            zIndex: 9999,
            maxWidth: '400px',
            border: '2px solid white',
            textAlign: 'center',
            color: 'white',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>💡 Hints</div>
            {hints.map((hint, i) => (
              <div key={i} style={{ fontSize: '12px', opacity: 0.9, padding: '2px 0' }}>
                {hint.message}
              </div>
            ))}
            <button
              onClick={() => setShowHints(false)}
              style={{
                marginTop: '6px',
                padding: '2px 12px',
                borderRadius: '4px',
                border: 'none',
                background: 'white',
                color: '#FF6B8A',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}
        <div style={bgStyle}>
          {dragGhost}
          <div style={{ maxWidth: 650, margin: "0 auto" }}>
            
            {/* Compact Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "16px", color: "#FF6B8A" }}>🐱 PAWSOME</span>
                <span style={{ fontSize: "11px", opacity: 0.6, color: "#5C3D6B" }}>· round {room.round}</span>
                {room.isSolo && <span style={{ fontSize: "10px", opacity: 0.5, background: "rgba(255,107,138,0.2)", padding: "1px 8px", borderRadius: "10px", color: "#FF6B8A" }}>solo</span>}
                {room.isSolo && (
                  <span style={{ fontSize: "9px", opacity: 0.5, background: "rgba(255,107,138,0.2)", padding: "1px 8px", borderRadius: "10px", color: "#FF6B8A" }}>
                    {room.difficulty || "medium"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={() => setShowHelp(true)} style={{ background: "none", border: "1px solid rgba(255,107,138,0.3)", color: "#5C3D6B", borderRadius: "5px", padding: "2px 8px", fontSize: "14px", cursor: "pointer" }}>❓</button>
                <button onClick={undoLastMove} style={{ background: "none", border: "1px solid rgba(255,107,138,0.3)", color: "#5C3D6B", borderRadius: "5px", padding: "2px 8px", fontSize: "14px", cursor: "pointer" }} title="Undo last move">↩️</button>
                <button onClick={getHintsForHand} style={{ background: "none", border: "1px solid rgba(255,107,138,0.3)", color: "#5C3D6B", borderRadius: "5px", padding: "2px 8px", fontSize: "14px", cursor: "pointer" }} title="Get hints">💡</button>
                <button onClick={() => setShowChat(!showChat)} style={{ background: "none", border: "1px solid rgba(255,107,138,0.3)", color: "#5C3D6B", borderRadius: "5px", padding: "2px 8px", fontSize: "14px", cursor: "pointer" }}>💬</button>
                {room.status === "playing" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,107,138,0.1)", borderRadius: "12px", padding: "2px 10px", border: "1px solid rgba(255,107,138,0.2)" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: timerColor }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: timerColor }}>{timeRemaining}s</span>
                  </div>
                )}
                <button onClick={toggleMute} style={{ background: "none", border: "none", color: "#5C3D6B", fontSize: "15px", cursor: "pointer", padding: "2px 4px" }}>
                  {isMuted ? "🔇" : "🔊"}
                </button>
                <button onClick={leaveRoom} style={{ background: "none", border: "1px solid rgba(255,107,138,0.2)", color: "#5C3D6B", borderRadius: "5px", padding: "2px 8px", fontSize: "10px", cursor: "pointer" }}>Leave</button>
              </div>
            </div>

            {/* Chat */}
            {showChat && (
              <Chat 
                messages={chatMessages} 
                onSendMessage={sendChatMessage} 
                currentPlayer={me} 
              />
            )}

            {/* Game Over Banner */}
            {room.status === "gameOver" && (
              <div style={{ background: "linear-gradient(135deg, #FFD700, #FF6B8A)", color: "white", borderRadius: "8px", padding: "8px", marginBottom: "8px", textAlign: "center", fontWeight: 700, fontSize: "14px" }}>
                🏆 {room.players.find((p) => p.id === room.winnerId)?.name} WINS! 🎉
              </div>
            )}

            {/* Compact Player Row */}
            <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "5px", marginBottom: "8px", flexWrap: "nowrap" }}>
              {room.players.map((p) => {
                const isActive = p.id === currentPlayer?.id && room.status === "playing";
                return (
                  <div key={p.id} style={{
                    background: isActive ? "rgba(255,107,138,0.25)" : "rgba(255,107,138,0.08)",
                    border: isActive ? "2px solid #FF6B8A" : "1px solid rgba(255,107,138,0.1)",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontSize: "10px",
                    whiteSpace: "nowrap",
                    minWidth: "60px",
                    flex: "0 0 auto",
                    boxShadow: isActive ? "0 0 20px rgba(255,107,138,0.2)" : "none",
                    transition: "all 0.3s ease",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: "11px", color: isActive ? "#FF6B8A" : "#5C3D6B" }}>
                      {p.isBot ? "🐱 " : ""}{p.name}{p.id === myId ? "" : ""}
                      {p.id === myId && <span style={{ opacity: 0.5, fontSize: "8px", marginLeft: "2px" }}>you</span>}
                      {isActive && <span style={{ marginLeft: "4px", fontSize: "10px" }}>🎯</span>}
                    </div>
                    <div style={{ opacity: 0.7, fontSize: "9px", color: "#5C3D6B" }}>
                      Ph{Math.min(p.phaseIndex + 1, 10)} · {p.hand.length} cards
                    </div>
                    <div style={{ display: "flex", gap: "1px", marginTop: "2px" }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} style={{ width: "5px", height: "5px", borderRadius: "1px", background: i < p.phaseIndex ? "#FF6B8A" : "rgba(255,107,138,0.15)" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deck & Discard Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", background: "rgba(255,107,138,0.08)", borderRadius: "10px", padding: "8px 12px", marginBottom: "8px", border: "1px solid rgba(255,107,138,0.1)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "8px", opacity: 0.5, color: "#5C3D6B", marginBottom: "2px" }}>🐱 DECK ({room.deck.length})</div>
                <CardFace 
                  faceDown 
                  size="sm" 
                  glowing={isMyTurnGlow}
                  bouncing={isMyTurnGlow}
                  dealAnimation={dealAnimation}
                  onClick={isMyTurn && room.turnState === "draw" ? () => drawFrom("deck") : undefined} 
                />
              </div>
              <div style={{ fontSize: "18px", opacity: 0.3 }}>🐾</div>
              <div style={{ textAlign: "center" }} data-dropzone="discard">
                <div style={{ fontSize: "8px", opacity: 0.5, color: "#5C3D6B", marginBottom: "2px" }}>
                  🐾 DISCARD {isMyTurn && room.turnState === "action" ? "⬇️" : ""}
                </div>
                <CardFace 
                  card={topDiscard} 
                  size="sm" 
                  glowing={isMyTurnGlow}
                  bouncing={isMyTurnGlow}
                  dealAnimation={dealAnimation}
                  onClick={isMyTurn && room.turnState === "draw" ? () => drawFrom("discard") : undefined} 
                />
              </div>
              {phase && room.status === "playing" && (
                <div style={{ textAlign: "center", maxWidth: "120px" }}>
                  <div style={{ fontSize: "8px", opacity: 0.5, color: "#5C3D6B" }}>🐱 PHASE {phase.id}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, lineHeight: "1.2", color: "#FF6B8A" }}>{phase.label}</div>
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
                color: isMyTurnGlow ? "#FF6B8A" : "#5C3D6B",
                fontWeight: isMyTurnGlow ? "bold" : "normal",
              }}>
                {isMyTurn
                  ? room.turnState === "draw"
                    ? "🎯 Tap 🐱 deck or 🐾 discard to draw!"
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
                      <div style={{ fontSize: "9px", opacity: 0.5, color: "#5C3D6B", marginBottom: "2px" }}>{owner?.name}'s phase</div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {groupsArr.map((g, gi) => (
                          <div
                            key={gi}
                            data-dropzone={`hit:${ownerId}:${gi}`}
                            style={{
                              display: "flex", gap: "2px", background: "rgba(255,107,138,0.05)", padding: "4px", borderRadius: "4px",
                              border: canHitHere ? "2px dashed #FF6B8A" : "1px dashed transparent",
                              boxShadow: canHitHere ? "0 0 15px rgba(255,107,138,0.15)" : "none",
                            }}
                          >
                            {g.cards.map((c) => <CardFace key={c.id} card={c} size="sm" dealAnimation={dealAnimation} />)}
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
                background: "rgba(255,107,138,0.08)", 
                borderRadius: "8px", 
                padding: "8px", 
                marginBottom: "8px",
                border: isMyTurnGlow ? "2px solid #FF6B8A" : "1px solid rgba(255,107,138,0.2)",
                boxShadow: isMyTurnGlow ? "0 0 30px rgba(255,107,138,0.1)" : "none",
              }}>
                <div style={{ fontSize: "10px", opacity: 0.6, color: "#5C3D6B", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>🎯 Build Phase {phase.id}</span>
                  <span style={{ fontSize: "9px" }}>
                    {hasDrawn ? "🃏 Drawn - Ready!" : "⏳ Draw first!"}
                    {undoStack.length > 0 && <span style={{ marginLeft: "6px", color: "#FF6B8A" }}>↩️ {undoStack.length}</span>}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {phase.reqs.map((req, i) => (
                    <div
                      key={i}
                      data-dropzone={`group:${i}`}
                      style={{
                        background: "rgba(255,255,255,0.3)", borderRadius: "6px", padding: "4px", minWidth: "100px", flex: "1",
                        border: isMyTurnGlow ? "2px dashed #FF6B8A" : "1px dashed rgba(255,107,138,0.3)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div style={{ fontSize: "8px", opacity: 0.5, color: "#5C3D6B", marginBottom: "2px" }}>
                        {req.type === "set" ? "Set" : req.type === "run" ? "Run" : "Color"} of {req.count} ({groups[i]?.length || 0}/{req.count})
                      </div>
                      <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", minHeight: "30px" }}>
                        {(groups[i] || []).length === 0 && <div style={{ fontSize: "9px", opacity: 0.3, alignSelf: "center", color: "#5C3D6B" }}>⬇️ drop</div>}
                        {(groups[i] || []).map((c) => (
                          <CardFace key={c.id} card={c} size="sm" draggable onPointerDownDrag={(e) => beginDrag(e, c)} dealAnimation={dealAnimation} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <button 
                    onClick={layDownPhase} 
                    disabled={!isMyTurn || !hasDrawn || me?.laidDownThisRound}
                    style={{ 
                      padding: "4px 12px", 
                      borderRadius: "6px", 
                      border: "none", 
                      background: (!isMyTurn || !hasDrawn) ? "#D4A0A0" : "#FF6B8A", 
                      color: "white", 
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
                      border: "1px solid rgba(255,107,138,0.3)", 
                      background: "transparent", 
                      color: "#5C3D6B", 
                      fontSize: "11px", 
                      cursor: "pointer" 
                    }}
                  >
                    ✖ Clear All
                  </button>
                  {!isMyTurn && <span style={{ fontSize: "9px", opacity: 0.5, color: "#5C3D6B" }}>⏳ Wait for your turn</span>}
                  {isMyTurn && !hasDrawn && <span style={{ fontSize: "9px", color: "#FF6B8A" }}>⚠️ Draw a card first!</span>}
                </div>
                {error && <div style={{ marginTop: "4px", color: "#FF6B8A", fontSize: "10px" }}>{error}</div>}
              </div>
            )}

            {/* Phase Complete Message */}
            {phase && room.status === "playing" && me?.laidDownThisRound && (
              <div style={{ 
                background: "rgba(125,190,140,0.15)", 
                borderRadius: "8px", 
                padding: "8px", 
                marginBottom: "8px",
                textAlign: "center",
                border: "1px solid #7DBE8C",
              }}>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#7DBE8C" }}>
                  ✅ Phase {phase.id} Complete! 🎉
                </div>
                <div style={{ fontSize: "10px", opacity: 0.6, color: "#5C3D6B" }}>
                  You laid down: {phase.label}
                </div>
              </div>
            )}

            {/* Hand - with glow/bounce when it's your turn */}
            {me && (
              <div style={{ marginTop: "6px" }} data-dropzone="hand">
                <div style={{ fontSize: "10px", opacity: 0.5, color: "#5C3D6B", marginBottom: "4px" }}>
                  Your hand ({me.hand.length})
                  {isMyTurnGlow && <span style={{ marginLeft: "8px", color: "#FF6B8A" }}>✨ Your turn!</span>}
                </div>
                <div style={{ 
                  display: "flex", 
                  gap: "3px", 
                  flexWrap: "wrap", 
                  justifyContent: "center", 
                  background: isMyTurnGlow ? "rgba(255,107,138,0.06)" : "rgba(255,107,138,0.03)", 
                  borderRadius: "8px", 
                  padding: "6px", 
                  minHeight: "50px",
                  boxShadow: isMyTurnGlow ? "0 0 40px rgba(255,107,138,0.05)" : "none",
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
                      dealAnimation={dealAnimation}
                      onPointerDownDrag={(e) => beginDrag(e, c)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Log */}
            <div style={{ marginTop: "6px", fontSize: "9px", opacity: 0.4, color: "#5C3D6B", maxHeight: "40px", overflowY: "auto" }}>
              {room.log.slice(-4).map((l, i) => <div key={i}>📝 {l}</div>)}
            </div>
          </div>
        </div>
      </>
    );
  }

  return <div style={bgStyle}>Loading…</div>;
}
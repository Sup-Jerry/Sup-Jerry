const fs = require('fs');

// ============================================================
// 数据输入层 — 替换此处更新贡献图
// ============================================================
const CONTRIB_GRID = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,4,0,0,0],[0,0,0,0,0,1,4],[2,4,4,3,0,2,0],[4,3,0,4,4,0,0],[3,4,3,3,2,0,0],[1,3,4,3,3,2,1],[1,4,3,3,3,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]];

const COLS = 53, ROWS = 7, CELL = 11, STEP = 14;
const BOARD_W = COLS * STEP - 3;
const BOARD_H = ROWS * STEP - 3;
const SVG_W = BOARD_W + 2;
const TEXT_H = 60; // height for typewriter section
const SVG_H = TEXT_H + 12 + BOARD_H + 2;
const BOARD_Y = TEXT_H + 12; // board starts here

const TOTAL = 30; // animation loop seconds

const LEVEL_COLORS = ['#161b22','#0e4429','#006d32','#26a641','#39d353'];
const NUM_COLORS   = ['','#58a6ff','#3fb950','#f85149','#d2a8ff','#ffa657','#76e3ea','#e6edf3','#7d8590'];

const isMine = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && (CONTRIB_GRID[c] && CONTRIB_GRID[c][r]) > 0;
const getLv  = (r, c) => (CONTRIB_GRID[c] && CONTRIB_GRID[c][r]) || 1;

// compute adjacency numbers
const num = Array.from({length: ROWS}, () => Array(COLS).fill(0));
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) {
    if (isMine(r, c)) continue;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if ((dr || dc) && isMine(r+dr, c+dc)) n++;
    num[r][c] = n;
  }

// BFS from multiple origins — assigns each cell a "wave distance"
// so cells at same distance from any origin reveal simultaneously (radial effect)
const dist = Array.from({length: ROWS}, () => Array(COLS).fill(Infinity));
const queue = [];

function bfsStart(r, c) {
  if (isMine(r, c) || dist[r][c] !== Infinity) return;
  dist[r][c] = 0;
  queue.push([r, c]);
}

bfsStart(0, 0); bfsStart(0, 20); bfsStart(3, 30); bfsStart(6, 40);

let qi = 0;
while (qi < queue.length) {
  const [r, c] = queue[qi++];
  if (num[r][c] !== 0) continue; // only expand from blank cells
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r+dr, nc = c+dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      if (isMine(nr, nc) || dist[nr][nc] !== Infinity) continue;
      dist[nr][nc] = dist[r][c] + 1;
      queue.push([nr, nc]);
    }
}

// build reveal order: sort by dist, cells with same dist get same timestamp
const revealCells = queue; // already in BFS order
const maxDist = Math.max(...revealCells.map(([r,c]) => dist[r][c]));
// time per wave layer
const REVEAL_DURATION = 8.0;
const revealTime = {};
revealCells.forEach(([r, c]) => {
  revealTime[r+','+c] = +((dist[r][c] / (maxDist + 1)) * REVEAL_DURATION).toFixed(3);
});

// mines
const mines = [];
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++)
    if (isMine(r, c)) mines.push([r, c]);

const flagStart  = REVEAL_DURATION + 0.5;
const flagEnd    = flagStart + mines.length * 0.18;
const greenStart = flagEnd + 0.6;
const greenEnd   = greenStart + mines.length * 0.06;

const flagTime  = {};
const greenTime = {};
mines.forEach(([r, c], i) => {
  flagTime[r+','+c]  = +(flagStart  + i * 0.18).toFixed(3);
  greenTime[r+','+c] = +(greenStart + i * 0.06).toFixed(3);
});

function pct(t) { return (t / TOTAL).toFixed(5); }

// ============================================================
// Build SVG board elements
// ============================================================
let rects = '', overlays = '';

for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const x = c * STEP + 1;
    const y = BOARD_Y + r * STEP + 1;
    const key = r+','+c;

    if (isMine(r, c)) {
      const ft = flagTime[key];
      const gt = greenTime[key];
      const lvColor = LEVEL_COLORS[getLv(r, c)];
      rects += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2">` +
        `<animate attributeName="fill" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite"` +
        ` keyTimes="0;${pct(ft)};${pct(gt)};1"` +
        ` values="#2d333b;#2d1b1b;${lvColor};${lvColor}"/></rect>`;
      overlays += `<text x="${x+CELL/2}" y="${y+CELL/2+3}" text-anchor="middle" font-size="8" fill="#f85149">` +
        `<animate attributeName="opacity" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite"` +
        ` keyTimes="0;${pct(ft)};${pct(gt)};1" values="0;1;0;0"/>⚑</text>`;
    } else if (revealTime[key] !== undefined) {
      const rt = revealTime[key];
      rects += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2">` +
        `<animate attributeName="fill" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite"` +
        ` keyTimes="0;${pct(rt)};1" values="#2d333b;#161b22;#161b22"/></rect>`;
      const n = num[r][c];
      if (n > 0) {
        overlays += `<text x="${x+CELL/2}" y="${y+CELL/2+3}" text-anchor="middle"` +
          ` font-size="7" font-weight="bold" fill="${NUM_COLORS[n]}">` +
          `<animate attributeName="opacity" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite"` +
          ` keyTimes="0;${pct(rt)};1" values="0;1;1"/>${n}</text>`;
      }
    } else {
      rects += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="#2d333b"/>`;
    }
  }
}

// ============================================================
// Typewriter text animation (3 phrases, CSS keyframes)
// Each phrase: type in, hold, delete, next
// Total text cycle fits within TOTAL seconds
// ============================================================
const phrases = ['一切靠积累', '不断升级操作系统', '你好，杨再鑫'];
// build per-character tspan visibility using animate
// simpler: use 3 <text> elements, each fades in char by char via clip or opacity trick
// We'll use a single <text> with 3 <tspan> children, toggled by opacity
// Each phrase gets ~8s: 2s type + 1.5s hold + 1.5s delete + 0.5s gap = ~5.5s × 3 ≈ 16.5s
// We'll use CSS animation on 3 text elements with delays

const CX = SVG_W / 2;
const TY = TEXT_H / 2 + 8;

// Build typewriter using SVG animate on text content isn't possible directly.
// Use opacity animate on pre-built character spans with staggered delays.
// Each phrase: chars appear one by one, hold, then disappear together.

const PHRASE_DURATION = TOTAL / 3; // ~10s per phrase
const TYPE_PER_CHAR = 0.12; // seconds per character
const HOLD = 2.0;

let textEls = '';
phrases.forEach((phrase, pi) => {
  const phaseStart = pi * PHRASE_DURATION;
  const chars = [...phrase];
  const typeEnd = phaseStart + chars.length * TYPE_PER_CHAR;
  const holdEnd = typeEnd + HOLD;
  const phaseEnd = phaseStart + PHRASE_DURATION;

  // whole phrase group: visible during [phaseStart, holdEnd], hidden otherwise
  // each char: visible from phaseStart + i*TYPE_PER_CHAR
  let charSpans = '';
  chars.forEach((ch, i) => {
    const charOn = phaseStart + i * TYPE_PER_CHAR;
    const charOff = holdEnd;
    // keyTimes need 4 points: 0, charOn, charOff, TOTAL
    const kts = [0, pct(charOn), pct(Math.min(charOff, TOTAL-0.001)), 1].join(';');
    const vals = charOn > 0 ? '0;1;0;0' : '1;1;0;0';
    charSpans += `<tspan>` +
      `<animate attributeName="opacity" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite"` +
      ` keyTimes="${kts}" values="${vals}"/>${ch}</tspan>`;
  });

  // cursor: blinks during typing, solid during hold, off otherwise
  const cursorOnStart = phaseStart;
  const cursorOffEnd = holdEnd;
  textEls += `<text x="${CX}" y="${TY}" text-anchor="middle"` +
    ` font-family="'SF Mono','Fira Code',monospace" font-size="22" fill="#e6edf3"` +
    ` letter-spacing="0.02em">${charSpans}</text>`;
});

// cursor bar — blinks throughout, but only visible when a phrase is active
const cursorEl = `<rect x="${CX+2}" y="${TY-18}" width="2" height="20" fill="#3fb950">` +
  `<animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/></rect>`;

// ============================================================
// Assemble SVG
// ============================================================
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}">
<rect width="100%" height="100%" fill="#161b22"/>
<line x1="0" y1="${TEXT_H+6}" x2="${SVG_W}" y2="${TEXT_H+6}" stroke="#21262d" stroke-width="1"/>
${textEls}
${cursorEl}
${rects}
${overlays}
</svg>`;

fs.writeFileSync('minesweeper.svg', svg);
console.log('done, size:', (svg.length/1024).toFixed(1), 'KB');

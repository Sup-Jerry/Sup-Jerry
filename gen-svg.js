const fs = require('fs');

// ============================================================
// 数据输入层 — 替换此处更新贡献图
// ============================================================
const CONTRIB_GRID = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,4,0,0,0],[0,0,0,0,0,1,4],[2,4,4,3,0,2,0],[4,3,0,4,4,0,0],[3,4,3,3,2,0,0],[1,3,4,3,3,2,1],[1,4,3,3,3,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]];

const COLS = 53, ROWS = 7, CELL = 11, STEP = 14;
const BOARD_W = COLS * STEP - 3;
const BOARD_H = ROWS * STEP - 3;
const SVG_W = BOARD_W + 2;
const TEXT_H = 56;
const SVG_H = TEXT_H + 10 + BOARD_H + 2;
const BOARD_Y = TEXT_H + 10;
const TOTAL = 14; // loop seconds

const LEVEL_COLORS = ['#161b22','#0e4429','#006d32','#26a641','#39d353'];
const NUM_COLORS   = ['','#58a6ff','#3fb950','#f85149','#d2a8ff','#ffa657','#76e3ea','#e6edf3','#7d8590'];

const isMine = (r,c) => r>=0&&r<ROWS&&c>=0&&c<COLS&&(CONTRIB_GRID[c]&&CONTRIB_GRID[c][r])>0;
const getLv  = (r,c) => (CONTRIB_GRID[c]&&CONTRIB_GRID[c][r])||1;

// adjacency numbers
const num = Array.from({length:ROWS},()=>Array(COLS).fill(0));
for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
  if(isMine(r,c)) continue;
  let n=0;
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++)
    if((dr||dc)&&isMine(r+dr,c+dc)) n++;
  num[r][c]=n;
}

// flood fill reveal order (original sequential order)
const revealed = Array.from({length:ROWS},()=>Array(COLS).fill(false));
const revealOrder = [];
function flood(r,c){
  if(r<0||r>=ROWS||c<0||c>=COLS||revealed[r][c]||isMine(r,c)) return;
  revealed[r][c]=true; revealOrder.push([r,c]);
  if(num[r][c]===0) for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(dr||dc) flood(r+dr,c+dc);
}
flood(0,0); flood(0,20); flood(3,30); flood(6,40);

const mines=[];
for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(isMine(r,c)) mines.push([r,c]);

// timeline
const REVEAL_DUR = 5.0;
const flagStart  = REVEAL_DUR + 0.4;
const flagEnd    = flagStart + mines.length * 0.14;
const greenStart = flagEnd + 0.5;
const greenEnd   = greenStart + mines.length * 0.05;
// TOTAL = 22 > greenEnd(~9.5) + hold(~3) = fine

const revealTime={}, flagTime={}, greenTime={};
revealOrder.forEach(([r,c],i)=>{ revealTime[r+','+c]=+((i/revealOrder.length)*REVEAL_DUR).toFixed(3); });
mines.forEach(([r,c],i)=>{ flagTime[r+','+c]=+(flagStart+i*0.14).toFixed(3); greenTime[r+','+c]=+(greenStart+i*0.05).toFixed(3); });

const pct = t => (t/TOTAL).toFixed(5);

// board elements
let rects='', overlays='';
for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
  const x=c*STEP+1, y=BOARD_Y+r*STEP+1, key=r+','+c;
  if(isMine(r,c)){
    const ft=flagTime[key], gt=greenTime[key], lvc=LEVEL_COLORS[getLv(r,c)];
    rects+=`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2"><animate attributeName="fill" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite" keyTimes="0;${pct(ft)};${pct(gt)};1" values="#2d333b;#2d1b1b;${lvc};${lvc}"/></rect>`;
    overlays+=`<text x="${x+CELL/2}" y="${y+CELL/2+3}" text-anchor="middle" font-size="8" fill="#f85149"><animate attributeName="opacity" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite" keyTimes="0;${pct(ft)};${pct(gt)};1" values="0;1;0;0"/>⚑</text>`;
  } else if(revealTime[key]!==undefined){
    const rt=revealTime[key];
    rects+=`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2"><animate attributeName="fill" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite" keyTimes="0;${pct(rt)};1" values="#2d333b;#161b22;#161b22"/></rect>`;
    const n=num[r][c];
    if(n>0) overlays+=`<text x="${x+CELL/2}" y="${y+CELL/2+3}" text-anchor="middle" font-size="7" font-weight="bold" fill="${NUM_COLORS[n]}"><animate attributeName="opacity" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite" keyTimes="0;${pct(rt)};1" values="0;1;1"/>${n}</text>`;
  } else {
    rects+=`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="#2d333b"/>`;
  }
}

// ============================================================
// Typewriter: 3 phrases, each char appears one by one
// Cursor follows end of current text
// ============================================================
const phrases = ['一切靠积累','不断升级操作系统','你好，杨再鑫'];
const PHRASE_DUR = TOTAL / 3; // ~7.33s each
const TYPE_MS = 0.10; // seconds per char
const HOLD = 1.8;
const CY = TEXT_H / 2 + 8;
const FONT_SIZE = 22;
const CHAR_W = FONT_SIZE * 1.05; // approx char width for cursor positioning

let textEls = '';
phrases.forEach((phrase, pi) => {
  const chars = [...phrase];
  const phaseStart = pi * PHRASE_DUR;
  const typeEnd = phaseStart + chars.length * TYPE_MS;
  const holdEnd = typeEnd + HOLD;

  chars.forEach((ch, i) => {
    const on  = phaseStart + i * TYPE_MS;
    const off = holdEnd;
    // x position: centered group, each char offset
    const groupW = chars.length * CHAR_W;
    const startX = (SVG_W - groupW) / 2;
    const cx = startX + i * CHAR_W + CHAR_W / 2;
    const kt = `0;${pct(on)};${pct(Math.min(off,TOTAL-0.01))};1`;
    const v  = on > 0.001 ? '0;1;0;0' : '1;1;0;0';
    textEls += `<text x="${cx.toFixed(1)}" y="${CY}" text-anchor="middle" font-family="'PingFang SC','Microsoft YaHei',sans-serif" font-size="${FONT_SIZE}" fill="#e6edf3"><animate attributeName="opacity" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite" keyTimes="${kt}" values="${v}"/>${ch}</text>`;
  });

  // cursor: appears at end of last typed char, disappears at holdEnd
  chars.forEach((ch, i) => {
    const groupW = chars.length * CHAR_W;
    const startX = (SVG_W - groupW) / 2;
    // cursor visible only after char i typed, before char i+1 typed (or at end)
    const cursorOn  = phaseStart + i * TYPE_MS;
    const cursorOff = i < chars.length - 1 ? phaseStart + (i+1) * TYPE_MS : holdEnd;
    const cx = startX + (i+1) * CHAR_W;
    const kt = `0;${pct(cursorOn)};${pct(Math.min(cursorOff,TOTAL-0.01))};1`;
    textEls += `<rect x="${cx.toFixed(1)}" y="${CY-FONT_SIZE+2}" width="2" height="${FONT_SIZE}" fill="#3fb950"><animate attributeName="opacity" calcMode="discrete" dur="${TOTAL}s" repeatCount="indefinite" keyTimes="${kt}" values="0;1;0;0"/></rect>`;
  });
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}">
<rect width="100%" height="100%" fill="#161b22"/>
<line x1="0" y1="${TEXT_H+5}" x2="${SVG_W}" y2="${TEXT_H+5}" stroke="#21262d" stroke-width="1"/>
${textEls}
${rects}
${overlays}
</svg>`;

fs.writeFileSync('minesweeper.svg', svg);
console.log('done, size:', (svg.length/1024).toFixed(1), 'KB');

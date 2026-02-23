import React, { useEffect, useRef } from 'react';
import './AssetPreview.css';

// ─────────────────────────────────────────────
// Inline wobbleOffset (mirrors src/utils/math.ts)
// ─────────────────────────────────────────────
function wobbleOffset(seed: number, t: number, amplitude = 2): number {
  return (
    Math.sin(t * 3.7 + seed) * amplitude * 0.5 +
    Math.sin(t * 7.1 + seed * 2) * amplitude * 0.3
  );
}

// ─────────────────────────────────────────────
// Shared art-style constants
// ─────────────────────────────────────────────
const LINE  = '#222222';
const WHITE = '#FFFFFF';

// ─────────────────────────────────────────────
// CanvasBox – mounts a canvas, runs RAF, calls draw(ctx, t)
// ─────────────────────────────────────────────
interface CanvasBoxProps {
  label: string;
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
}

const CanvasBox: React.FC<CanvasBoxProps> = ({ label, width, height, draw }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number>(0);
  const drawRef   = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = width  * dpr;
    canvas.height = height * dpr;
    canvas.style.width  = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const loop = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;
      ctx.clearRect(0, 0, width, height);
      drawRef.current(ctx, t);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height]);

  return (
    <div className="asset-preview__canvas-wrap">
      <canvas ref={canvasRef} />
      <span>{label}</span>
    </div>
  );
};

// ══════════════════════════════════════════════
// SECTION 1 — CHARACTER ITEMS
// ══════════════════════════════════════════════

function drawSwordFn(ctx: CanvasRenderingContext2D, _t: number): void {
  const cx = 75, cy = 100;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 4);

  // Blade – tapered quadrilateral, 34px tall, 6→2px wide
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.fillStyle = '#D0D8E0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3,  17);
  ctx.lineTo( 3,  17);
  ctx.lineTo( 1, -17);
  ctx.lineTo(-1, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Highlight line down center
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 15);
  ctx.quadraticCurveTo(0.5, 0, 0, -15);
  ctx.stroke();
  ctx.restore();

  // Crossguard – curved gold bar, 20px wide
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.fillStyle = '#C0A040';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 19);
  ctx.quadraticCurveTo(0, 17, 10, 19);
  ctx.quadraticCurveTo(0, 22, -10, 19);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Handle – rect 5x12, leather brown, grip lines
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.fillStyle = '#8B5E3C';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(-2.5, 22, 5, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-2.5, 25 + i * 3);
    ctx.lineTo(2.5,  25 + i * 3);
    ctx.stroke();
  }
  ctx.restore();

  // Pommel – circle r=4, gold
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.fillStyle = '#C0A040';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawFlagFn(ctx: CanvasRenderingContext2D, t: number): void {
  const cx = 75, cy = 115;
  ctx.save();
  ctx.translate(cx, cy);

  // Pole – 48px, silver
  ctx.strokeStyle = '#AAAAAA';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 24);
  ctx.lineTo(0, -24);
  ctx.stroke();

  // Star at top – 5-point, gold
  ctx.save();
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r     = i % 2 === 0 ? 5 : 2;
    const vx    = Math.cos(angle) * r;
    const vy    = Math.sin(angle) * r - 28;
    if (i === 0) ctx.moveTo(vx, vy);
    else         ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Flag fabric – 22x14, wavy sine animation
  const wave1 = Math.sin(t * 3) * 3;
  const wave2 = Math.sin(t * 3 + 1) * 2;
  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.fillStyle = '#F0F0FF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(1, -22);
  ctx.quadraticCurveTo(12 + wave1, -22 + wave2, 23, -22 + wave1 * 0.5);
  ctx.quadraticCurveTo(23 + wave2, -8 + wave1,  23, -8);
  ctx.quadraticCurveTo(12 + wave2, -8 + wave2,   1, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Earth design – blue circle r=5, green blobs, white arc
  const ex = 12 + wave1 * 0.25, ey = -15 + wave2 * 0.25;
  ctx.fillStyle = '#4488CC';
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(ex, ey, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#44AA44';
  ctx.beginPath();
  ctx.ellipse(ex - 1.5, ey - 1, 2.5, 1.8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ex + 2, ey + 1.5, 1.8, 1.2, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(ex, ey, 3.5, Math.PI * 0.8, Math.PI * 1.4);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function drawCoffeeTrayFn(ctx: CanvasRenderingContext2D, t: number): void {
  const cx = 75, cy = 115;
  ctx.save();
  ctx.translate(cx, cy);
  const trayWobble = wobbleOffset(20, t, 0.06);
  ctx.rotate(trayWobble);

  // Tray bar
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(0, wobbleOffset(21, t, 1.5), 22, 0);
  ctx.stroke();

  // Two cups
  function drawCup(x: number, y: number): void {
    const w = 10, h = 13;
    ctx.strokeStyle = LINE;
    ctx.fillStyle = WHITE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x, y, w, 4);
  }

  drawCup(-18, -18);
  drawCup(-4,  -18);
  ctx.restore();
}

// ══════════════════════════════════════════════
// SECTION 2 — EVENT EFFECTS
// ══════════════════════════════════════════════

function drawBumpWarnFn(ctx: CanvasRenderingContext2D, t: number): void {
  const cx = 60, cy = 70;
  const bob = Math.sin(t * 5) * 2;
  ctx.save();
  ctx.translate(cx, cy + bob);

  // Warning triangle
  ctx.strokeStyle = '#DD2222';
  ctx.fillStyle = '#FFDD00';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -32);
  ctx.lineTo(28, 18);
  ctx.lineTo(-28, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // "!" inside
  ctx.fillStyle = '#DD2222';
  ctx.font = 'bold 22px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 0, 0);
  ctx.restore();

  // Small pole below
  ctx.save();
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 20);
  ctx.lineTo(cx, cy + 55);
  ctx.stroke();
  ctx.restore();
}

function drawBumpImpactFn(ctx: CanvasRenderingContext2D, t: number): void {
  const cx = 60, cy = 75;
  const colors = ['#FF4444', '#FF8800', '#FFDD00', WHITE];
  const lineCount = 8;
  // Progress oscillates 0.2 → 0.8 to stay mid-animation
  const progress = 0.4 + Math.sin(t * 4) * 0.3;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = Math.max(0.2, 1 - progress + 0.4);

  for (let i = 0; i < lineCount; i++) {
    const angle  = (i / lineCount) * Math.PI * 2;
    const innerR = 6 + progress * 8;
    const outerR = 20 + progress * 26;
    const color  = colors[i % colors.length];

    ctx.strokeStyle = color;
    ctx.lineWidth   = Math.max(0.5, 2.5 - progress * 1.5);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    ctx.stroke();
  }

  // Center flash dot
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(0, 0, 5 + progress * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWindParticlesFn(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save();
  ctx.strokeStyle = '#AABBCC';
  ctx.lineCap = 'round';

  for (let i = 0; i < 18; i++) {
    const seed   = i * 137.5;
    const baseY  = 10 + (i / 18) * 140;
    const length = 10 + ((seed * 0.137) % 1) * 18;
    const alpha  = 0.3 + Math.sin(t * 2 + seed) * 0.2;
    const offsetX = (t * 60 + seed * 4) % 140;
    const wave   = Math.sin(t * 3 + seed * 0.1) * 2;

    ctx.globalAlpha = Math.max(0.1, alpha);
    ctx.lineWidth   = 1 + ((seed * 0.07) % 1);
    ctx.beginPath();
    ctx.moveTo(130 - offsetX,           baseY + wave);
    ctx.quadraticCurveTo(
      130 - offsetX - length * 0.5,
      baseY + wave * 0.5,
      130 - offsetX - length,
      baseY
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ══════════════════════════════════════════════
// SECTION 3 — BACKGROUND THEMES
// ══════════════════════════════════════════════

function drawPoliticsThemeFn(ctx: CanvasRenderingContext2D, t: number): void {
  const W = 390, H = 300, groundY = 240;

  // Sky
  ctx.fillStyle = '#F2EFE8';
  ctx.fillRect(0, 0, W, H);

  // Marble ground
  ctx.fillStyle = '#F0EAD6';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  function drawMarbleBuilding(bx: number, bw: number, bh: number): void {
    const by = groundY - bh;
    ctx.save();

    // Body – cream marble
    ctx.fillStyle = '#F5F0E0';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.stroke();

    // Dome top
    ctx.fillStyle = '#EDE8D8';
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by, bw * 0.42, bh * 0.12, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Gold spire
    ctx.strokeStyle = '#C0A060';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, by - bh * 0.12);
    ctx.lineTo(bx + bw / 2, by - bh * 0.12 - 20);
    ctx.stroke();

    // Columns
    ctx.strokeStyle = '#D0C8A8';
    ctx.lineWidth = 3;
    const cols = Math.max(2, Math.floor(bw / 20));
    for (let c = 0; c < cols; c++) {
      const cx2 = bx + 8 + (c / Math.max(1, cols - 1)) * (bw - 16);
      ctx.beginPath();
      ctx.moveTo(cx2, by + bh);
      ctx.lineTo(cx2, by + 12);
      ctx.stroke();
    }

    // Arch windows with gold trim
    const winCount = Math.max(1, Math.floor(bw / 32));
    for (let wi = 0; wi < winCount; wi++) {
      const wx = bx + 10 + (wi / Math.max(1, winCount)) * (bw - 20);
      const wy = by + bh * 0.3;
      ctx.fillStyle = '#D4C898';
      ctx.strokeStyle = '#C0A060';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(wx - 7, wy + 22);
      ctx.lineTo(wx - 7, wy + 8);
      ctx.arc(wx, wy + 8, 7, Math.PI, 0);
      ctx.lineTo(wx + 7, wy + 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  drawMarbleBuilding(20,  80, 160);
  drawMarbleBuilding(150, 110, 200);
  drawMarbleBuilding(295, 75, 130);

  // Ground shimmer
  ctx.save();
  ctx.strokeStyle = 'rgba(255,245,215,0.4)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) {
    const shimmer = Math.sin(t * 1.5 + x * 0.05) * 2;
    ctx.beginPath();
    ctx.moveTo(x, groundY + shimmer);
    ctx.lineTo(x + 16, groundY + shimmer + 1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawIsekaiThemeFn(ctx: CanvasRenderingContext2D, t: number): void {
  const W = 390, H = 300, groundY = 240;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0,   '#0A0818');
  skyGrad.addColorStop(0.5, '#1A1040');
  skyGrad.addColorStop(1,   '#2A1860');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, groundY);

  // Stars – 40 dots, twinkling
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 97 + 13) % W);
    const sy = ((i * 61 + 7)  % (groundY - 20));
    const r  = 0.7 + (i % 3) * 0.5;
    const alpha = 0.5 + Math.sin(t * 2 + i) * 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Moon – top right with glow
  ctx.save();
  const moonX = W - 52, moonY = 38;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 14, moonX, moonY, 44);
  moonGlow.addColorStop(0, 'rgba(255,248,160,0.28)');
  moonGlow.addColorStop(1, 'rgba(255,248,160,0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFF8C8';
  ctx.strokeStyle = '#D4B840';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3 craters
  const craters: [number, number, number][] = [[-6, -4, 4], [6, 5, 3], [1, -9, 2.5]];
  for (const [dx, dy, cr] of craters) {
    ctx.strokeStyle = '#C8B030';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(moonX + dx, moonY + dy, cr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Ground – dark green
  ctx.fillStyle = '#1A4A2A';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = '#2A6A3A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  // Grass tufts
  ctx.fillStyle = '#2A8A3A';
  ctx.strokeStyle = '#1A5A2A';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 18) {
    const gw = 6 + (gx % 8);
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx + gw * 0.5, groundY - 6);
    ctx.lineTo(gx + gw, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Castle helper
  function drawCastle(bx: number, bw: number, bh: number): void {
    const by = groundY - bh;
    ctx.save();
    ctx.fillStyle = '#2A2840';
    ctx.strokeStyle = '#4A4870';
    ctx.lineWidth = 1.5;

    // Main body
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.fill();
    ctx.stroke();

    // Battlements
    const battW = 10;
    const battCount = Math.floor(bw / battW);
    for (let b = 0; b < battCount; b += 2) {
      ctx.beginPath();
      ctx.rect(bx + b * battW, by - 8, battW, 8);
      ctx.fill();
      ctx.stroke();
    }

    // Center tower
    const tx = bx + bw / 2 - 12;
    ctx.beginPath();
    ctx.rect(tx, by - 32, 24, 32);
    ctx.fill();
    ctx.stroke();

    // Triangular tower top
    ctx.fillStyle = '#3A3860';
    ctx.beginPath();
    ctx.moveTo(tx,      by - 32);
    ctx.lineTo(tx + 12, by - 50);
    ctx.lineTo(tx + 24, by - 32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arrow slit windows
    ctx.fillStyle = '#110E22';
    const cols = Math.floor(bw / 20);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = bx + 8 + col * 20;
        const wy = by + 10 + row * 28;
        if (wx + 6 > bx + bw) continue;
        ctx.beginPath();
        ctx.rect(wx, wy, 4, 10);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawCastle(15,  90, 120);
  drawCastle(255, 100, 140);

  // Dark fantasy tree
  ctx.save();
  const treeX = 180, treeY = groundY;
  ctx.strokeStyle = '#1A0E08';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(treeX, treeY);
  ctx.lineTo(treeX, treeY - 55);
  ctx.stroke();

  const leafShades = ['#0D2010', '#0A1A0C', '#061008'];
  for (let tier = 0; tier < 3; tier++) {
    const lw = 26 - tier * 5;
    const lh = 18 - tier * 3;
    const ly = treeY - 44 - tier * 15;
    ctx.fillStyle = leafShades[tier];
    ctx.strokeStyle = '#082210';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(treeX - lw, ly);
    ctx.lineTo(treeX, ly - lh);
    ctx.lineTo(treeX + lw, ly);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Glowing purple dot atop tree
  const pulse = 0.6 + Math.sin(t * 3) * 0.4;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#CC88FF';
  ctx.shadowColor = '#9944FF';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(treeX, treeY - 76, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();

  // Magic circle on ground
  ctx.save();
  ctx.translate(195, groundY + 12);
  ctx.rotate(t * 0.5);

  // Outer glow
  const mcGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, 52);
  mcGlow.addColorStop(0, 'rgba(153,102,255,0.18)');
  mcGlow.addColorStop(1, 'rgba(153,102,255,0)');
  ctx.fillStyle = mcGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();

  // Outer solid circle
  ctx.strokeStyle = '#9966FF';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.stroke();

  // Inner dashed circle
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#CC88FF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Hexagram – 2 overlapping triangles
  for (let tri = 0; tri < 2; tri++) {
    ctx.strokeStyle = tri === 0 ? '#9966FF' : '#CC88FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let v = 0; v < 3; v++) {
      const ang = (v / 3) * Math.PI * 2 + tri * (Math.PI / 3);
      const vx2 = Math.cos(ang) * 32;
      const vy2 = Math.sin(ang) * 32;
      if (v === 0) ctx.moveTo(vx2, vy2);
      else         ctx.lineTo(vx2, vy2);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 6 glowing dots at hexagram vertices
  for (let v = 0; v < 6; v++) {
    const ang = (v / 6) * Math.PI * 2;
    const vx2 = Math.cos(ang) * 32;
    const vy2 = Math.sin(ang) * 32;
    const dotP = 0.6 + Math.sin(t * 4 + v) * 0.4;
    ctx.globalAlpha = dotP;
    ctx.fillStyle = '#CC88FF';
    ctx.shadowColor = '#9944FF';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(vx2, vy2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawMoonSurfaceFn(ctx: CanvasRenderingContext2D, _t: number): void {
  const W = 390, H = 300, groundY = 220;

  // Near-black sky
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  // Earth – top right
  ctx.save();
  const ex = W - 50, ey = 45;
  ctx.fillStyle = '#2266CC';
  ctx.beginPath();
  ctx.arc(ex, ey, 32, 0, Math.PI * 2);
  ctx.fill();

  // Continents
  ctx.fillStyle = '#44AA44';
  const blobs: [number, number, number, number, number][] = [
    [-8, -10, 12, 8, 0.3], [10, 5, 8, 6, -0.4], [-5, 8, 6, 4, 0.2],
  ];
  for (const [dx, dy, rw, rh, ang] of blobs) {
    ctx.beginPath();
    ctx.ellipse(ex + dx, ey + dy, rw, rh, ang, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloud arcs
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ex - 8, ey - 14, 18, Math.PI * 0.7, Math.PI * 1.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ex + 6, ey + 10, 14, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.restore();

  // Gray ground
  ctx.fillStyle = '#B0B0B0';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = '#888888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  // Craters
  const craters: [number, number, number, number][] = [
    [60, groundY + 15, 28, 10],
    [180, groundY + 8,  22, 8],
    [300, groundY + 20, 36, 14],
    [130, groundY + 30, 16, 6],
  ];
  for (const [cx2, cy2, rw, rh] of craters) {
    ctx.fillStyle = '#989898';
    ctx.strokeStyle = '#7A7A7A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx2, cy2, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8A8A8A';
    ctx.beginPath();
    ctx.ellipse(cx2, cy2, rw * 0.55, rh * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMarsSurfaceFn(ctx: CanvasRenderingContext2D, t: number): void {
  const W = 390, H = 300, groundY = 220;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0,   '#1A0808');
  skyGrad.addColorStop(0.5, '#6B1A0A');
  skyGrad.addColorStop(1,   '#C44420');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, groundY);

  // Red ground
  ctx.fillStyle = '#C44420';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = '#A03318';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  // Rock formations
  function drawRock(rx: number, rw: number, rh: number): void {
    const ry = groundY - rh;
    ctx.save();
    ctx.fillStyle = '#8B3A1A';
    ctx.strokeStyle = '#6A2A10';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx, groundY);
    ctx.quadraticCurveTo(rx - 4, ry + rh * 0.6, rx + 5, ry);
    ctx.quadraticCurveTo(rx + rw * 0.5, ry - 8, rx + rw - 5, ry + 5);
    ctx.quadraticCurveTo(rx + rw + 4, ry + rh * 0.5, rx + rw, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawRock(15,  55, 90);
  drawRock(100, 40, 55);
  drawRock(285, 70, 110);
  drawRock(340, 35, 60);

  // Sandstorm particles
  ctx.save();
  for (let i = 0; i < 30; i++) {
    const seed = i * 71;
    const py   = 10 + (seed % (groundY - 20));
    const plen = 5 + (seed % 12);
    const alpha = 0.15 + (seed % 50) / 100;
    const offsetX = (t * 45 + seed * 3) % (W + plen);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#CC6633';
    ctx.lineWidth   = 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W - offsetX,        py);
    ctx.lineTo(W - offsetX - plen, py + 1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawVenusSurfaceFn(ctx: CanvasRenderingContext2D, t: number): void {
  const W = 390, H = 300, groundY = 230;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0,   '#3D2E0A');
  skyGrad.addColorStop(0.5, '#8C6A10');
  skyGrad.addColorStop(1,   '#C8940A');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, groundY);

  // 3 layers of yellow cloud ellipses
  const cloudDefs: [number, number, number, number, number][] = [
    [80,  40, 120, 18, 0.5], [200, 70, 100, 14, 0.4], [310, 50, 90, 16, 0.45],
    [30,  90,  80, 12, 0.35],[250,110, 110, 15, 0.4], [130,130,  95, 12, 0.3],
  ];
  for (const [cx2, cy2, rw, rh, alpha] of cloudDefs) {
    const drift = Math.sin(t * 0.5 + cx2 * 0.01) * 4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#F0C040';
    ctx.beginPath();
    ctx.ellipse(cx2 + drift, cy2, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Yellow-ish ground
  ctx.fillStyle = '#D4A020';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = '#A87818';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();
}

function drawJupiterSurfaceFn(ctx: CanvasRenderingContext2D, t: number): void {
  const W = 390, H = 300;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0,   '#2A1200');
  skyGrad.addColorStop(0.5, '#7A3A0A');
  skyGrad.addColorStop(1,   '#C46820');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Horizontal bands with slight wave
  const bandDefs: [number, number, string, number][] = [
    [30,  22, '#CC7030', 0.5], [75,  18, '#E8A050', 0.4],
    [115, 20, '#C06820', 0.45],[158, 16, '#D48040', 0.4],
    [200, 22, '#B85818', 0.5],
  ];
  for (const [by, bh, color, alpha] of bandDefs) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, by + Math.sin(t * 0.3 + by * 0.05) * 3);
    for (let x = 0; x <= W; x += 40) {
      ctx.lineTo(x, by + Math.sin(t * 0.4 + x * 0.05) * 3);
    }
    ctx.lineTo(W, by + bh);
    ctx.lineTo(0, by + bh);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Great Red Spot
  ctx.save();
  ctx.translate(240, 145);
  ctx.rotate(t * 0.05);
  ctx.fillStyle = '#A02808';
  ctx.strokeStyle = '#802008';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 50, 28, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#C03010';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 36, 18, 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 10, 0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Gas cloud particles
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const seed = i * 53;
    const px   = (seed * 17) % W;
    const py   = 20 + (seed % (H - 40));
    const rw   = 20 + (seed % 30);
    const rh   = 8  + (seed % 12);
    const alpha = 0.08 + (seed % 20) / 100;
    const drift = Math.sin(t * 0.5 + i) * 5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#CC7030';
    ctx.beginPath();
    ctx.ellipse(px + drift, py, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawUranusSurfaceFn(ctx: CanvasRenderingContext2D, t: number): void {
  const W = 390, H = 300, groundY = 230;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrad.addColorStop(0,   '#040A14');
  skyGrad.addColorStop(0.5, '#082840');
  skyGrad.addColorStop(1,   '#0C4A6A');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, groundY);

  // Tilted ring system – 3 ellipse arcs, front solid / back dashed
  ctx.save();
  ctx.translate(W / 2, 85);
  ctx.rotate(-0.35);

  for (let ring = 0; ring < 3; ring++) {
    const ry = (ring + 1) * 14;
    const rx = 88 + ring * 18;
    const alpha = 0.55 - ring * 0.1;

    // Back half – dashed
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = `rgba(160,216,232,${alpha * 0.55})`;
    ctx.lineWidth = ring === 0 ? 2 : 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Front half – solid
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(160,216,232,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Ice blue ground
  ctx.fillStyle = '#0C3A50';
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = '#A0D8E8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  // Ice crystals – diamond/rhombus shapes
  const crystals: [number, number, number][] = [
    [40, groundY, 18], [80, groundY, 12], [140, groundY, 22],
    [200, groundY, 16],[250, groundY, 10],[310, groundY, 20],
    [360, groundY, 14],
  ];
  for (const [cx2, cy2, h] of crystals) {
    const glimmer = 0.6 + Math.sin(t * 3 + cx2 * 0.1) * 0.3;
    ctx.save();
    ctx.globalAlpha = glimmer;
    ctx.fillStyle = '#A0D8E8';
    ctx.strokeStyle = '#C0EEF8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx2, cy2 - h);
    ctx.lineTo(cx2 + h * 0.35, cy2 - h * 0.4);
    ctx.lineTo(cx2, cy2);
    ctx.lineTo(cx2 - h * 0.35, cy2 - h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ══════════════════════════════════════════════
// SECTION 4 — UI ELEMENTS
// ══════════════════════════════════════════════

function drawRankBadgeFn(ctx: CanvasRenderingContext2D, _t: number): void {
  const variants: [string, string][] = [
    ['#4A90D9', 'D급 신입'],
    ['#C0A060', 'B급 대리'],
    ['#9944CC', 'A급 용사'],
    ['#44AACC', 'S급 우주인'],
  ];

  variants.forEach(([color, rank], i) => {
    const bx = 8 + (i % 2) * 156;
    const by = 8 + Math.floor(i / 2) * 60;
    const bw = 140, bh = 44;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur  = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle   = WHITE;
    ctx.strokeStyle = LINE;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Left color bar
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, 6, bh, [8, 0, 0, 8]);
    ctx.fill();

    // Rank text
    ctx.fillStyle = LINE;
    ctx.font = 'bold 12px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rank, bx + bw / 2 + 3, by + bh / 2 - 7);

    // Progress pips
    const filled = Math.min(i + 1, 3);
    for (let p = 0; p < 3; p++) {
      ctx.fillStyle   = p < filled ? color : '#CCCCCC';
      ctx.strokeStyle = LINE;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(bx + 38 + p * 14, by + bh - 11, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawWindPillFn(ctx: CanvasRenderingContext2D, _t: number): void {
  ctx.fillStyle = '#666666';
  ctx.font = '11px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('바람 방향 & 강도 (3단계)', 142, 8);

  const variants: [number, 'left' | 'right'][] = [[1, 'left'], [2, 'right'], [3, 'left']];

  variants.forEach(([strength, dir], i) => {
    const bx = 6 + i * 92;
    const by = 34;
    const bw = 76, bh = 26;

    ctx.save();
    ctx.fillStyle   = WHITE;
    ctx.strokeStyle = LINE;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.stroke();

    // Arrow triangle
    ctx.fillStyle = LINE;
    ctx.beginPath();
    if (dir === 'left') {
      ctx.moveTo(bx + 14, by + bh / 2);
      ctx.lineTo(bx + 22, by + 5);
      ctx.lineTo(bx + 22, by + bh - 5);
    } else {
      ctx.moveTo(bx + 22, by + bh / 2);
      ctx.lineTo(bx + 14, by + 5);
      ctx.lineTo(bx + 14, by + bh - 5);
    }
    ctx.closePath();
    ctx.fill();

    // Strength bars
    for (let b = 0; b < 3; b++) {
      ctx.fillStyle   = b < strength ? '#FF8800' : '#CCCCCC';
      ctx.strokeStyle = LINE;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.roundRect(bx + 30 + b * 13, by + 6, 9, bh - 12, 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawPromotionCardFn(ctx: CanvasRenderingContext2D, _t: number): void {
  const cx = 20, cy = 20;
  const bw = 260, bh = 155;

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur    = 12;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle     = WHITE;
  ctx.strokeStyle   = LINE;
  ctx.lineWidth     = 2;
  ctx.beginPath();
  ctx.roundRect(cx, cy, bw, bh, 12);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Top color band
  ctx.fillStyle = '#4A90D9';
  ctx.beginPath();
  ctx.roundRect(cx, cy, bw, 44, [12, 12, 0, 0]);
  ctx.fill();

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 13px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('허약신입주식회사', cx + bw / 2, cy + 22);

  // Character silhouette
  const sx = cx + 42, sy = cy + 64;
  ctx.fillStyle   = LINE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.arc(sx, sy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx, sy + 12);
  ctx.lineTo(sx, sy + 32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx - 12, sy + 20);
  ctx.lineTo(sx + 12, sy + 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy + 32);
  ctx.lineTo(sx - 10, sy + 48);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, sy + 32);
  ctx.lineTo(sx + 10, sy + 48);
  ctx.stroke();

  // Rank change
  ctx.fillStyle = '#444444';
  ctx.font = '12px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('D급 신입', cx + 74, cy + 72);

  ctx.fillStyle = '#888888';
  ctx.font = '18px "Comic Sans MS", sans-serif';
  ctx.fillText('→', cx + 144, cy + 70);

  ctx.fillStyle = '#9944CC';
  ctx.font = 'bold 12px "Comic Sans MS", sans-serif';
  ctx.fillText('C급 주임', cx + 168, cy + 72);

  // 승진! label
  ctx.fillStyle = '#CC4444';
  ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('승진!', cx + bw / 2 + 20, cy + 118);

  ctx.restore();
}

// ══════════════════════════════════════════════
// SECTION 5 — CUTSCENE ELEMENTS
// ══════════════════════════════════════════════

function drawTruckFn(ctx: CanvasRenderingContext2D, _t: number): void {
  const ox = 10, oy = 55;
  ctx.save();

  // Cargo body
  ctx.fillStyle   = '#DD2222';
  ctx.strokeStyle = LINE;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.rect(ox, oy, 200, 80);
  ctx.fill();
  ctx.stroke();

  // Vertical panel lines on cargo
  ctx.strokeStyle = '#CC1111';
  ctx.lineWidth   = 1.5;
  for (let p = 0; p < 4; p++) {
    ctx.beginPath();
    ctx.moveTo(ox + 40 + p * 40, oy + 4);
    ctx.lineTo(ox + 40 + p * 40, oy + 76);
    ctx.stroke();
  }

  // Cab
  ctx.fillStyle   = '#DD2222';
  ctx.strokeStyle = LINE;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.rect(ox + 200, oy + 18, 80, 62);
  ctx.fill();
  ctx.stroke();

  // Windshield
  ctx.fillStyle   = '#88CCEE';
  ctx.strokeStyle = LINE;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.rect(ox + 208, oy + 24, 58, 36);
  ctx.fill();
  ctx.stroke();

  // Headlight
  ctx.fillStyle   = '#FFFF88';
  ctx.strokeStyle = LINE;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.rect(ox + 272, oy + 50, 14, 10);
  ctx.fill();
  ctx.stroke();

  // Wheels
  function drawWheel(wx: number, wy: number): void {
    ctx.fillStyle   = '#333333';
    ctx.strokeStyle = LINE;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(wx, wy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle   = '#888888';
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.arc(wx, wy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawWheel(ox + 60,  oy + 92);
  drawWheel(ox + 220, oy + 92);

  // Speech bubble "빵빵!"
  ctx.fillStyle   = WHITE;
  ctx.strokeStyle = LINE;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(ox + 236, oy - 42, 60, 28, 8);
  ctx.fill();
  ctx.stroke();

  // Bubble tail
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.moveTo(ox + 255, oy - 14);
  ctx.lineTo(ox + 266, oy - 2);
  ctx.lineTo(ox + 278, oy - 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth   = 1;
  ctx.stroke();

  ctx.fillStyle = LINE;
  ctx.font = 'bold 11px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('빵빵!', ox + 266, oy - 28);

  ctx.restore();
}

function drawIsekaiMagicCircleFn(ctx: CanvasRenderingContext2D, t: number): void {
  const cx = 120, cy = 120;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.4);

  // Radial glow gradient
  const glow = ctx.createRadialGradient(0, 0, 48, 0, 0, 112);
  glow.addColorStop(0, 'rgba(153,102,255,0.22)');
  glow.addColorStop(1, 'rgba(153,102,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 112, 0, Math.PI * 2);
  ctx.fill();

  // 3 concentric circles – solid, dashed, dotted
  ctx.strokeStyle = '#9966FF';
  ctx.lineWidth   = 1.8;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#CC88FF';
  ctx.lineWidth   = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([2, 4, 6, 4]);
  ctx.strokeStyle = '#AA66DD';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);

  // Hexagram – 2 overlapping triangles slowly rotating
  for (let tri = 0; tri < 2; tri++) {
    ctx.strokeStyle = tri === 0 ? '#9966FF' : '#CC88FF';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    for (let v = 0; v < 3; v++) {
      const ang = (v / 3) * Math.PI * 2 + tri * (Math.PI / 3);
      const vx  = Math.cos(ang) * 68;
      const vy  = Math.sin(ang) * 68;
      if (v === 0) ctx.moveTo(vx, vy);
      else         ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 6 pulsing glowing dots at hexagram vertices
  for (let v = 0; v < 6; v++) {
    const ang   = (v / 6) * Math.PI * 2;
    const vx    = Math.cos(ang) * 68;
    const vy    = Math.sin(ang) * 68;
    const pulse = 0.5 + Math.sin(t * 4 + v * 1.05) * 0.5;
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.fillStyle   = '#CC88FF';
    ctx.shadowColor = '#9944FF';
    ctx.shadowBlur  = 8 * pulse;
    ctx.beginPath();
    ctx.arc(vx, vy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
  ctx.restore();
}

function drawConfettiFn(ctx: CanvasRenderingContext2D, t: number): void {
  const W = 240, H = 180;
  const colors = [
    '#FF4444', '#FF8800', '#FFDD00', '#44CC44',
    '#4488FF', '#AA44CC', '#FF44AA', '#44DDCC',
  ];

  ctx.save();
  for (let i = 0; i < 60; i++) {
    const seed    = i * 137.508;
    const startX  = (seed * 7) % W;
    const speed   = 30 + (seed % 40);
    const fallY   = (t * speed + (seed % 50)) % (H + 20) - 10;
    const rotation = t * (1 + (seed % 3)) + seed;
    const pw      = 6 + (seed % 6);
    const ph      = 4 + (seed % 4);
    const color   = colors[i % colors.length];

    ctx.save();
    ctx.translate(startX, fallY);
    ctx.rotate(rotation);
    ctx.fillStyle   = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.restore();
  }
  ctx.restore();
}

// ══════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════

const AssetPreview: React.FC = () => {
  return (
    <div className="asset-preview">
      <div className="asset-preview__header">
        <h1>Asset Preview — The Great Commute</h1>
        <p>신규 에셋 캔버스 미리보기 — URL에 <code>?preview</code> 추가 시 표시</p>
      </div>

      {/* ── SECTION 1: Character Items ── */}
      <section className="asset-preview__section">
        <h2>Section 1 — Character Items</h2>
        <div className="asset-preview__grid">
          <CanvasBox label="1a. Sword (이세계용 검)" width={150} height={200} draw={drawSwordFn} />
          <CanvasBox label="1b. Flag (우주용 깃발)"  width={150} height={200} draw={drawFlagFn} />
          <CanvasBox label="1c. Coffee Tray (기존 참고용)" width={150} height={200} draw={drawCoffeeTrayFn} />
        </div>
      </section>

      {/* ── SECTION 2: Event Effects ── */}
      <section className="asset-preview__section">
        <h2>Section 2 — Event Effects</h2>
        <div className="asset-preview__grid">
          <CanvasBox label="2a. Bump Warning Sign"    width={120} height={160} draw={drawBumpWarnFn} />
          <CanvasBox label="2b. Bump Impact (burst)"  width={120} height={160} draw={drawBumpImpactFn} />
          <CanvasBox label="2c. Wind Particles"       width={130} height={160} draw={drawWindParticlesFn} />
          <div className="asset-preview__canvas-wrap">
            <div
              className="asset-preview__label-only"
              style={{ width: 200, height: 120, boxSizing: 'border-box' }}
            >
              2d. Screen Shake<br /><br />
              <em>ctx.translate(shakeX, shakeY)</em><br />
              <em>amplitude decays over 0.3s</em>
            </div>
            <span>Screen Shake (구현 방식)</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Background Themes ── */}
      <section className="asset-preview__section">
        <h2>Section 3 — Background Themes</h2>
        <div className="asset-preview__grid">
          <CanvasBox label="3a. Politics (정치 테마)"       width={390} height={300} draw={drawPoliticsThemeFn} />
          <CanvasBox label="3b. Isekai (이세계 테마)"       width={390} height={300} draw={drawIsekaiThemeFn} />
          <CanvasBox label="3c. Moon Surface (달 표면)"     width={390} height={300} draw={drawMoonSurfaceFn} />
          <CanvasBox label="3d. Mars Surface (화성 표면)"   width={390} height={300} draw={drawMarsSurfaceFn} />
          <CanvasBox label="3e. Venus Surface (금성 표면)"  width={390} height={300} draw={drawVenusSurfaceFn} />
          <CanvasBox label="3f. Jupiter Surface (목성 표면)" width={390} height={300} draw={drawJupiterSurfaceFn} />
          <CanvasBox label="3g. Uranus Surface (천왕성 표면)" width={390} height={300} draw={drawUranusSurfaceFn} />
        </div>
      </section>

      {/* ── SECTION 4: UI Elements ── */}
      <section className="asset-preview__section">
        <h2>Section 4 — UI Elements</h2>
        <div className="asset-preview__grid">
          <CanvasBox label="4a. Rank Badge (4 variants)" width={320} height={136} draw={drawRankBadgeFn} />
          <CanvasBox label="4b. Wind Direction Pill"     width={290} height={110} draw={drawWindPillFn} />
          <CanvasBox label="4c. Promotion Card (승진 카드)" width={300} height={200} draw={drawPromotionCardFn} />
        </div>
      </section>

      {/* ── SECTION 5: Cutscene Elements ── */}
      <section className="asset-preview__section">
        <h2>Section 5 — Cutscene Elements</h2>
        <div className="asset-preview__grid">
          <CanvasBox label="5a. Truck (컷씬 트럭)"             width={300} height={170} draw={drawTruckFn} />
          <CanvasBox label="5b. Isekai Magic Circle (마법진)"  width={240} height={240} draw={drawIsekaiMagicCircleFn} />
          <CanvasBox label="5c. Confetti Burst (승진 축하 콘페티)" width={240} height={180} draw={drawConfettiFn} />
        </div>
      </section>
    </div>
  );
};

export default AssetPreview;

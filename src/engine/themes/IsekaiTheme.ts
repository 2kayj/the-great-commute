import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from '../../utils/constants';
import { seededRandom } from '../../utils/math';
import type { BackgroundTheme, ThemeColors } from './BackgroundTheme';

const colors: ThemeColors = {
  sky: '#2D1B4E',
  skyGradientEnd: '#6B3FA0',
  ground: '#2E5E3A',
  groundFill: '#4A7C59',
  buildingFill: '#D4C5A9',
  buildingStroke: '#5C4033',
  windowFill: '#FFE4A0',
  // No clouds in isekai
};

const rng = seededRandom(13);

// Stars - fixed positions
const STAR_COUNT = 55;
const stars = Array.from({ length: STAR_COUNT }, () => ({
  x: rng() * CANVAS_WIDTH,
  y: rng() * (GROUND_Y * 0.55),
  r: 0.8 + rng() * 1.6,
  twinkle: rng() * Math.PI * 2,
  speed: 0.4 + rng() * 1.0,
}));

// Magic sparkles - drifting upward
const SPARKLE_COUNT = 14;
const sparkles = Array.from({ length: SPARKLE_COUNT }, () => ({
  x: rng() * CANVAS_WIDTH,
  yBase: GROUND_Y - 40 - rng() * 300,
  speed: 0.006 + rng() * 0.01,
  offset: rng() * Math.PI * 2,
  hue: Math.floor(rng() * 3), // 0=purple, 1=cyan, 2=gold
}));

const SPARKLE_COLORS = ['#C084FC', '#67E8F9', '#FCD34D'];

export const IsekaiTheme: BackgroundTheme = {
  world: 'isekai',
  colors,

  drawBuilding(
    ctx: CanvasRenderingContext2D,
    bx: number,
    topY: number,
    width: number,
    bottomY: number,
    wobble: number[],
    time: number,
    isFar: boolean
  ): void {
    const { buildingFill, buildingStroke, windowFill } = colors;
    const height = bottomY - topY;
    const w0 = wobble[0] ?? 0;
    const w1 = wobble[1] ?? 0;
    const w2 = wobble[2] ?? 0;
    const w3 = wobble[3] ?? 0;

    ctx.strokeStyle = buildingStroke;
    ctx.fillStyle = buildingFill;
    ctx.lineWidth = isFar ? 1.5 : 2;
    ctx.lineJoin = 'round';

    // Determine shape: narrow = tower with pointed roof, wide = castle with crenellations
    const isTower = width < 45;
    const crenelH = Math.min(12, height * 0.08);
    const crenelCount = Math.max(2, Math.floor(width / 14));
    const crenelW = width / (crenelCount * 2 - 1);

    // Main body
    const bodyTopY = isTower ? topY + height * 0.22 : topY + crenelH;

    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    ctx.bezierCurveTo(
      bx + w1, bottomY - height * 0.33,
      bx + w2, bottomY - height * 0.66,
      bx + w3, bodyTopY
    );
    ctx.lineTo(bx + width + w0, bodyTopY);
    ctx.bezierCurveTo(
      bx + width + w2, bottomY - height * 0.66,
      bx + width + w1, bottomY - height * 0.33,
      bx + width + w3, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isTower) {
      // Pointed conical/triangular roof
      ctx.beginPath();
      ctx.moveTo(bx + w3, bodyTopY);
      ctx.quadraticCurveTo(
        bx + width * 0.25 + w1, topY + height * 0.1,
        bx + width * 0.5 + w2 * 0.5,
        topY
      );
      ctx.quadraticCurveTo(
        bx + width * 0.75 + w1,
        topY + height * 0.1,
        bx + width + w0, bodyTopY
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flag on tall towers
      if (!isFar && height > 130) {
        const flagX = bx + width * 0.5 + w2 * 0.5;
        const flagY = topY;
        const wave = Math.sin(time * 2.2) * 4;
        ctx.strokeStyle = buildingStroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(flagX, flagY);
        ctx.lineTo(flagX, flagY - 18);
        ctx.stroke();
        // Pennant
        ctx.fillStyle = '#8B1A1A';
        ctx.beginPath();
        ctx.moveTo(flagX, flagY - 18);
        ctx.lineTo(flagX + 14 + wave, flagY - 13);
        ctx.lineTo(flagX, flagY - 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = buildingStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else {
      // Castle crenellations along the top
      ctx.fillStyle = buildingFill;
      ctx.strokeStyle = buildingStroke;
      ctx.lineWidth = isFar ? 1.5 : 2;
      for (let i = 0; i < crenelCount; i++) {
        const cx = bx + i * crenelW * 2;
        ctx.beginPath();
        ctx.rect(cx + w0 * 0.3, topY, crenelW, crenelH);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (isFar) return;

    // Arched windows (small, rounded top instead of rectangles)
    ctx.fillStyle = windowFill;
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1.5;
    const winRows = Math.min(Math.floor((bodyTopY - topY > 30 ? height - height * 0.25 : height * 0.6) / 22), 4);
    const winCols = Math.max(1, Math.floor(width / 16));
    for (let row = 0; row < winRows; row++) {
      for (let col = 0; col < winCols; col++) {
        const ww = Math.min(9, width / winCols - 4);
        const wh = 13;
        const wx = bx + 4 + col * (width / winCols) + (width / winCols - ww) / 2;
        const wy = bodyTopY + 8 + row * 22;
        if (wy + wh > bottomY - 5) continue;
        if (wx + ww > bx + width - 2) continue;

        // Arch shape: rect bottom + semicircle top
        const archR = ww / 2;
        const archCy = wy + archR;
        ctx.beginPath();
        ctx.arc(wx + archR, archCy, archR, Math.PI, 0);
        ctx.lineTo(wx + ww, wy + wh);
        ctx.lineTo(wx, wy + wh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  },

  drawGoalBuilding(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    topY: number,
    width: number,
    height: number,
    bottomY: number,
    wobble: number[],
    _windows: { x: number; y: number; w: number; h: number }[],
    time: number
  ): void {
    const { buildingFill, buildingStroke } = colors;
    const w0 = wobble[0] ?? 0;
    const w1 = wobble[1] ?? 0;
    const w2 = wobble[2] ?? 0;
    const w3 = wobble[3] ?? 0;
    const w4 = wobble[4] ?? 0;
    const w5 = wobble[5] ?? 0;
    const w6 = wobble[6] ?? 0;
    const w7 = wobble[7] ?? 0;

    ctx.strokeStyle = buildingStroke;
    ctx.fillStyle = buildingFill;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    // --- Two flanking towers (left and right) ---
    const towerW = width * 0.28;
    const towerH = height * 1.05; // towers taller than main wall
    const towerTopY = bottomY - towerH;

    // Left tower body
    ctx.beginPath();
    ctx.moveTo(screenX + w0, bottomY);
    ctx.bezierCurveTo(
      screenX + w1, bottomY - towerH * 0.33,
      screenX + w2, bottomY - towerH * 0.66,
      screenX + w3, towerTopY
    );
    ctx.lineTo(screenX + towerW + w0, towerTopY);
    ctx.bezierCurveTo(
      screenX + towerW + w2, bottomY - towerH * 0.66,
      screenX + towerW + w1, bottomY - towerH * 0.33,
      screenX + towerW + w3, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left tower crenellations
    const crenelCount = 3;
    const crenelW = towerW / (crenelCount * 2 - 1);
    const crenelH = 14;
    ctx.fillStyle = buildingFill;
    for (let i = 0; i < crenelCount; i++) {
      ctx.beginPath();
      ctx.rect(screenX + i * crenelW * 2, towerTopY - crenelH, crenelW, crenelH);
      ctx.fill();
      ctx.stroke();
    }

    // Right tower body
    const rtx = screenX + width - towerW;
    ctx.fillStyle = buildingFill;
    ctx.beginPath();
    ctx.moveTo(rtx + w0, bottomY);
    ctx.bezierCurveTo(
      rtx + w1, bottomY - towerH * 0.33,
      rtx + w2, bottomY - towerH * 0.66,
      rtx + w3, towerTopY
    );
    ctx.lineTo(rtx + towerW + w0, towerTopY);
    ctx.bezierCurveTo(
      rtx + towerW + w2, bottomY - towerH * 0.66,
      rtx + towerW + w1, bottomY - towerH * 0.33,
      rtx + towerW + w3, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right tower crenellations
    for (let i = 0; i < crenelCount; i++) {
      ctx.beginPath();
      ctx.rect(rtx + i * crenelW * 2, towerTopY - crenelH, crenelW, crenelH);
      ctx.fill();
      ctx.stroke();
    }

    // --- Wall connecting the two towers ---
    const wallTopY = topY + height * 0.18;
    ctx.fillStyle = buildingFill;
    ctx.beginPath();
    ctx.moveTo(screenX + towerW + w1, bottomY);
    ctx.bezierCurveTo(
      screenX + towerW + w2, bottomY - (bottomY - wallTopY) * 0.5,
      screenX + towerW + w3, wallTopY + 4,
      screenX + towerW + w4, wallTopY
    );
    ctx.bezierCurveTo(
      screenX + width * 0.5 + w5, wallTopY + w6,
      screenX + width * 0.66 + w7, wallTopY + w0,
      screenX + width - towerW + w1, wallTopY
    );
    ctx.bezierCurveTo(
      screenX + width - towerW + w3, bottomY - (bottomY - wallTopY) * 0.5,
      screenX + width - towerW + w2, bottomY - 2,
      screenX + width - towerW + w0, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wall crenellations
    const wallCrenelCount = 4;
    const wallCrenelW = (width - towerW * 2) / (wallCrenelCount * 2 - 1);
    for (let i = 0; i < wallCrenelCount; i++) {
      ctx.beginPath();
      ctx.rect(screenX + towerW + i * wallCrenelW * 2, wallTopY - crenelH, wallCrenelW, crenelH);
      ctx.fill();
      ctx.stroke();
    }

    // --- Flags on tower tops ---
    const flagPoles = [screenX + towerW * 0.5, screenX + width - towerW * 0.5];
    for (const fx of flagPoles) {
      const wave = Math.sin(time * 2.5) * 5;
      ctx.strokeStyle = buildingStroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, towerTopY - crenelH);
      ctx.lineTo(fx, towerTopY - crenelH - 30);
      ctx.stroke();
      ctx.fillStyle = '#8B1A1A';
      ctx.beginPath();
      ctx.moveTo(fx, towerTopY - crenelH - 30);
      ctx.lineTo(fx + 22 + wave, towerTopY - crenelH - 22);
      ctx.lineTo(fx, towerTopY - crenelH - 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = buildingStroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // --- Gate arch (castle portcullis) ---
    const gateW = 130;
    const gateH = 180;
    const gateX = screenX + (width - gateW) / 2;
    const gateY = bottomY - gateH;
    const archR = gateW / 2;
    const archCy = gateY + archR;

    ctx.fillStyle = '#2A1A0A';
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gateX + archR, archCy, archR, Math.PI, 0);
    ctx.lineTo(gateX + gateW, bottomY);
    ctx.lineTo(gateX, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Portcullis bars (vertical iron bars)
    const barCount = 5;
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 3;
    for (let i = 0; i < barCount; i++) {
      const bx2 = gateX + 10 + (i * (gateW - 20)) / (barCount - 1);
      ctx.beginPath();
      ctx.moveTo(bx2, archCy);
      ctx.lineTo(bx2, bottomY);
      ctx.stroke();
    }
    // Horizontal bar
    ctx.beginPath();
    ctx.moveTo(gateX + 5, gateY + gateH * 0.45);
    ctx.lineTo(gateX + gateW - 5, gateY + gateH * 0.45);
    ctx.stroke();

    // Tower arched windows
    ctx.fillStyle = '#FFE4A0';
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1.5;
    const towerWinPositions = [
      { tx: screenX, tw: towerW },
      { tx: rtx, tw: towerW },
    ];
    for (const { tx, tw } of towerWinPositions) {
      for (let row = 0; row < 3; row++) {
        const ww = 18;
        const wh = 22;
        const wx = tx + (tw - ww) / 2;
        const wy = towerTopY + 20 + row * 35;
        const ar = ww / 2;
        ctx.beginPath();
        ctx.arc(wx + ar, wy + ar, ar, Math.PI, 0);
        ctx.lineTo(wx + ww, wy + wh);
        ctx.lineTo(wx, wy + wh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Sign banner above gate
    const signW = width * 0.45;
    const signH = 44;
    const signX = screenX + (width - signW) / 2;
    const signY = wallTopY + 12;
    ctx.fillStyle = '#4A1A8B';
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(signX, signY, signW, signH);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFE4A0';
    ctx.font = 'bold 22px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('마왕성', screenX + width / 2, signY + signH / 2);
  },

  renderSky(ctx: CanvasRenderingContext2D, _time: number): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#2D1B4E');
    grad.addColorStop(0.6, '#6B3FA0');
    grad.addColorStop(1, '#8B5CC8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  },

  renderExtraBack(ctx: CanvasRenderingContext2D, time: number): void {
    // Twinkling stars
    ctx.save();
    for (const s of stars) {
      const brightness = 0.5 + Math.sin(time * s.speed + s.twinkle) * 0.5;
      ctx.globalAlpha = brightness;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crescent moon (top-right area)
    ctx.globalAlpha = 0.9;
    const mx = CANVAS_WIDTH - 60;
    const my = 60;
    const moonR = 22;
    ctx.fillStyle = '#FFFDE0';
    ctx.strokeStyle = '#D4B896';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mx, my, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Bite out to make crescent
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(mx + 12, my - 6, moonR * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
  },

  renderExtraFront(ctx: CanvasRenderingContext2D, time: number): void {
    // Floating magic sparkles drifting upward
    ctx.save();
    for (const sp of sparkles) {
      const rise = (time * sp.speed * 80) % (GROUND_Y - 20);
      const drift = Math.sin(time * sp.speed * 60 + sp.offset) * 12;
      const py = GROUND_Y - 10 - rise;
      const px = sp.x + drift;
      const alpha = 0.3 + Math.abs(Math.sin(time * sp.speed * 40 + sp.offset)) * 0.6;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = SPARKLE_COLORS[sp.hue] ?? '#C084FC';

      // Draw small 4-pointed star shape
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(time * sp.speed * 30);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const outer = 3.5;
        const inner = 1.2;
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.lineTo(Math.cos(angle + Math.PI / 4) * inner, Math.sin(angle + Math.PI / 4) * inner);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
};

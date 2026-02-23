import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from '../../utils/constants';
import { seededRandom } from '../../utils/math';
import type { BackgroundTheme, ThemeColors } from './BackgroundTheme';

const colors: ThemeColors = {
  sky: '#FFF8E7',
  ground: '#AAAAAA',
  groundFill: '#AAAAAA',
  buildingFill: '#FFF8E7',
  buildingStroke: '#111111',
  windowFill: '#F5E6C8',
  cloudFill: '#FFF0CC',
  cloudStroke: '#222222',
};

// Pre-seeded particle positions so they don't jitter each frame
const PARTICLE_COUNT = 18;
const rng = seededRandom(55);
const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
  x: rng() * CANVAS_WIDTH,
  y: rng() * (GROUND_Y - 60),
  speed: 0.008 + rng() * 0.012,
  offset: rng() * Math.PI * 2,
  size: 1.5 + rng() * 2,
}));

export const PoliticsTheme: BackgroundTheme = {
  world: 'politics',
  colors,

  drawBuilding(
    ctx: CanvasRenderingContext2D,
    bx: number,
    topY: number,
    width: number,
    bottomY: number,
    wobble: number[],
    _time: number,
    isFar: boolean
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
    const height = bottomY - topY;

    ctx.strokeStyle = buildingStroke;
    ctx.fillStyle = buildingFill;
    ctx.lineWidth = isFar ? 1.5 : 2;
    ctx.lineJoin = 'round';

    // Main building body (slightly wobbly bezier, same style as default)
    const pedimentH = Math.min(18, height * 0.12);
    const bodyTopY = topY + pedimentH;

    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    ctx.bezierCurveTo(
      bx + w1, bottomY - height * 0.33,
      bx + w2, bottomY - height * 0.66,
      bx + w3, bodyTopY
    );
    ctx.bezierCurveTo(
      bx + width * 0.33 + w4, bodyTopY + w5 * 0.5,
      bx + width * 0.66 + w6, bodyTopY + w7 * 0.5,
      bx + width + w0, bodyTopY
    );
    ctx.bezierCurveTo(
      bx + width + w2, bottomY - height * 0.66,
      bx + width + w1, bottomY - height * 0.33,
      bx + width + w3, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Triangular pediment on top (government building gable)
    ctx.beginPath();
    ctx.moveTo(bx + w0, bodyTopY);
    ctx.lineTo(bx + width / 2 + w4, topY + w5 * 0.5);
    ctx.lineTo(bx + width + w0, bodyTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (isFar) return;

    // Columns (vertical lines near base)
    const colCount = Math.max(2, Math.floor(width / 16));
    const colSpacing = width / (colCount + 1);
    const colHeight = Math.min(height * 0.3, 50);
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 2;
    for (let i = 1; i <= colCount; i++) {
      const cx = bx + colSpacing * i;
      const colTopY = bottomY - colHeight;
      ctx.beginPath();
      ctx.moveTo(cx + (wobble[i % 8] ?? 0) * 0.3, bottomY);
      ctx.quadraticCurveTo(
        cx + (wobble[(i + 1) % 8] ?? 0) * 0.4,
        colTopY + colHeight * 0.5,
        cx + (wobble[(i + 2) % 8] ?? 0) * 0.3,
        colTopY
      );
      ctx.stroke();
    }

    // Windows — wider, formal style
    ctx.fillStyle = colors.windowFill;
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1.5;
    const winRows = Math.min(Math.floor((height - colHeight - pedimentH) / 22), 4);
    const winCols = Math.max(1, Math.floor(width / 18));
    for (let row = 0; row < winRows; row++) {
      for (let col = 0; col < winCols; col++) {
        const wx = bx + 4 + col * (width / winCols) + 2;
        const wy = bodyTopY + 6 + row * 22;
        const ww = width / winCols - 8;
        const wh = 13;
        if (wx + ww > bx + width - 2) continue;
        ctx.beginPath();
        ctx.rect(wx + (wobble[col % 8] ?? 0) * 0.5, wy, ww, wh);
        ctx.fill();
        ctx.stroke();
      }
    }
  },

  renderSky(ctx: CanvasRenderingContext2D, _time: number): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#FFF8E7');
    grad.addColorStop(1, '#FFF3D0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  },

  renderExtraFront(ctx: CanvasRenderingContext2D, time: number): void {
    // Gentle gold dust particles drifting upward
    ctx.save();
    for (const p of particles) {
      const drift = Math.sin(time * p.speed * 60 + p.offset) * 8;
      const rise = ((time * p.speed * 40) % (GROUND_Y - 40));
      const py = GROUND_Y - 20 - rise;
      const px = p.x + drift;

      const alpha = 0.15 + Math.abs(Math.sin(time * p.speed * 60 + p.offset)) * 0.35;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#D4A017';
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },
};

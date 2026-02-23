import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from '../../utils/constants';
import { seededRandom } from '../../utils/math';
import type { BackgroundTheme, ThemeColors } from './BackgroundTheme';

export type SpacePlanet = 'moon' | 'mars' | 'venus' | 'jupiter' | 'uranus';

// ─── Shared star field ───────────────────────────────────────────────────────

const rng0 = seededRandom(31);
const STAR_COUNT = 70;
const STARS = Array.from({ length: STAR_COUNT }, () => ({
  x: rng0() * CANVAS_WIDTH,
  y: rng0() * (GROUND_Y * 0.7),
  r: 0.7 + rng0() * 1.4,
  twinkle: rng0() * Math.PI * 2,
  speed: 0.3 + rng0() * 0.9,
}));

function drawStarField(ctx: CanvasRenderingContext2D, time: number, alpha = 1): void {
  ctx.save();
  for (const s of STARS) {
    const brightness = 0.4 + Math.sin(time * s.speed + s.twinkle) * 0.6;
    ctx.globalAlpha = brightness * alpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ─── Shared rock/terrain building drawer ─────────────────────────────────────
// Used by all space sub-themes. Fill/stroke colors come from the caller.

function drawRockBuilding(
  ctx: CanvasRenderingContext2D,
  bx: number,
  topY: number,
  width: number,
  bottomY: number,
  wobble: number[],
  fillColor: string,
  strokeColor: string,
  isFar: boolean,
  style: 'mesa' | 'spike' | 'crater' | 'pillar' | 'ice'
): void {
  const w0 = wobble[0] ?? 0;
  const w1 = wobble[1] ?? 0;
  const w2 = wobble[2] ?? 0;
  const w3 = wobble[3] ?? 0;
  const w4 = wobble[4] ?? 0;
  const w5 = wobble[5] ?? 0;

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = isFar ? 1.5 : 2;
  ctx.lineJoin = 'round';

  if (style === 'spike') {
    // Narrow spike / column: jagged angular top
    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    ctx.lineTo(bx + w1 * 0.5, topY + (bottomY - topY) * 0.4);
    ctx.lineTo(bx + width * 0.35 + w2, topY + 6);
    ctx.lineTo(bx + width * 0.5 + w3, topY);
    ctx.lineTo(bx + width * 0.65 + w4, topY + 8);
    ctx.lineTo(bx + width + w1 * 0.5, topY + (bottomY - topY) * 0.4);
    ctx.lineTo(bx + width + w0, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'mesa') {
    // Wide flat-topped mesa with ragged sides
    const flatTop = topY + Math.abs(w5) * 2;
    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    ctx.quadraticCurveTo(bx + w1, bottomY - (bottomY - flatTop) * 0.5, bx + w2, flatTop);
    // Slightly jagged flat top
    ctx.lineTo(bx + width * 0.3 + w3, flatTop + Math.abs(w4) * 0.8);
    ctx.lineTo(bx + width * 0.6 + w5, flatTop - Math.abs(w3) * 0.6);
    ctx.lineTo(bx + width + w0, flatTop);
    ctx.quadraticCurveTo(bx + width + w1, bottomY - (bottomY - flatTop) * 0.5, bx + width + w2, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'crater') {
    // Moon crater rim: wide, low, curved rim shape
    const rimY = topY + (bottomY - topY) * 0.25;
    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    ctx.bezierCurveTo(
      bx + w1, bottomY - (bottomY - rimY) * 0.4,
      bx + w2, rimY + 4,
      bx + width * 0.2 + w3, rimY
    );
    ctx.quadraticCurveTo(bx + width * 0.5 + w4, rimY + w5 * 0.5, bx + width * 0.8 + w3, rimY);
    ctx.bezierCurveTo(
      bx + width + w2, rimY + 4,
      bx + width + w1, bottomY - (bottomY - rimY) * 0.4,
      bx + width + w0, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'pillar') {
    // Tall narrow pillar (Mars rock pillar)
    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    ctx.bezierCurveTo(
      bx + w1, bottomY - (bottomY - topY) * 0.33,
      bx + w2, bottomY - (bottomY - topY) * 0.66,
      bx + w3, topY
    );
    // Angular top cap
    ctx.lineTo(bx + width * 0.4 + w4, topY - 5);
    ctx.lineTo(bx + width * 0.6 + w5, topY - 3);
    ctx.lineTo(bx + width + w0, topY);
    ctx.bezierCurveTo(
      bx + width + w2, bottomY - (bottomY - topY) * 0.66,
      bx + width + w1, bottomY - (bottomY - topY) * 0.33,
      bx + width + w3, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // ice: tall, slightly translucent spike with flat faces
    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    ctx.lineTo(bx + w1, topY + (bottomY - topY) * 0.5);
    ctx.lineTo(bx + width * 0.2 + w2, topY + 4);
    ctx.lineTo(bx + width * 0.5 + w3, topY);
    ctx.lineTo(bx + width * 0.8 + w4, topY + 4);
    ctx.lineTo(bx + width + w1, topY + (bottomY - topY) * 0.5);
    ctx.lineTo(bx + width + w0, bottomY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

// ─── Shared space goal building: base/station entrance ───────────────────────

function drawSpaceGoalBuilding(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  topY: number,
  width: number,
  height: number,
  bottomY: number,
  wobble: number[],
  _windows: { x: number; y: number; w: number; h: number }[],
  time: number,
  fillColor: string,
  strokeColor: string,
  accentColor: string,
  label: string
): void {
  const w0 = wobble[0] ?? 0;
  const w1 = wobble[1] ?? 0;
  const w2 = wobble[2] ?? 0;
  const w3 = wobble[3] ?? 0;
  const w4 = wobble[4] ?? 0;
  const w5 = wobble[5] ?? 0;
  const w6 = wobble[6] ?? 0;
  const w7 = wobble[7] ?? 0;

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  // Dome cap on top (~25% of height)
  const domeH = height * 0.22;
  const bodyTopY = topY + domeH;

  // Main body (rectangular, wobbly)
  ctx.beginPath();
  ctx.moveTo(screenX + w0, bottomY);
  ctx.bezierCurveTo(
    screenX + w1, bottomY - height * 0.33,
    screenX + w2, bottomY - height * 0.66,
    screenX + w3, bodyTopY
  );
  ctx.bezierCurveTo(
    screenX + width * 0.33 + w4, bodyTopY + w5,
    screenX + width * 0.66 + w6, bodyTopY + w7,
    screenX + width + w0, bodyTopY
  );
  ctx.bezierCurveTo(
    screenX + width + w2, bottomY - height * 0.66,
    screenX + width + w1, bottomY - height * 0.33,
    screenX + width + w3, bottomY
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dome (ellipse arc on top)
  ctx.beginPath();
  ctx.ellipse(
    screenX + width / 2 + w4 * 0.5,
    bodyTopY,
    (width / 2) + Math.abs(w1),
    domeH + Math.abs(w2),
    0, Math.PI, 0
  );
  ctx.lineTo(screenX + width + w0, bodyTopY);
  ctx.lineTo(screenX + w0, bodyTopY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Antenna / comm dish on dome apex
  const antX = screenX + width / 2;
  const antBaseY = bodyTopY - domeH;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(antX, antBaseY);
  ctx.lineTo(antX + Math.sin(time * 0.5) * 3, antBaseY - 22);
  ctx.stroke();
  // Dish
  ctx.beginPath();
  ctx.arc(antX + Math.sin(time * 0.5) * 3, antBaseY - 22, 8, Math.PI * 0.3, Math.PI * 0.7, false);
  ctx.stroke();

  // Horizontal stripe panels (tech look)
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= 4; i++) {
    const py = bodyTopY + (height - domeH) * (i / 5);
    ctx.beginPath();
    ctx.moveTo(screenX + 8 + w0 * 0.2, py);
    ctx.lineTo(screenX + width - 8 + w1 * 0.2, py + w2 * 0.3);
    ctx.stroke();
  }

  // Circular porthole windows
  ctx.fillStyle = accentColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  const portRows = 3;
  const portCols = 2;
  const portR = 14;
  const colStep = width / (portCols + 1);
  const rowStep = (height * 0.55) / (portRows + 1);
  for (let row = 0; row < portRows; row++) {
    for (let col = 0; col < portCols; col++) {
      const px = screenX + colStep * (col + 1);
      const py = bodyTopY + rowStep * (row + 1);
      ctx.beginPath();
      ctx.arc(px + w3 * 0.3, py + w4 * 0.3, portR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Inner reflection
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(px + w3 * 0.3 - 4, py + w4 * 0.3 - 4, portR * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accentColor;
    }
  }

  // Airlock door (center bottom)
  const doorW = 100;
  const doorH = 150;
  const doorX = screenX + (width - doorW) / 2;
  const doorY = bottomY - doorH;
  ctx.fillStyle = strokeColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  // Door frame (rounded)
  ctx.beginPath();
  ctx.roundRect(doorX, doorY, doorW, doorH, 12);
  ctx.fill();
  ctx.stroke();
  // Airlock inner panel
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.roundRect(doorX + 8, doorY + 10, doorW - 16, doorH - 18, 8);
  ctx.fill();
  ctx.stroke();
  // Door handle / wheel
  ctx.fillStyle = '#FFD700';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(doorX + doorW / 2, doorY + doorH * 0.55, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Label sign
  const signW = width - 40;
  const signH = 44;
  const signX = screenX + 20;
  const signY = bodyTopY + 14;
  ctx.fillStyle = strokeColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(signX, signY, signW, signH);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 20px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, screenX + width / 2, signY + signH / 2);
}

// ─── Moon ────────────────────────────────────────────────────────────────────

const rngMoon = seededRandom(17);
const CRATERS = Array.from({ length: 12 }, () => ({
  x: rngMoon() * CANVAS_WIDTH,
  r: 4 + rngMoon() * 14,
}));

const moonColors: ThemeColors = {
  sky: '#0A0A1A',
  ground: '#C0C0C0',
  groundFill: '#A0A0A0',
  buildingFill: '#B8B8B8',
  buildingStroke: '#555555',
  windowFill: '#E8E8E8',
};

function makeMoonTheme(): BackgroundTheme {
  return {
    world: 'space',
    subTheme: 'moon',
    colors: moonColors,

    renderSky(ctx, time) {
      ctx.fillStyle = '#0A0A1A';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawStarField(ctx, time);

      // Earth in sky (blue marble)
      ctx.save();
      const ex = 60, ey = 90, er = 38;
      const earthGrad = ctx.createRadialGradient(ex - 10, ey - 10, 4, ex, ey, er);
      earthGrad.addColorStop(0, '#4A9EE0');
      earthGrad.addColorStop(0.5, '#1E6CB5');
      earthGrad.addColorStop(1, '#0A3A6B');
      ctx.fillStyle = earthGrad;
      ctx.strokeStyle = '#2266AA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Simple continent blobs
      ctx.fillStyle = 'rgba(80,160,60,0.7)';
      ctx.beginPath(); ctx.ellipse(ex - 8, ey - 5, 12, 8, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(ex + 14, ey + 8, 8, 12, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },

    renderExtraFront(ctx, _time) {
      // Craters on ground surface
      ctx.save();
      for (const c of CRATERS) {
        ctx.strokeStyle = 'rgba(80,80,80,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x, GROUND_Y + 10, c.r, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(60,60,60,0.2)';
        ctx.fill();
      }
      ctx.restore();
    },

    drawBuilding(ctx, bx, topY, width, bottomY, wobble, _time, isFar) {
      // Moon: crater rim shapes (wide, low arcs) or small rocky mounds
      const style = width < 40 ? 'mesa' : 'crater';
      drawRockBuilding(
        ctx, bx, topY, width, bottomY, wobble,
        moonColors.buildingFill, moonColors.buildingStroke,
        isFar, style
      );
    },

    drawGoalBuilding(ctx, screenX, topY, width, height, bottomY, wobble, windows, time) {
      drawSpaceGoalBuilding(
        ctx, screenX, topY, width, height, bottomY, wobble, windows, time,
        '#B8B8B8', '#555555', '#E0F8FF', 'BASE'
      );
    },
  };
}

// ─── Mars ────────────────────────────────────────────────────────────────────

const rngMars = seededRandom(23);
const DUST_PARTICLES = Array.from({ length: 22 }, () => ({
  x: rngMars() * CANVAS_WIDTH,
  yBase: GROUND_Y - 10 - rngMars() * 80,
  speed: 0.005 + rngMars() * 0.012,
  offset: rngMars() * Math.PI * 2,
  size: 1.5 + rngMars() * 3,
}));

const marsColors: ThemeColors = {
  sky: '#1A0505',
  skyGradientEnd: '#3D1010',
  ground: '#C4622D',
  groundFill: '#A0461C',
  buildingFill: '#8B4513',
  buildingStroke: '#3D1A0A',
  windowFill: '#D4845A',
};

function makeMarsTheme(): BackgroundTheme {
  return {
    world: 'space',
    subTheme: 'mars',
    colors: marsColors,

    renderSky(ctx, time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#1A0505');
      grad.addColorStop(0.5, '#3D1010');
      grad.addColorStop(1, '#6B2810');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Faint stars (dim through dust)
      drawStarField(ctx, time, 0.25);
    },

    renderExtraFront(ctx, time) {
      // Red dust particles swirling near ground
      ctx.save();
      for (const p of DUST_PARTICLES) {
        const drift = Math.sin(time * p.speed * 60 + p.offset) * 20;
        const rise = (time * p.speed * 25) % 100;
        const py = p.yBase - rise;
        const px = p.x + drift;
        const alpha = 0.15 + Math.abs(Math.sin(time * p.speed * 40)) * 0.3;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#C4622D';
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },

    drawBuilding(ctx, bx, topY, width, bottomY, wobble, _time, isFar) {
      // Mars: rusty orange rock pillars and spikes
      const style = width < 45 ? 'spike' : 'pillar';
      drawRockBuilding(
        ctx, bx, topY, width, bottomY, wobble,
        marsColors.buildingFill, marsColors.buildingStroke,
        isFar, style
      );
    },

    drawGoalBuilding(ctx, screenX, topY, width, height, bottomY, wobble, windows, time) {
      drawSpaceGoalBuilding(
        ctx, screenX, topY, width, height, bottomY, wobble, windows, time,
        '#8B4513', '#3D1A0A', '#D4845A', 'BASE'
      );
    },
  };
}

// ─── Venus ───────────────────────────────────────────────────────────────────

const rngVenus = seededRandom(37);
const CLOUD_BANDS = Array.from({ length: 5 }, (_, i) => ({
  y: 30 + i * 55,
  thickness: 18 + rngVenus() * 18,
  offset: rngVenus() * Math.PI * 2,
  speed: 0.003 + rngVenus() * 0.005,
}));

const venusColors: ThemeColors = {
  sky: '#2A2A00',
  skyGradientEnd: '#5A4A00',
  ground: '#C4A035',
  groundFill: '#A08020',
  buildingFill: '#8B7020',
  buildingStroke: '#3A2800',
  windowFill: '#FFD060',
};

function makeVenusTheme(): BackgroundTheme {
  return {
    world: 'space',
    subTheme: 'venus',
    colors: venusColors,

    renderSky(ctx, _time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#2A2A00');
      grad.addColorStop(0.4, '#5A4A00');
      grad.addColorStop(1, '#8A6800');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    renderExtraBack(ctx, time) {
      // Thick cloud bands drifting slowly across sky
      ctx.save();
      for (const band of CLOUD_BANDS) {
        const drift = Math.sin(time * band.speed * 60 + band.offset) * 6;
        ctx.fillStyle = `rgba(200,180,60,0.18)`;
        ctx.beginPath();
        ctx.rect(0, band.y + drift, CANVAS_WIDTH, band.thickness);
        ctx.fill();
      }
      // Volcanic glow near horizon
      const glow = ctx.createLinearGradient(0, GROUND_Y - 120, 0, GROUND_Y);
      glow.addColorStop(0, 'rgba(255,80,0,0)');
      glow.addColorStop(1, 'rgba(255,80,0,0.22)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, GROUND_Y - 120, CANVAS_WIDTH, 120);
      ctx.restore();
    },

    drawBuilding(ctx, bx, topY, width, bottomY, wobble, _time, isFar) {
      // Venus: volcanic mesa formations
      drawRockBuilding(
        ctx, bx, topY, width, bottomY, wobble,
        venusColors.buildingFill, venusColors.buildingStroke,
        isFar, 'mesa'
      );
    },

    drawGoalBuilding(ctx, screenX, topY, width, height, bottomY, wobble, windows, time) {
      drawSpaceGoalBuilding(
        ctx, screenX, topY, width, height, bottomY, wobble, windows, time,
        '#8B7020', '#3A2800', '#FFD060', 'BASE'
      );
    },
  };
}

// ─── Jupiter ─────────────────────────────────────────────────────────────────

const rngJup = seededRandom(41);
const GAS_BANDS = Array.from({ length: 7 }, (_, i) => ({
  y: 20 + i * 65,
  height: 28 + rngJup() * 20,
  colorA: i % 2 === 0 ? 'rgba(180,100,30,0.14)' : 'rgba(220,150,60,0.10)',
  offset: rngJup() * Math.PI * 2,
  speed: 0.002 + rngJup() * 0.004,
}));
const FLOATING_ROCKS = Array.from({ length: 6 }, () => ({
  x: rngJup() * CANVAS_WIDTH,
  y: 80 + rngJup() * 200,
  w: 12 + rngJup() * 28,
  h: 7 + rngJup() * 14,
  offset: rngJup() * Math.PI * 2,
  speed: 0.004 + rngJup() * 0.008,
}));

const jupiterColors: ThemeColors = {
  sky: '#1A0F00',
  skyGradientEnd: '#3D2500',
  ground: '#8B6914',
  groundFill: '#6B4914',
  buildingFill: '#7A5A18',
  buildingStroke: '#2A1800',
  windowFill: '#D4A040',
};

function makeJupiterTheme(): BackgroundTheme {
  return {
    world: 'space',
    subTheme: 'jupiter',
    colors: jupiterColors,

    renderSky(ctx, time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#1A0F00');
      grad.addColorStop(1, '#3D2500');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawStarField(ctx, time, 0.5);

      // Gas giant bands in sky
      ctx.save();
      for (const band of GAS_BANDS) {
        const wave = Math.sin(time * band.speed * 40 + band.offset) * 5;
        ctx.fillStyle = band.colorA;
        ctx.beginPath();
        ctx.rect(0, band.y + wave, CANVAS_WIDTH, band.height);
        ctx.fill();
      }
      ctx.restore();
    },

    renderExtraBack(ctx, time) {
      // Floating rock formations drifting in the haze
      ctx.save();
      for (const rock of FLOATING_ROCKS) {
        const bob = Math.sin(time * rock.speed * 50 + rock.offset) * 6;
        const rx = rock.x;
        const ry = rock.y + bob;

        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#5A3A10';
        ctx.strokeStyle = '#2A1800';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rock.w / 2, rock.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    },

    drawBuilding(ctx, bx, topY, width, bottomY, wobble, _time, isFar) {
      // Jupiter moon: mixed pillars and mesas
      const style = width < 50 ? 'pillar' : 'mesa';
      drawRockBuilding(
        ctx, bx, topY, width, bottomY, wobble,
        jupiterColors.buildingFill, jupiterColors.buildingStroke,
        isFar, style
      );
    },

    drawGoalBuilding(ctx, screenX, topY, width, height, bottomY, wobble, windows, time) {
      drawSpaceGoalBuilding(
        ctx, screenX, topY, width, height, bottomY, wobble, windows, time,
        '#7A5A18', '#2A1800', '#D4A040', 'BASE'
      );
    },
  };
}

// ─── Uranus ──────────────────────────────────────────────────────────────────

const rngUr = seededRandom(53);
const ICE_CRYSTALS = Array.from({ length: 14 }, () => ({
  x: rngUr() * CANVAS_WIDTH,
  yBase: GROUND_Y + 4,
  h: 10 + rngUr() * 22,
  w: 3 + rngUr() * 5,
  offset: rngUr() * Math.PI * 2,
}));
const AURORA_LAYERS = Array.from({ length: 3 }, (_, i) => ({
  color: ['rgba(100,220,255,0.12)', 'rgba(60,180,255,0.10)', 'rgba(140,100,255,0.08)'][i] ?? 'rgba(100,220,255,0.12)',
  yOffset: 60 + i * 40,
  waveOffset: (i * Math.PI * 2) / 3,
}));

const uranusColors: ThemeColors = {
  sky: '#050520',
  skyGradientEnd: '#0A2040',
  ground: '#7FDBFF',
  groundFill: '#5FBBDF',
  buildingFill: '#A0E8FF',
  buildingStroke: '#2060AA',
  windowFill: '#E0F8FF',
};

function makeUranusTheme(): BackgroundTheme {
  return {
    world: 'space',
    subTheme: 'uranus',
    colors: uranusColors,

    renderSky(ctx, time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#050520');
      grad.addColorStop(0.5, '#0A2040');
      grad.addColorStop(1, '#0E3060');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      drawStarField(ctx, time);
    },

    renderExtraBack(ctx, time) {
      ctx.save();

      // Aurora curtains
      for (const layer of AURORA_LAYERS) {
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(0, layer.yOffset);
        for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
          const wave = Math.sin(x * 0.015 + time * 0.4 + layer.waveOffset) * 30;
          ctx.lineTo(x, layer.yOffset + wave);
        }
        ctx.lineTo(CANVAS_WIDTH, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
      }

      // Ring arcs in upper sky
      ctx.strokeStyle = 'rgba(150,220,255,0.35)';
      ctx.lineWidth = 2;
      const cx = CANVAS_WIDTH * 0.65;
      const cy = -20;
      for (let r = 80; r <= 140; r += 18) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0.25 * Math.PI, 0.75 * Math.PI);
        ctx.stroke();
      }

      ctx.restore();
    },

    renderExtraFront(ctx, time) {
      // Ice crystal spikes along the ground
      ctx.save();
      for (const c of ICE_CRYSTALS) {
        const shimmer = 0.6 + Math.sin(time * 1.2 + c.offset) * 0.4;
        ctx.globalAlpha = shimmer * 0.75;
        ctx.fillStyle = '#C8F0FF';
        ctx.strokeStyle = '#5FBBDF';
        ctx.lineWidth = 1;
        const cx = c.x;
        const baseY = c.yBase;
        // Draw ice spike as a narrow triangle
        ctx.beginPath();
        ctx.moveTo(cx - c.w / 2, baseY);
        ctx.lineTo(cx, baseY - c.h);
        ctx.lineTo(cx + c.w / 2, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    },

    drawBuilding(ctx, bx, topY, width, bottomY, wobble, _time, isFar) {
      // Uranus: ice formation spikes
      drawRockBuilding(
        ctx, bx, topY, width, bottomY, wobble,
        uranusColors.buildingFill, uranusColors.buildingStroke,
        isFar, 'ice'
      );
    },

    drawGoalBuilding(ctx, screenX, topY, width, height, bottomY, wobble, windows, time) {
      drawSpaceGoalBuilding(
        ctx, screenX, topY, width, height, bottomY, wobble, windows, time,
        '#A0E8FF', '#2060AA', '#E0F8FF', 'BASE'
      );
    },
  };
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function makeSpaceTheme(planet: SpacePlanet): BackgroundTheme {
  switch (planet) {
    case 'moon':    return makeMoonTheme();
    case 'mars':    return makeMarsTheme();
    case 'venus':   return makeVenusTheme();
    case 'jupiter': return makeJupiterTheme();
    case 'uranus':  return makeUranusTheme();
  }
}

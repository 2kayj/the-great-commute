import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from '../../utils/constants';
import { seededRandom } from '../../utils/math';
import type { BackgroundTheme, ThemeColors } from './BackgroundTheme';

// ─── Particle data (generated once, shared across rank themes) ────────────────

// Clouds for sinip (맑은 아침) and daeri (흐린 날)
const rngCloud = seededRandom(71);
const CLOUDS = Array.from({ length: 6 }, () => ({
  x: rngCloud() * CANVAS_WIDTH,
  y: 40 + rngCloud() * 120,
  rx: 30 + rngCloud() * 40,
  ry: 14 + rngCloud() * 12,
  offset: rngCloud() * Math.PI * 2,
  speed: 0.003 + rngCloud() * 0.004,
}));

// Rain drops for timjang (비 오는 날)
const rngRain = seededRandom(73);
const RAIN_DROPS = Array.from({ length: 28 }, () => ({
  x: rngRain() * CANVAS_WIDTH,
  yOffset: rngRain() * CANVAS_HEIGHT,
  speed: 220 + rngRain() * 120,
  len: 10 + rngRain() * 8,
}));

// Snow flakes for bujang (눈 오는 날)
const rngSnow = seededRandom(79);
const SNOW_FLAKES = Array.from({ length: 18 }, () => ({
  x: rngSnow() * CANVAS_WIDTH,
  yOffset: rngSnow() * CANVAS_HEIGHT,
  r: 2 + rngSnow() * 2.5,
  speed: 50 + rngSnow() * 40,
  sway: rngSnow() * Math.PI * 2,
  swayAmp: 12 + rngSnow() * 14,
}));

// Stars for sajang (야경)
const rngStar = seededRandom(83);
const NIGHT_STARS = Array.from({ length: 45 }, () => ({
  x: rngStar() * CANVAS_WIDTH,
  y: rngStar() * (GROUND_Y * 0.65),
  r: 0.6 + rngStar() * 1.2,
  twinkle: rngStar() * Math.PI * 2,
  speed: 0.4 + rngStar() * 0.8,
}));

// ─── Helper: draw cloud ellipses ─────────────────────────────────────────────

function drawClouds(
  ctx: CanvasRenderingContext2D,
  time: number,
  fillColor: string,
  strokeColor: string,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const c of CLOUDS) {
    const dx = Math.sin(time * c.speed * 30 + c.offset) * 6;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(c.x + dx, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Second smaller blob for puffiness
    ctx.beginPath();
    ctx.ellipse(c.x + dx + c.rx * 0.4, c.y - c.ry * 0.4, c.rx * 0.6, c.ry * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// ─── sinip: 기본 (색깔 없는 흰 배경) ────────────────────────────────────────

const sinipColors: ThemeColors = {
  sky: '#FFFFFF',
  ground: '#888888',
  groundFill: '#999999',
  buildingFill: '#FFFFFF',
  buildingStroke: '#222222',
  windowFill: '#F8F8F8',
  cloudFill: '#FFFFFF',
  cloudStroke: '#222222',
};

function makeSinipTheme(): BackgroundTheme {
  return {
    world: 'company',
    subTheme: 'sinip',
    colors: sinipColors,

    renderSky(ctx, _time) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },
  };
}

// ─── daeri: 흐린 날 ──────────────────────────────────────────────────────────

const daeriColors: ThemeColors = {
  sky: '#B0B8C8',
  ground: '#888888',
  groundFill: '#999999',
  buildingFill: '#EFEFEF',
  buildingStroke: '#333333',
  windowFill: '#E0E0E0',
  cloudFill: '#C8CDD8',
  cloudStroke: '#888888',
};

function makeDaeriTheme(): BackgroundTheme {
  return {
    world: 'company',
    subTheme: 'daeri',
    colors: daeriColors,

    renderSky(ctx, _time) {
      ctx.fillStyle = '#B0B8C8';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    renderExtraBack(ctx, time) {
      // Dense overlapping clouds — draw twice for heavier look
      drawClouds(ctx, time, '#C8CDD8', '#888888', 0.9);
      drawClouds(ctx, time * 0.7, '#B8BDCC', '#777777', 0.5);
    },
  };
}

// ─── gwajang: 석양 ───────────────────────────────────────────────────────────

const gwajangColors: ThemeColors = {
  sky: '#FF9966',
  skyGradientEnd: '#FF5E62',
  ground: '#888888',
  groundFill: '#999999',
  buildingFill: '#FFD8B0',
  buildingStroke: '#993300',
  windowFill: '#FFEECC',
  cloudFill: '#FFCC99',
  cloudStroke: '#CC4400',
};

function makeGwajangTheme(): BackgroundTheme {
  return {
    world: 'company',
    subTheme: 'gwajang',
    colors: gwajangColors,

    renderSky(ctx, _time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#FF9966');
      grad.addColorStop(0.5, '#FF5E62');
      grad.addColorStop(1, '#FFAA44');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    renderExtraBack(ctx, time) {
      // Warm-tinted sunset clouds
      drawClouds(ctx, time, '#FFCC99', '#CC4400', 0.75);
    },
  };
}

// ─── timjang: 비 오는 날 ─────────────────────────────────────────────────────

const timjangColors: ThemeColors = {
  sky: '#5B6B7A',
  ground: '#666666',
  groundFill: '#777777',
  buildingFill: '#C8D0D8',
  buildingStroke: '#333333',
  windowFill: '#D8E0E8',
  cloudFill: '#7A8899',
  cloudStroke: '#445566',
};

function makeTimjangTheme(): BackgroundTheme {
  return {
    world: 'company',
    subTheme: 'timjang',
    colors: timjangColors,

    renderSky(ctx, _time) {
      ctx.fillStyle = '#5B6B7A';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    renderExtraBack(ctx, time) {
      // Heavy dark clouds
      drawClouds(ctx, time, '#7A8899', '#445566', 0.85);
    },

    renderExtraFront(ctx, time) {
      // Rain streaks falling
      ctx.save();
      ctx.strokeStyle = 'rgba(160,190,220,0.55)';
      ctx.lineWidth = 1;
      for (const drop of RAIN_DROPS) {
        const y = ((time * drop.speed + drop.yOffset) % (CANVAS_HEIGHT + drop.len)) - drop.len;
        ctx.beginPath();
        ctx.moveTo(drop.x, y);
        ctx.lineTo(drop.x - 2, y + drop.len);
        ctx.stroke();
      }
      ctx.restore();
    },
  };
}

// ─── bujang: 눈 오는 날 ──────────────────────────────────────────────────────

const bujangColors: ThemeColors = {
  sky: '#C8D6E0',
  ground: '#AABBCC',
  groundFill: '#BBCCDD',
  buildingFill: '#F0F4F8',
  buildingStroke: '#445566',
  windowFill: '#E8F0F8',
  cloudFill: '#E0E8F0',
  cloudStroke: '#8899AA',
};

function makeBujangTheme(): BackgroundTheme {
  return {
    world: 'company',
    subTheme: 'bujang',
    colors: bujangColors,

    renderSky(ctx, _time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#C8D6E0');
      grad.addColorStop(1, '#E0EAF0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    renderExtraBack(ctx, time) {
      // Light fluffy clouds
      drawClouds(ctx, time, '#E0E8F0', '#8899AA', 0.7);
    },

    renderExtraFront(ctx, time) {
      // Snowflakes drifting down with a gentle sway
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const flake of SNOW_FLAKES) {
        const y = ((time * flake.speed + flake.yOffset) % (CANVAS_HEIGHT + 10)) - 10;
        const x = flake.x + Math.sin(time * 0.6 + flake.sway) * flake.swayAmp;
        ctx.beginPath();
        ctx.arc(x, y, flake.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}

// ─── sangmu: 새벽 안개 ───────────────────────────────────────────────────────

const sangmuColors: ThemeColors = {
  sky: '#D4C5A9',
  skyGradientEnd: '#8FA4B8',
  ground: '#7A8A9A',
  groundFill: '#8A9AAA',
  buildingFill: '#C8CCB8',
  buildingStroke: '#445544',
  windowFill: '#D8E0D0',
  cloudFill: '#E0DDD0',
  cloudStroke: '#888877',
};

function makeSangmuTheme(): BackgroundTheme {
  return {
    world: 'company',
    subTheme: 'sangmu',
    colors: sangmuColors,

    renderSky(ctx, _time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#D4C5A9');
      grad.addColorStop(1, '#8FA4B8');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    renderExtraBack(ctx, time) {
      // Faint clouds in the dawn haze
      drawClouds(ctx, time, '#E0DDD0', '#888877', 0.5);
    },

    renderExtraFront(ctx, time) {
      // Fog layer: two overlapping semi-transparent gradients that pulse gently
      ctx.save();
      const fogTop = GROUND_Y * 0.5;
      const pulse = Math.sin(time * 0.25) * 0.04;

      const fog1 = ctx.createLinearGradient(0, fogTop, 0, CANVAS_HEIGHT);
      fog1.addColorStop(0, 'rgba(255,252,245,0)');
      fog1.addColorStop(1, `rgba(255,252,245,${0.55 + pulse})`);
      ctx.fillStyle = fog1;
      ctx.fillRect(0, fogTop, CANVAS_WIDTH, CANVAS_HEIGHT - fogTop);

      const fog2 = ctx.createLinearGradient(0, GROUND_Y * 0.72, 0, CANVAS_HEIGHT);
      fog2.addColorStop(0, 'rgba(220,228,235,0)');
      fog2.addColorStop(1, `rgba(220,228,235,${0.35 + pulse})`);
      ctx.fillStyle = fog2;
      ctx.fillRect(0, GROUND_Y * 0.72, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y * 0.72);

      ctx.restore();
    },
  };
}

// ─── sajang: 야경 (밤) ───────────────────────────────────────────────────────

const sajangColors: ThemeColors = {
  sky: '#1A1A2E',
  skyGradientEnd: '#16213E',
  ground: '#1A1A2E',
  groundFill: '#16213E',
  buildingFill: '#2A2A4A',
  buildingStroke: '#8888CC',
  windowFill: '#FFE066',
  cloudFill: '#2A2A4A',
  cloudStroke: '#5555AA',
};

function makeSajangTheme(): BackgroundTheme {
  return {
    world: 'company',
    subTheme: 'sajang',
    colors: sajangColors,

    renderSky(ctx, _time) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#1A1A2E');
      grad.addColorStop(1, '#16213E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    renderExtraBack(ctx, time) {
      // Twinkling stars
      ctx.save();
      for (const s of NIGHT_STARS) {
        const brightness = 0.35 + Math.sin(time * s.speed + s.twinkle) * 0.65;
        ctx.globalAlpha = Math.max(0, brightness);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}

// ─── Rank → theme ID map ─────────────────────────────────────────────────────

export type CompanyRankId = 'sinip' | 'daeri' | 'gwajang' | 'timjang' | 'bujang' | 'sangmu' | 'sajang';

// Cache so we don't re-create theme objects every frame
const companyThemeCache = new Map<CompanyRankId, BackgroundTheme>();

export function makeCompanyTheme(rankId: string): BackgroundTheme {
  const id = rankId as CompanyRankId;

  const cached = companyThemeCache.get(id);
  if (cached) return cached;

  let theme: BackgroundTheme;
  switch (id) {
    case 'sinip':   theme = makeSinipTheme();   break;
    case 'daeri':   theme = makeDaeriTheme();   break;
    case 'gwajang': theme = makeGwajangTheme(); break;
    case 'timjang': theme = makeTimjangTheme(); break;
    case 'bujang':  theme = makeBujangTheme();  break;
    case 'sangmu':  theme = makeSangmuTheme();  break;
    case 'sajang':  theme = makeSajangTheme();  break;
    default:        theme = makeSinipTheme();   break;
  }

  companyThemeCache.set(id, theme);
  return theme;
}

// Legacy export: 기존 CompanyTheme 이름을 사용하는 코드가 있다면 sinip 테마로 폴백
export const CompanyTheme: BackgroundTheme = makeSinipTheme();

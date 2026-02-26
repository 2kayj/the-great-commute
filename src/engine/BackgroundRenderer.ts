import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GROUND_Y } from '../utils/constants';
import { seededRandom, wobbleOffset } from '../utils/math';
import type { BuildingData, CloudData } from '../types/game.types';
import type { BackgroundTheme } from './themes/BackgroundTheme';
import { CompanyTheme } from './themes/CompanyTheme';

const NEAR_BUILDING_SPEED = 1.0;
const FAR_BUILDING_SPEED = 0.35;
const CLOUD_BASE_SPEED = 0.08;

// Goal building constants
const GOAL_BUILDING_WIDTH  = 400;
const GOAL_BUILDING_HEIGHT = 1120;
const GOAL_BUILDING_REST_X = CANVAS_WIDTH - 480; // resting screen X when arrived

interface GoalBuildingData {
  wobble: number[];
  windows: { x: number; y: number; w: number; h: number }[];
}

export class BackgroundRenderer {
  private nearBuildings: BuildingData[] = [];
  private farBuildings: BuildingData[] = [];
  private clouds: CloudData[] = [];

  private nearScrollX: number = 0;
  private farScrollX: number = 0;
  private time: number = 0;

  // Goal building state
  private goalBuilding: GoalBuildingData | null = null;
  private enteringProgress: number = 0; // 0 = offscreen right, 1 = resting position

  // Active theme (default: company)
  private theme: BackgroundTheme = CompanyTheme;

  constructor() {
    this.initBuildings();
    this.initClouds();
  }

  setTheme(theme: BackgroundTheme): void {
    this.theme = theme;
  }

  getTheme(): BackgroundTheme {
    return this.theme;
  }

  private initBuildings(): void {
    const rng = seededRandom(42);

    // Generate enough buildings to fill multiple screens
    let x = 0;
    while (x < CANVAS_WIDTH * 4) {
      const w = 35 + rng() * 55;
      const h = 80 + rng() * 180;
      const topY = GROUND_Y - h;
      this.nearBuildings.push(this.makeBuilding(x, topY, w, h, rng));
      // Gap: 60~160px — sparse, airy city feel
      x += w + 60 + rng() * 100;
    }

    const rng2 = seededRandom(99);
    x = 0;
    while (x < CANVAS_WIDTH * 4) {
      const w = 28 + rng2() * 50;
      const h = 50 + rng2() * 140;
      const topY = GROUND_Y - 30 - h;
      const farBuilding = this.makeBuilding(x, topY, w, h, rng2);
      this.farBuildings.push(farBuilding);
      // Gap: 50~130px for far layer
      x += w + 50 + rng2() * 80;
    }
  }

  private makeBuilding(
    x: number,
    topY: number,
    width: number,
    height: number,
    rng: () => number
  ): BuildingData {
    const wobble: number[] = Array.from({ length: 8 }, () => (rng() - 0.5) * 4);

    const windows: BuildingData['windows'] = [];
    const cols = Math.floor(width / 14);
    const rows = Math.floor(height / 18);
    for (let row = 0; row < Math.min(rows, 6); row++) {
      for (let col = 0; col < Math.min(cols, 4); col++) {
        windows.push({
          x: x + 5 + col * 14 + (rng() - 0.5) * 2,
          y: topY + 10 + row * 18 + (rng() - 0.5) * 2,
          w: 9 + (rng() - 0.5) * 2,
          h: 10 + (rng() - 0.5) * 2,
        });
      }
    }

    return { x, topY, width, windows, wobble };
  }

  private initClouds(): void {
    const rng = seededRandom(77);
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: rng() * CANVAS_WIDTH * 2,
        y: 20 + rng() * 100,
        scale: 0.6 + rng() * 0.8,
        speed: CLOUD_BASE_SPEED + rng() * 0.05,
        seed: rng() * 100,
      });
    }
  }

  update(deltaTime: number, speed: number, _distance: number): void {
    this.time += deltaTime;

    const speedFactor = speed / 80;

    this.nearScrollX += NEAR_BUILDING_SPEED * speedFactor * speed * deltaTime;
    this.farScrollX  += FAR_BUILDING_SPEED  * speedFactor * speed * deltaTime;

    // Only scroll clouds when theme has clouds
    if (this.theme.colors.cloudFill) {
      for (const cloud of this.clouds) {
        cloud.x -= cloud.speed * speedFactor * speed * deltaTime;
        if (cloud.x < -200) {
          cloud.x = CANVAS_WIDTH + 50 + Math.random() * 200;
          cloud.y = 20 + Math.random() * 100;
        }
      }
    }
  }

  // --- Goal building API ---

  showGoalBuilding(): void {
    const rng = seededRandom(7);
    const wobble: number[] = Array.from({ length: 8 }, () => (rng() - 0.5) * 3);

    const windows: GoalBuildingData['windows'] = [];
    const cols = Math.floor(GOAL_BUILDING_WIDTH / 56);
    const rows = Math.floor((GOAL_BUILDING_HEIGHT - 280) / 72); // leave room for door area
    const topY = GROUND_Y - GOAL_BUILDING_HEIGHT;
    for (let row = 0; row < Math.min(rows, 10); row++) {
      for (let col = 0; col < Math.min(cols, 6); col++) {
        windows.push({
          x: 24 + col * 56 + (rng() - 0.5) * 4,
          y: topY + 40 + row * 72 + (rng() - 0.5) * 4,
          w: 36 + (rng() - 0.5) * 4,
          h: 44 + (rng() - 0.5) * 4,
        });
      }
    }

    this.goalBuilding = { wobble, windows };
    this.enteringProgress = 0;
  }

  hideGoalBuilding(): void {
    this.goalBuilding = null;
    this.enteringProgress = 0;
  }

  setEnteringProgress(progress: number): void {
    this.enteringProgress = Math.max(0, Math.min(1, progress));
  }

  getGoalBuildingDoorX(): number {
    const screenX = this.getGoalBuildingScreenX();
    // Door is centered horizontally in the building
    return screenX + GOAL_BUILDING_WIDTH / 2;
  }

  private getGoalBuildingScreenX(): number {
    // Slide from right off-screen to resting position
    const offscreenX = CANVAS_WIDTH + 50;
    return offscreenX + (GOAL_BUILDING_REST_X - offscreenX) * this.enteringProgress;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { theme, time } = this;

    // Sky (theme-controlled)
    theme.renderSky(ctx, time);

    // Clouds (only if theme has cloud colors)
    if (theme.colors.cloudFill) {
      this.renderClouds(ctx);
    }

    // Extra behind buildings (stars, aurora, etc.)
    if (theme.renderExtraBack) {
      theme.renderExtraBack(ctx, time);
    }

    this.renderBuildingLayer(ctx, this.farBuildings, this.farScrollX, 0.35, true);
    this.renderBuildingLayer(ctx, this.nearBuildings, this.nearScrollX, 1.0, false);
    this.renderGround(ctx);

    // Extra in front of ground/buildings (sparkles, dust, ice crystals, etc.)
    if (theme.renderExtraFront) {
      theme.renderExtraFront(ctx, time);
    }

    // Goal building rendered on top of everything (after ground)
    if (this.goalBuilding) {
      this.renderGoalBuilding(ctx);
    }
  }

  private renderClouds(ctx: CanvasRenderingContext2D): void {
    for (const cloud of this.clouds) {
      this.drawCloud(ctx, cloud.x, cloud.y, cloud.scale, cloud.seed);
    }
  }

  private drawCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    seed: number
  ): void {
    const { cloudFill, cloudStroke } = this.theme.colors;
    if (!cloudFill) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const t = this.time * 0.1;
    ctx.strokeStyle = cloudStroke ?? COLORS.line;
    ctx.fillStyle = cloudFill;
    ctx.lineWidth = 2 / scale;

    ctx.beginPath();
    ctx.moveTo(10, 40);
    ctx.quadraticCurveTo(5 + Math.sin(t + seed) * 2, 28, 18, 26);
    ctx.quadraticCurveTo(16, 15, 28, 17);
    ctx.quadraticCurveTo(30, 8, 42, 12);
    ctx.quadraticCurveTo(52, 7, 56, 16);
    ctx.quadraticCurveTo(68, 10, 68, 24);
    ctx.quadraticCurveTo(76, 27, 73, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private renderBuildingLayer(
    ctx: CanvasRenderingContext2D,
    buildings: BuildingData[],
    scrollX: number,
    _opacity: number,
    isFar: boolean
  ): void {
    ctx.save();
    ctx.globalAlpha = isFar ? 0.38 : 1.0;

    const totalWidth = buildings.reduce((sum, b) => sum + b.width + 5, 0);
    const offsetX = -(scrollX % totalWidth);

    for (let rep = -1; rep <= 1; rep++) {
      const baseX = offsetX + rep * totalWidth;

      for (const building of buildings) {
        const bx = baseX + building.x;
        if (bx > CANVAS_WIDTH + 100 || bx + building.width < -100) continue;

        this.drawBuilding(ctx, building, bx, isFar);
      }
    }

    ctx.restore();
  }

  private drawBuilding(
    ctx: CanvasRenderingContext2D,
    building: BuildingData,
    bx: number,
    isFar: boolean
  ): void {
    const { topY, width, wobble } = building;
    const t = this.time;
    const bottomY = GROUND_Y;

    // Delegate to theme-specific drawing if available
    if (this.theme.drawBuilding) {
      this.theme.drawBuilding(ctx, bx, topY, width, bottomY, wobble, t, isFar);
      return;
    }

    const { buildingFill, buildingStroke, windowFill } = this.theme.colors;

    ctx.strokeStyle = buildingStroke;
    ctx.fillStyle = buildingFill;
    ctx.lineWidth = isFar ? 1.5 : 2;
    ctx.lineJoin = 'round';

    // Draw building with slightly wobbly path (bezier curves, no straight lines)
    const w0 = wobble[0] ?? 0;
    const w1 = wobble[1] ?? 0;
    const w2 = wobble[2] ?? 0;
    const w3 = wobble[3] ?? 0;
    const w4 = wobble[4] ?? 0;
    const w5 = wobble[5] ?? 0;
    const w6 = wobble[6] ?? 0;
    const w7 = wobble[7] ?? 0;

    ctx.beginPath();
    ctx.moveTo(bx + w0, bottomY);
    // Left side (slightly curved)
    ctx.bezierCurveTo(
      bx + w1, bottomY - (bottomY - topY) * 0.33,
      bx + w2, bottomY - (bottomY - topY) * 0.66,
      bx + w3, topY
    );
    // Top (slightly curved)
    ctx.bezierCurveTo(
      bx + width * 0.33 + w4, topY + w5,
      bx + width * 0.66 + w6, topY + w7,
      bx + width + w0, topY
    );
    // Right side
    ctx.bezierCurveTo(
      bx + width + w2, bottomY - (bottomY - topY) * 0.66,
      bx + width + w1, bottomY - (bottomY - topY) * 0.33,
      bx + width + w3, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Antenna (sometimes) — use building stroke color
    if (!isFar && (Math.abs(wobble[0] ?? 0) > 1)) {
      const antX = bx + width / 2;
      ctx.beginPath();
      ctx.moveTo(antX, topY);
      ctx.quadraticCurveTo(
        antX + Math.sin(t * 0.3) * 2,
        topY - 15,
        antX + Math.sin(t * 0.5) * 3,
        topY - 25
      );
      ctx.stroke();

      ctx.fillStyle = buildingFill;
      ctx.beginPath();
      ctx.arc(antX + Math.sin(t * 0.5) * 3, topY - 28, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (isFar) return;

    // Windows (slightly wobbly quads)
    ctx.fillStyle = windowFill;
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1.5;

    for (const win of building.windows) {
      const wx = bx + (win.x - building.x);
      const wy = win.y;

      if (wx < bx - 2 || wx + win.w > bx + width + 2) continue;

      const jx = wobbleOffset(win.x, t * 0.1, 1.5);
      const jy = wobbleOffset(win.y, t * 0.1, 1.5);

      ctx.beginPath();
      ctx.moveTo(wx + jx,          wy + jy);
      ctx.lineTo(wx + win.w + jx,  wy + jy - 0.5);
      ctx.lineTo(wx + win.w,       wy + win.h + jy);
      ctx.lineTo(wx,               wy + win.h + jy + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  private renderGround(ctx: CanvasRenderingContext2D): void {
    const scrollX = this.nearScrollX;
    const { ground, groundFill } = this.theme.colors;

    // Ground line (bumpy)
    ctx.strokeStyle = ground;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);

    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const bump = Math.sin((x + scrollX) * 0.05) * 3 +
                   Math.sin((x + scrollX) * 0.12 + 1) * 1.5;
      ctx.lineTo(x, GROUND_Y + bump);
    }
    ctx.stroke();

    // Ground fill
    ctx.fillStyle = groundFill;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const bump = Math.sin((x + scrollX) * 0.05) * 3 +
                   Math.sin((x + scrollX) * 0.12 + 1) * 1.5;
      ctx.lineTo(x, GROUND_Y + bump);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Sidewalk cracks / lines (deterministic offset based on crack x position)
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    const crackSpacing = 40;
    const crackOffset = scrollX % crackSpacing;
    for (let x = -crackOffset; x < CANVAS_WIDTH; x += crackSpacing) {
      const bump = Math.sin((x + scrollX) * 0.05) * 3;
      // Use stable hash from world-space x coordinate instead of Math.random()
      const worldX = Math.round((x + scrollX) / crackSpacing);
      const hash = Math.sin(worldX * 127.1 + 311.7) * 43758.5453;
      const crackEndOffset = (hash - Math.floor(hash) - 0.5) * 4;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + bump);
      ctx.lineTo(x + crackEndOffset, GROUND_Y + 18 + bump);
      ctx.stroke();
    }
  }

  private renderGoalBuilding(ctx: CanvasRenderingContext2D): void {
    if (!this.goalBuilding) return;

    const screenX = this.getGoalBuildingScreenX();
    const w = GOAL_BUILDING_WIDTH;
    const h = GOAL_BUILDING_HEIGHT;
    const topY = GROUND_Y - h;
    const bottomY = GROUND_Y;
    const t = this.time;
    const { wobble, windows } = this.goalBuilding;

    // Delegate to theme-specific goal building drawing if available
    if (this.theme.drawGoalBuilding) {
      ctx.save();
      this.theme.drawGoalBuilding(ctx, screenX, topY, w, h, bottomY, wobble, windows, t);
      ctx.restore();
      return;
    }

    const { buildingFill, buildingStroke, windowFill } = this.theme.colors;

    ctx.save();

    // --- Building body (same wobble-bezier style as near buildings) ---
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

    ctx.beginPath();
    ctx.moveTo(screenX + w0, bottomY);
    ctx.bezierCurveTo(
      screenX + w1, bottomY - h * 0.33,
      screenX + w2, bottomY - h * 0.66,
      screenX + w3, topY
    );
    ctx.bezierCurveTo(
      screenX + w * 0.33 + w4, topY + w5,
      screenX + w * 0.66 + w6, topY + w7,
      screenX + w + w0, topY
    );
    ctx.bezierCurveTo(
      screenX + w + w2, bottomY - h * 0.66,
      screenX + w + w1, bottomY - h * 0.33,
      screenX + w + w3, bottomY
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- Antenna ---
    const antX = screenX + w / 2;
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(antX, topY);
    ctx.quadraticCurveTo(
      antX + Math.sin(t * 0.3) * 2,
      topY - 15,
      antX + Math.sin(t * 0.5) * 3,
      topY - 25
    );
    ctx.stroke();
    ctx.fillStyle = buildingFill;
    ctx.beginPath();
    ctx.arc(antX + Math.sin(t * 0.5) * 3, topY - 28, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- Windows ---
    ctx.fillStyle = windowFill;
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1.5;

    for (const win of windows) {
      // win.x/y are relative to building top-left (screenX, topY)
      const wx = screenX + win.x;
      const wy = win.y; // already absolute Y (set relative to topY during showGoalBuilding)

      const jx = wobbleOffset(win.x, t * 0.1, 1.5);
      const jy = wobbleOffset(win.y, t * 0.1, 1.5);

      ctx.beginPath();
      ctx.moveTo(wx + jx,          wy + jy);
      ctx.lineTo(wx + win.w + jx,  wy + jy - 0.5);
      ctx.lineTo(wx + win.w,       wy + win.h + jy);
      ctx.lineTo(wx,               wy + win.h + jy + 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // --- Door (centered, at bottom of building) ---
    // Door colors adapt slightly to world theme
    const isDark = this.theme.world !== 'company' && this.theme.world !== 'politics';
    const doorW = 128;
    const doorH = 192;
    const doorX = screenX + (w - doorW) / 2;
    const doorY = bottomY - doorH;

    // Door frame
    ctx.fillStyle = isDark ? '#5C3A14' : '#8B6914';
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(doorX, doorY, doorW, doorH);
    ctx.fill();
    ctx.stroke();

    // Left glass panel
    const glassFill = this.theme.world === 'isekai'
      ? '#7030C0'
      : this.theme.world === 'space'
        ? '#304080'
        : '#B8D4E8';
    ctx.fillStyle = glassFill;
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(doorX + 8, doorY + 12, 48, doorH - 24);
    ctx.fill();
    ctx.stroke();

    // Right glass panel
    ctx.beginPath();
    ctx.rect(doorX + doorW - 56, doorY + 12, 48, doorH - 24);
    ctx.fill();
    ctx.stroke();

    // Door handles
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 2;
    const handleY = doorY + doorH * 0.55;
    ctx.beginPath();
    ctx.arc(doorX + 64, handleY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(doorX + doorW - 64, handleY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- Building sign (adapted per world) ---
    const signW = w - 64;
    const signH = 64;
    const signX = screenX + 32;
    const signY = topY + 56;

    const signColors: Record<string, { bg: string; text: string; label: string }> = {
      company:  { bg: '#4A90D9', text: '#FFFFFF', label: 'OFFICE' },
      politics: { bg: '#8B1A1A', text: '#FFD700', label: '청와대' },
      isekai:   { bg: '#4A1A8B', text: '#FFE4A0', label: '마왕성' },
      space:    { bg: '#0A1A4A', text: '#7FDBFF', label: 'BASE' },
    };
    const sign = signColors[this.theme.world] ?? signColors['company']!;

    ctx.fillStyle = sign.bg;
    ctx.strokeStyle = buildingStroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(signX, signY, signW, signH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = sign.text;
    ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sign.label, screenX + w / 2, signY + signH / 2);

    ctx.restore();
  }

  reset(): void {
    this.nearScrollX = 0;
    this.farScrollX = 0;
    this.time = 0;
    this.goalBuilding = null;
    this.enteringProgress = 0;
  }
}

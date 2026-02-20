export const CANVAS_WIDTH = 390;
export const CANVAS_HEIGHT = 844;

export const GRAVITY = 30.42;
export const ANGULAR_DAMPING = 0.88;
export const MAX_ANGLE = Math.PI / 3; // 60 degrees
export const INPUT_FORCE = 70;

export const INITIAL_SPEED = 80; // px/s
export const MAX_SPEED = 140;
export const SPEED_INCREMENT = 4; // px/s per second

export const FIXED_DT = 1 / 60;

// Ground at 720px from top (leaves ~120px for balance HUD at bottom)
export const GROUND_Y = 770;

export const CHARACTER_X = CANVAS_WIDTH * 0.38;
export const CHARACTER_Y = GROUND_Y;

export const VERLET_ITERATIONS = 10;

export const WALK_CYCLE_MULTIPLIER = 2.5;

export const COLORS = {
  bg: '#FFFFFF',
  line: '#222222',
  ground: '#888888',
  groundFill: '#999999',
  danger: '#FF4444',
  gold: '#FFD700',
  coffee: '#8B5E3C',
  coffeeDark: '#5C3D1E',
  sky: '#FFFFFF',
} as const;

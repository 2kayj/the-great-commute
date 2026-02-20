type UpdateFn = (deltaTime: number) => void;
type RenderFn = () => void;

export class GameLoop {
  private updateFn: UpdateFn;
  private renderFn: RenderFn;
  private rafId: number | null = null;
  private lastTime: number = 0;
  private running: boolean = false;

  constructor(update: UpdateFn, render: RenderFn) {
    this.updateFn = update;
    this.renderFn = render;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const rawDelta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Cap delta to prevent spiral of death on tab focus return
    const deltaTime = Math.min(rawDelta, 0.05);

    this.updateFn(deltaTime);
    this.renderFn();

    this.rafId = requestAnimationFrame(this.loop);
  };

  isRunning(): boolean {
    return this.running;
  }
}

import type { InputState } from '../types/game.types';

export class InputManager {
  private state: InputState = { direction: 0, isPressed: false };
  private element: HTMLElement | null = null;
  private onInputChange?: (state: InputState) => void;

  private handlePointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const midX = rect.width / 2;

    this.state = {
      direction: relativeX < midX ? -1 : 1,
      isPressed: true,
    };
    this.onInputChange?.(this.state);
  };

  private handlePointerUp = (e: PointerEvent): void => {
    e.preventDefault();
    this.state = { direction: 0, isPressed: false };
    this.onInputChange?.(this.state);
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.state.isPressed) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const midX = rect.width / 2;

    const newDir: -1 | 0 | 1 = relativeX < midX ? -1 : 1;
    if (newDir !== this.state.direction) {
      this.state = { direction: newDir, isPressed: true };
      this.onInputChange?.(this.state);
    }
  };

  attach(element: HTMLElement, onChange?: (state: InputState) => void): void {
    this.element = element;
    this.onInputChange = onChange;

    element.style.touchAction = 'none';
    element.addEventListener('pointerdown', this.handlePointerDown);
    element.addEventListener('pointerup', this.handlePointerUp);
    element.addEventListener('pointercancel', this.handlePointerUp);
    element.addEventListener('pointermove', this.handlePointerMove);
  }

  detach(): void {
    if (!this.element) return;
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerUp);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element = null;
    this.onInputChange = undefined;
  }

  getState(): Readonly<InputState> {
    return this.state;
  }

  reset(): void {
    this.state = { direction: 0, isPressed: false };
  }
}

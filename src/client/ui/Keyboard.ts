import { UIState } from '../data/Types';

type KeyHandler = () => void;

export class Keyboard {
  private handlers = new Map<string, KeyHandler>();
  private attached = false;
  private currentState: UIState = 'Landing';
  private pressedKeys = new Set<string>();

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  setCurrentState(state: UIState): void {
    this.currentState = state;
  }

  attach(): void {
    if (this.attached) return;
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.attached = true;
  }

  detach(): void {
    if (!this.attached) return;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.attached = false;
  }

  onKey(key: string, handler: KeyHandler): void {
    this.handlers.set(key.toLowerCase(), handler);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    
    // Prevent auto-repeat
    if (this.pressedKeys.has(key)) {
      return;
    }
    this.pressedKeys.add(key);

    // Prevent default arrow key scrolling when playing
    if (this.currentState === 'Playing' && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
    }

    // Handle state-specific keys
    this.handleStateKey(key, event);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.pressedKeys.delete(key);
  }

  private handleStateKey(key: string, event: KeyboardEvent): void {
    // Emit key press for visual feedback
    this.emitKeyPress(key);

    // Route keys based on current state
    switch (this.currentState) {
      case 'Landing':
        if (key === 'p' || key === 'l') {
          const handler = this.handlers.get(key);
          if (handler) {
            event.preventDefault();
            handler();
          }
        }
        break;

      case 'Playing':
        if (key === 'l' || key === 'escape') {
          const handler = this.handlers.get(key);
          if (handler) {
            event.preventDefault();
            handler();
          }
        }
        break;

      case 'LeaderboardOverlay':
        if (key === 'l' || key === 'escape') {
          const handler = this.handlers.get(key);
          if (handler) {
            event.preventDefault();
            handler();
          }
        }
        break;
    }
  }

  private emitKeyPress(key: string): void {
    // Dispatch custom event for visual feedback
    document.dispatchEvent(new CustomEvent('keypress-visual', {
      detail: { key }
    }));
  }

  dispose(): void {
    this.detach();
    this.handlers.clear();
    this.pressedKeys.clear();
  }
}
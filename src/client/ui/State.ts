import { UIState } from '../data/Types';

type StateChangeCallback = (current: UIState, previous: UIState) => void;

export class StateManager {
  private current: UIState = 'Landing';
  private previous: UIState = 'Landing';
  private callbacks: Set<StateChangeCallback> = new Set();

  getCurrentState(): UIState {
    return this.current;
  }

  getPreviousState(): UIState {
    return this.previous;
  }

  subscribe(callback: StateChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notify(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.current, this.previous);
      } catch (error) {
        console.error('State change callback error:', error);
      }
    });
  }

  transition(newState: UIState): void {
    if (newState === this.current) {
      return;
    }

    console.log(`State transition: ${this.current} -> ${newState}`);
    this.previous = this.current;
    this.current = newState;
    this.notify();
  }

  back(): void {
    if (this.current === 'LeaderboardOverlay') {
      this.transition(this.previous === 'LeaderboardOverlay' ? 'Landing' : this.previous);
    } else if (this.current === 'Playing') {
      this.transition('Landing');
    }
  }

  toggleOverlay(overlayType: 'LeaderboardOverlay'): void {
    if (this.current === overlayType) {
      this.back();
    } else {
      this.transition(overlayType);
    }
  }

  isInState(state: UIState): boolean {
    return this.current === state;
  }

  isOverlay(): boolean {
    return this.current.endsWith('Overlay');
  }
}
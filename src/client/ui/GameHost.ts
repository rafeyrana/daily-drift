import { mountGame, unmountGame } from '../../../game';

export class GameHost {
  private gameRoot: HTMLElement | null = null;
  private helpHint: HTMLElement | null = null;
  private isGameMounted = false;
  private isPaused = false;

  constructor(private container: HTMLElement) {
    this.createGameRoot();
    this.createHelpHint();
  }

  enterPlay(): void {
    if (this.isGameMounted) return;

    try {
      // Mount the game with oval track configuration
      mountGame(this.gameRoot!, {
        majorRadius: 65,
        minorRadius: 45,
        trackWidth: 8,
        enableWalls: true
      });
      
      this.isGameMounted = true;
      this.showGameRoot();
      this.showHelpHint();
      
      console.log('Game mounted successfully');
    } catch (error) {
      console.error('Failed to mount game:', error);
      this.exitPlay(); // Cleanup on error
    }
  }

  exitPlay(): void {
    if (!this.isGameMounted) return;

    try {
      unmountGame();
      this.isGameMounted = false;
      this.hideGameRoot();
      this.hideHelpHint();
      
      console.log('Game unmounted successfully');
    } catch (error) {
      console.error('Failed to unmount game:', error);
    }
  }

  pauseForOverlay(): void {
    if (!this.isGameMounted || this.isPaused) return;
    
    this.isPaused = true;
    this.gameRoot?.classList.add('dimmed');
  }

  resumeFromOverlay(): void {
    if (!this.isGameMounted || !this.isPaused) return;
    
    this.isPaused = false;
    this.gameRoot?.classList.remove('dimmed');
  }

  isPlaying(): boolean {
    return this.isGameMounted;
  }

  private createGameRoot(): void {
    this.gameRoot = document.createElement('div');
    this.gameRoot.id = 'game-root';
    this.gameRoot.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 100;
      opacity: 0;
      visibility: hidden;
      transition: opacity 300ms ease, visibility 300ms ease;
    `;
    this.container.appendChild(this.gameRoot);
  }

  private createHelpHint(): void {
    this.helpHint = document.createElement('div');
    this.helpHint.className = 'help-hint';
    this.helpHint.innerHTML = `
      <span>Press</span>
      <span class="kbd-badge">L</span>
      <span>for Leaderboard</span>
      <span>•</span>
      <span class="kbd-badge">Esc</span>
      <span>to Exit</span>
    `;
    this.container.appendChild(this.helpHint);
  }

  private showGameRoot(): void {
    if (this.gameRoot) {
      this.gameRoot.classList.add('active');
      this.gameRoot.style.opacity = '1';
      this.gameRoot.style.visibility = 'visible';
    }
  }

  private hideGameRoot(): void {
    if (this.gameRoot) {
      this.gameRoot.classList.remove('active');
      this.gameRoot.style.opacity = '0';
      this.gameRoot.style.visibility = 'hidden';
    }
  }

  private showHelpHint(): void {
    if (this.helpHint) {
      this.helpHint.classList.add('visible');
    }
  }

  private hideHelpHint(): void {
    if (this.helpHint) {
      this.helpHint.classList.remove('visible');
    }
  }

  dispose(): void {
    this.exitPlay();
    
    if (this.gameRoot && this.gameRoot.parentNode) {
      this.gameRoot.parentNode.removeChild(this.gameRoot);
    }
    
    if (this.helpHint && this.helpHint.parentNode) {
      this.helpHint.parentNode.removeChild(this.helpHint);
    }
    
    this.gameRoot = null;
    this.helpHint = null;
  }
}
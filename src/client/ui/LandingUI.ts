import { Logo } from './Logo';
import { Hints } from './Hints';

type EventCallback = () => void;

export class LandingUI {
  private container: HTMLElement | null = null;
  private logo: Logo;
  private hints: Hints;
  private onPlayCallback?: EventCallback;
  private onLeaderboardCallback?: EventCallback;

  constructor() {
    this.logo = new Logo();
    this.hints = new Hints();
    
    // Listen for visual key press feedback
    document.addEventListener('keypress-visual', this.handleKeyPressVisual.bind(this));
  }

  mount(root: HTMLElement): void {
    if (this.container) {
      this.unmount();
    }

    this.container = this.createLandingDOM();
    root.appendChild(this.container);
  }

  unmount(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }

  show(): void {
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  hide(): void {
    if (this.container) {
      this.container.classList.add('hidden');
    }
  }

  onPlayRequested(callback: EventCallback): void {
    this.onPlayCallback = callback;
  }

  onLeaderboardRequested(callback: EventCallback): void {
    this.onLeaderboardCallback = callback;
  }

  private createLandingDOM(): HTMLElement {
    const landing = document.createElement('div');
    landing.className = 'landing-ui';

    // Logo container
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    logoContainer.appendChild(this.logo.getElement());
    landing.appendChild(logoContainer);

    // Headline
    const headline = document.createElement('div');
    headline.className = 'headline';
    headline.textContent = 'Three tries a day. Drift clean. Climb the board.';
    landing.appendChild(headline);

    // CTA Container
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'cta-container';

    // Primary CTA - Play
    const playButton = document.createElement('button');
    playButton.className = 'cta-button cta-primary';
    playButton.setAttribute('tabindex', '0');
    
    const playText = document.createElement('span');
    playText.textContent = 'Press P to Play';
    const playBadge = this.hints.createKeyboardBadge('P');
    
    playButton.appendChild(playText);
    playButton.appendChild(playBadge);
    playButton.addEventListener('click', () => this.handlePlay());
    
    ctaContainer.appendChild(playButton);

    // Secondary CTA - Leaderboard
    const leaderboardButton = document.createElement('button');
    leaderboardButton.className = 'cta-button';
    leaderboardButton.setAttribute('tabindex', '0');
    
    const leaderboardText = document.createElement('span');
    leaderboardText.textContent = 'Press L for Leaderboard';
    const leaderboardBadge = this.hints.createKeyboardBadge('L');
    
    leaderboardButton.appendChild(leaderboardText);
    leaderboardButton.appendChild(leaderboardBadge);
    leaderboardButton.addEventListener('click', () => this.handleLeaderboard());
    
    ctaContainer.appendChild(leaderboardButton);
    landing.appendChild(ctaContainer);

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = `
      <strong>Controls:</strong> ↑ accelerate · ↓ brake/reverse · ←/→ steer<br>
      <strong>Drift:</strong> brake-tap + steer · power-over (throttle + steer) · feint (quick steer reversal)
    `;
    landing.appendChild(instructions);

    // Footer credits
    const footer = document.createElement('div');
    footer.className = 'footer-credits';
    footer.textContent = 'Daily Drift © 2025 - Built for Reddit';
    landing.appendChild(footer);

    // Start pulse effect
    this.hints.createPulseEffect();

    return landing;
  }

  private handlePlay(): void {
    this.onPlayCallback?.();
  }

  private handleLeaderboard(): void {
    this.onLeaderboardCallback?.();
  }

  private handleKeyPressVisual(event: CustomEvent): void {
    const { key } = event.detail;
    this.hints.showKeyPress(key);
  }

  dispose(): void {
    this.unmount();
    this.hints.dispose();
    document.removeEventListener('keypress-visual', this.handleKeyPressVisual.bind(this));
  }
}
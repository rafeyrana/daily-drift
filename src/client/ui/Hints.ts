export class Hints {
  private badges = new Map<string, HTMLElement>();

  createKeyboardBadge(key: string, className?: string): HTMLElement {
    const badge = document.createElement('span');
    badge.className = `kbd-badge ${className || ''}`;
    badge.textContent = key.toUpperCase();
    badge.setAttribute('aria-label', `Press ${key.toUpperCase()} key`);
    
    this.badges.set(key.toLowerCase(), badge);
    return badge;
  }

  showKeyPress(key: string): void {
    const badge = this.badges.get(key.toLowerCase());
    if (badge) {
      badge.classList.add('pressed');
      setTimeout(() => {
        badge.classList.remove('pressed');
      }, 200);
    }
  }

  createPulseEffect(): void {
    this.badges.forEach(badge => {
      badge.style.animation = 'pulse 2s infinite';
    });
  }

  stopPulseEffect(): void {
    this.badges.forEach(badge => {
      badge.style.animation = '';
    });
  }

  dispose(): void {
    this.badges.clear();
  }
}
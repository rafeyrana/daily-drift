import { TodayLeaderboard, LeaderboardEntry } from '../data/Types';
import { formatTimeMs } from '../data/LeaderboardApi';
import { Hints } from './Hints';

export class LeaderboardUI {
  private overlay: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private tableBody: HTMLElement | null = null;
  private loadingElement: HTMLElement | null = null;
  private errorElement: HTMLElement | null = null;
  private hints: Hints;
  private isOpen = false;
  private previousActiveElement: Element | null = null;

  constructor() {
    this.hints = new Hints();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
  }

  open(data: TodayLeaderboard): void {
    if (this.isOpen) return;

    this.previousActiveElement = document.activeElement;
    this.createModal();
    this.update(data);
    this.showModal();
    this.setupFocusTrap();
  }

  close(): void {
    if (!this.isOpen) return;

    this.hideModal();
    this.removeFocusTrap();
    
    setTimeout(() => {
      this.destroyModal();
      // Restore focus
      if (this.previousActiveElement && 'focus' in this.previousActiveElement) {
        (this.previousActiveElement as HTMLElement).focus();
      }
    }, 200);
  }

  update(data: TodayLeaderboard): void {
    if (!this.tableBody) return;

    this.hideLoading();
    this.hideError();
    
    // Update header date
    const titleElement = this.modal?.querySelector('.leaderboard-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = `Today's Leaderboard - ${new Date(data.dateISO).toLocaleDateString()}`;
    }

    // Render entries
    this.tableBody.innerHTML = '';
    data.entries.forEach(entry => {
      const row = this.createTableRow(entry);
      this.tableBody!.appendChild(row);
    });
  }

  setLoading(loading: boolean): void {
    if (loading) {
      this.showLoading();
    } else {
      this.hideLoading();
    }
  }

  setError(message?: string): void {
    if (message) {
      this.showError(message);
    } else {
      this.hideError();
    }
  }

  private createModal(): void {
    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'leaderboard-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'leaderboard-title');
    this.overlay.addEventListener('click', this.handleOverlayClick);

    // Modal
    this.modal = document.createElement('div');
    this.modal.className = 'leaderboard-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'leaderboard-header';

    const title = document.createElement('h2');
    title.id = 'leaderboard-title';
    title.className = 'leaderboard-title';
    title.textContent = "Today's Leaderboard";

    const closeHint = document.createElement('div');
    closeHint.className = 'leaderboard-close';
    
    const closeText = document.createElement('span');
    closeText.textContent = 'Close:';
    
    const lBadge = this.hints.createKeyboardBadge('L');
    const escBadge = this.hints.createKeyboardBadge('Esc');
    
    closeHint.appendChild(closeText);
    closeHint.appendChild(lBadge);
    closeHint.appendChild(document.createTextNode(' or '));
    closeHint.appendChild(escBadge);

    header.appendChild(title);
    header.appendChild(closeHint);

    // Body
    const body = document.createElement('div');
    body.className = 'leaderboard-body';

    // Table
    const table = document.createElement('table');
    table.className = 'leaderboard-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Rank', 'Player', 'Time', 'Track'];
    headers.forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    this.tableBody = document.createElement('tbody');
    table.appendChild(this.tableBody);

    body.appendChild(table);

    // Loading state
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'loading-spinner';
    this.loadingElement.textContent = 'Loading leaderboard...';
    this.loadingElement.style.display = 'none';
    body.appendChild(this.loadingElement);

    // Error state
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'error-message';
    this.errorElement.style.display = 'none';
    body.appendChild(this.errorElement);

    this.modal.appendChild(header);
    this.modal.appendChild(body);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);
  }

  private createTableRow(entry: LeaderboardEntry): HTMLElement {
    const row = document.createElement('tr');
    if (entry.isYou) {
      row.classList.add('you');
    }

    // Rank
    const rankCell = document.createElement('td');
    rankCell.textContent = `#${entry.rank}`;
    row.appendChild(rankCell);

    // Username
    const usernameCell = document.createElement('td');
    usernameCell.textContent = entry.isYou ? `${entry.username} (You)` : entry.username;
    row.appendChild(usernameCell);

    // Time
    const timeCell = document.createElement('td');
    timeCell.textContent = formatTimeMs(entry.timeMs);
    row.appendChild(timeCell);

    // Track (placeholder)
    const trackCell = document.createElement('td');
    trackCell.textContent = 'Oval Speedway';
    row.appendChild(trackCell);

    return row;
  }

  private showModal(): void {
    this.isOpen = true;
    setTimeout(() => {
      this.overlay?.classList.add('open');
    }, 10);
  }

  private hideModal(): void {
    this.isOpen = false;
    this.overlay?.classList.remove('open');
  }

  private destroyModal(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.modal = null;
    this.tableBody = null;
    this.loadingElement = null;
    this.errorElement = null;
  }

  private showLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'block';
    }
    if (this.tableBody) {
      this.tableBody.style.display = 'none';
    }
  }

  private hideLoading(): void {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
    if (this.tableBody) {
      this.tableBody.style.display = '';
    }
  }

  private showError(message: string): void {
    if (this.errorElement) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
    }
    if (this.tableBody) {
      this.tableBody.style.display = 'none';
    }
  }

  private hideError(): void {
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
    }
    if (this.tableBody) {
      this.tableBody.style.display = '';
    }
  }

  private setupFocusTrap(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    // Focus the modal
    this.modal?.focus();
  }

  private removeFocusTrap(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    const key = event.key.toLowerCase();
    
    if (key === 'escape' || key === 'l') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }

    // Tab focus trap
    if (key === 'tab') {
      const focusableElements = this.modal?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  private handleOverlayClick(event: MouseEvent): void {
    if (event.target === this.overlay) {
      this.close();
    }
  }

  dispose(): void {
    this.close();
    this.hints.dispose();
  }
}
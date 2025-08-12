import { LandingUI } from './ui/LandingUI';
import { LeaderboardUI } from './ui/LeaderboardUI';
import { GameHost } from './ui/GameHost';
import { StateManager } from './ui/State';
import { Keyboard } from './ui/Keyboard';
import { fetchLeaderboard } from './data/LeaderboardApi';

class DailyDriftApp {
  private stateManager: StateManager;
  private keyboard: Keyboard;
  private landingUI: LandingUI;
  private leaderboardUI: LeaderboardUI;
  private gameHost: GameHost;
  private appContainer: HTMLElement;

  constructor() {
    // Create app container
    this.appContainer = document.createElement('div');
    this.appContainer.className = 'app-container';
    this.appContainer.id = 'app';
    
    // Clear existing body content and setup
    document.body.innerHTML = '';
    document.body.appendChild(this.appContainer);

    // Initialize components
    this.stateManager = new StateManager();
    this.keyboard = new Keyboard();
    this.landingUI = new LandingUI();
    this.leaderboardUI = new LeaderboardUI();
    this.gameHost = new GameHost(this.appContainer);

    this.setupEventHandlers();
    this.setupStateTransitions();
    this.initialize();
  }

  private setupEventHandlers(): void {
    // Landing UI callbacks
    this.landingUI.onPlayRequested(() => this.startPlay());
    this.landingUI.onLeaderboardRequested(() => this.showLeaderboard());

    // Keyboard bindings
    this.keyboard.onKey('p', () => {
      if (this.stateManager.isInState('Landing')) {
        this.startPlay();
      }
    });

    this.keyboard.onKey('l', () => {
      this.toggleLeaderboard();
    });

    this.keyboard.onKey('escape', () => {
      if (this.stateManager.isInState('LeaderboardOverlay')) {
        this.stateManager.back();
      } else if (this.stateManager.isInState('Playing')) {
        this.exitPlay();
      }
    });

    // Page visibility and cleanup
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.stateManager.isInState('Playing')) {
        this.exitPlay();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.dispose();
    });
  }

  private setupStateTransitions(): void {
    this.stateManager.subscribe((current, previous) => {
      // Update keyboard state awareness
      this.keyboard.setCurrentState(current);

      console.log(`UI State: ${previous} -> ${current}`);

      // Handle overlay closures
      if (previous === 'LeaderboardOverlay') {
        this.leaderboardUI.close();
        if (current === 'Playing') {
          this.gameHost.resumeFromOverlay();
        }
      }

      // Handle transitions
      switch (current) {
        case 'Landing':
          this.handleLandingState(previous);
          break;
        case 'Playing':
          this.handlePlayingState(previous);
          break;
        case 'LeaderboardOverlay':
          this.handleLeaderboardOverlay(previous);
          break;
      }
    });
  }

  private handleLandingState(previous: string): void {
    if (previous === 'Playing') {
      // Exit game
      this.gameHost.exitPlay();
    }
    
    // Show landing UI
    this.landingUI.show();
  }

  private handlePlayingState(previous: string): void {
    if (previous === 'Landing') {
      // Hide landing and start game
      this.landingUI.hide();
      this.gameHost.enterPlay();
    }
  }

  private handleLeaderboardOverlay(previous: string): void {
    if (previous === 'Playing') {
      // Dim game but don't unmount
      this.gameHost.pauseForOverlay();
    }
    
    // Open leaderboard with loading state
    this.openLeaderboardWithData();
  }

  private async startPlay(): Promise<void> {
    this.stateManager.transition('Playing');
  }

  private exitPlay(): void {
    this.stateManager.transition('Landing');
  }

  private toggleLeaderboard(): void {
    this.stateManager.toggleOverlay('LeaderboardOverlay');
  }

  private showLeaderboard(): void {
    this.stateManager.transition('LeaderboardOverlay');
  }

  private async openLeaderboardWithData(): Promise<void> {
    try {
      // Show loading state
      const mockData = {
        dateISO: new Date().toISOString().split('T')[0] as string,
        trackName: 'Loading...',
        entries: []
      };
      
      this.leaderboardUI.open(mockData);
      this.leaderboardUI.setLoading(true);

      // Fetch real data
      const leaderboardData = await fetchLeaderboard();
      this.leaderboardUI.setLoading(false);
      this.leaderboardUI.update(leaderboardData);
      
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.leaderboardUI.setLoading(false);
      this.leaderboardUI.setError('Failed to load leaderboard data');
    }
  }

  private initialize(): void {
    console.log('Daily Drift initializing...');
    
    // Mount landing UI
    this.landingUI.mount(this.appContainer);
    
    // Attach keyboard handler
    this.keyboard.attach();
    
    // Set initial state
    this.stateManager.transition('Landing');
    
    console.log('Daily Drift ready! Press P to play, L for leaderboard.');
  }

  private dispose(): void {
    console.log('Daily Drift shutting down...');
    
    this.keyboard.dispose();
    this.landingUI.dispose();
    this.leaderboardUI.dispose();
    this.gameHost.dispose();
  }
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DailyDriftApp());
} else {
  new DailyDriftApp();
}
import { navigateTo } from '@devvit/client';
import { InitResponse } from '../shared/types/api';
import { mountGame, unmountGame } from '../../game';

const titleElement = document.getElementById('title') as HTMLHeadingElement;
const counterValueElement = document.getElementById('counter-value') as HTMLSpanElement;

const docsLink = document.getElementById('docs-link');
const playtestLink = document.getElementById('playtest-link');
const discordLink = document.getElementById('discord-link');

docsLink?.addEventListener('click', () => navigateTo('https://developers.reddit.com/docs'));
playtestLink?.addEventListener('click', () => navigateTo('https://www.reddit.com/r/Devvit'));
discordLink?.addEventListener('click', () => navigateTo('https://discord.com/invite/R7yu2wh9Qz'));

let currentPostId: string | null = null;

async function fetchInitialData(): Promise<void> {
  try {
    const response = await fetch('/api/init');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as InitResponse;
    if (data.type === 'init') {
      counterValueElement.textContent = data.count.toString();
      currentPostId = data.postId;
      titleElement.textContent = `Daily Drift - ${data.username} 🏁`;
    } else {
      counterValueElement.textContent = 'Error';
    }
  } catch (err) {
    console.error('Error fetching initial data:', err);
    counterValueElement.textContent = 'Error';
    titleElement.textContent = 'Daily Drift 🏁';
  }
}

// Initialize the drift game
function initGame(): void {
  // Hide the overlay elements that conflict with the game
  const overlay = document.querySelector('.overlay') as HTMLElement;
  if (overlay) {
    overlay.style.display = 'none';
  }

  // Create game container that fills the screen
  const gameContainer = document.createElement('div');
  gameContainer.id = 'drift-game-container';
  gameContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
  `;
  
  document.body.appendChild(gameContainer);
  
  // Remove the existing canvas
  const existingCanvas = document.getElementById('bg');
  if (existingCanvas) {
    existingCanvas.style.display = 'none';
  }
  
  // Mount the drift game
  mountGame(gameContainer, {
    majorRadius: 65,
    minorRadius: 45,
    trackWidth: 8,
    enableWalls: true
  });
}

// Cleanup function for when the webview is closed
function cleanup(): void {
  unmountGame();
  const gameContainer = document.getElementById('drift-game-container');
  if (gameContainer && gameContainer.parentNode) {
    gameContainer.parentNode.removeChild(gameContainer);
  }
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cleanup();
  }
});

// Handle page unload
window.addEventListener('beforeunload', cleanup);

// Initialize everything
void fetchInitialData().then(() => {
  // Small delay to ensure DOM is ready
  setTimeout(initGame, 100);
});

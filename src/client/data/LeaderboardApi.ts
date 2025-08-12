import { TodayLeaderboard, LeaderboardEntry } from './Types';

export function formatTimeMs(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
}

function generateMockData(dateISO?: string): TodayLeaderboard {
  const entries: LeaderboardEntry[] = [];
  const usernames = [
    'SpeedDemon42', 'DriftKing', 'NightRacer', 'TurboBoost', 'VelocityX',
    'RacingLegend', 'FastFury', 'NitroBlast', 'RedlineRush', 'ThunderDrift',
    'StreetRacer', 'AdrenalineX', 'RocketFuel', 'DragKing', 'BurnRubber',
    'HighOctane', 'TurboCharge', 'NeonDrift', 'ApexRacer', 'GhostRider',
    'WindStorm', 'FireTrail', 'LightSpeed', 'StormChaser', 'BlazeFast',
    'CyberRacer', 'QuantumDash', 'HyperDrive', 'StarRacer', 'CosmicDrift',
    'ElectroSpeed', 'PhotonRush', 'LaserDash', 'WarpSpeed', 'FlashPoint',
    'SonicBoom', 'PlasmaRush', 'NeonFlash', 'DigitalRace', 'CircuitBreak',
    'PowerSlide', 'TurboGlide', 'RapidFire', 'SwiftStrike', 'QuickSilver',
    'MegaBoost', 'UltraFast', 'HyperSpeed', 'MaxVelocity', 'PureDrift'
  ];

  // Generate realistic drift times (30-90 seconds)
  for (let i = 0; i < 50; i++) {
    const baseTime = 30000 + Math.random() * 60000; // 30-90 seconds
    const variation = (Math.random() - 0.5) * 5000; // ±2.5 seconds
    const timeMs = Math.max(25000, baseTime + variation);
    
    entries.push({
      rank: i + 1,
      username: usernames[i] || `Racer${i + 1}`,
      timeMs: Math.round(timeMs),
      isYou: i === 12 // Mark 13th place as "you"
    });
  }

  // Sort by time
  entries.sort((a, b) => a.timeMs - b.timeMs);
  
  // Update ranks after sorting
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return {
    dateISO: dateISO ?? new Date().toISOString().split('T')[0],
    trackName: 'Oval Speedway',
    entries
  };
}

export async function fetchLeaderboard(dateISO?: string): Promise<TodayLeaderboard> {
  try {
    const queryParam = dateISO ? `?date=${dateISO}` : '';
    const response = await fetch(`/api/leaderboard${queryParam}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json() as TodayLeaderboard;
  } catch (error) {
    console.warn('Failed to fetch leaderboard, using mock data:', error);
    return generateMockData(dateISO);
  }
}
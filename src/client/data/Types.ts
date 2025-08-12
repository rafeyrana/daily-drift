export interface LeaderboardEntry {
  rank: number;
  username: string;
  timeMs: number;
  isYou?: boolean;
}

export interface TodayLeaderboard {
  dateISO: string;
  trackName: string;
  entries: LeaderboardEntry[];
}

export type UIState = 'Landing' | 'Playing' | 'LeaderboardOverlay';
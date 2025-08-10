export interface Player {
  id: string;
  name: string;
  gender: 'male' | 'female';
  level: 1 | 2 | 3 | 4 | 5; // 1: 초급, 2: 초중급, 3: 중급, 4: 중상급, 5: 상급
}

export interface Group {
  id: string;
  name: string;
  players: Player[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GameRules {
  matchCount: number; // 2-10
  setsPerMatch: number; // 1-5
  gamesPerSet: 4 | 6;
  deuceRule: 'advantage' | 'no-ad';
  tiebreakRule: 'seven-point' | 'five-point' | 'draw' | 'no-tiebreak';
}

export interface Team {
  player1: Player;
  player2: Player;
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  matchType: 'mens' | 'womens' | 'mixed';
  courtNumber?: number;
  scores?: MatchScore;
  completed: boolean;
}

export interface SetScore {
  team1Games: number;
  team2Games: number;
  team1TiebreakPoints?: number;
  team2TiebreakPoints?: number;
  tiebreakPlayed: boolean;
}

export interface MatchScore {
  sets: SetScore[];
  winner?: 'team1' | 'team2' | 'draw';
}

export interface Tournament {
  id: string;
  name: string;
  groupId: string;
  participants: Player[];
  rules: GameRules;
  matches: Match[];
  createdAt: Date;
  updatedAt: Date;
  completed: boolean;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winPoints: number; // 승점 기준 (승리: 3점, 무승부: 2점, 패배: 0점)
  gamePoints: number; // 게임 포인트 기준 (+1 per game won, -1 per game lost)
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export interface TournamentResult {
  tournament: Tournament;
  playerStats: PlayerStats[];
  winPointsRanking: PlayerStats[];
  gamePointsRanking: PlayerStats[];
}
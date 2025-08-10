import { Match, MatchScore, SetScore, GameRules, PlayerStats, Tournament } from '../types';

// 세트 승자 결정
export function determineSetWinner(setScore: SetScore, rules: GameRules): 'team1' | 'team2' | 'draw' | null {
  const { team1Games, team2Games, tiebreakPlayed, team1TiebreakPoints = 0, team2TiebreakPoints = 0 } = setScore;
  
  // 타이브레이크가 진행된 경우
  if (tiebreakPlayed) {
    const tiebreakTarget = rules.tiebreakRule === 'seven-point' ? 7 : 5;
    
    if (team1TiebreakPoints >= tiebreakTarget && team1TiebreakPoints - team2TiebreakPoints >= 2) {
      return 'team1';
    }
    if (team2TiebreakPoints >= tiebreakTarget && team2TiebreakPoints - team1TiebreakPoints >= 2) {
      return 'team2';
    }
    return null; // 타이브레이크 진행 중
  }
  
  // 일반 게임
  const target = rules.gamesPerSet;
  
  switch (rules.tiebreakRule) {
    case 'seven-point':
    case 'five-point':
      // 타이브레이크 조건 확인
      if (rules.gamesPerSet === 4 && team1Games === 4 && team2Games === 4) {
        return null; // 타이브레이크 필요
      }
      if (rules.gamesPerSet === 6 && team1Games === 6 && team2Games === 6) {
        return null; // 타이브레이크 필요
      }
      
      // 일반 승리 조건
      if (team1Games >= target && team1Games - team2Games >= 2) return 'team1';
      if (team2Games >= target && team2Games - team1Games >= 2) return 'team2';
      break;
      
    case 'no-tiebreak':
      // 타이없이 승자 종료
      if (rules.gamesPerSet === 4) {
        if (team1Games === 4 && team2Games === 3) return 'team1';
        if (team2Games === 4 && team1Games === 3) return 'team2';
      } else {
        if (team1Games === 6 && team2Games === 5) return 'team1';
        if (team2Games === 6 && team1Games === 5) return 'team2';
      }
      break;
      
    case 'draw':
      // 무승부로 종료
      if (rules.gamesPerSet === 4 && team1Games === 3 && team2Games === 3) return 'draw';
      if (rules.gamesPerSet === 6 && team1Games === 5 && team2Games === 5) return 'draw';
      
      // 일반 승리 조건도 체크
      if (team1Games >= target && team1Games - team2Games >= 2) return 'team1';
      if (team2Games >= target && team2Games - team1Games >= 2) return 'team2';
      break;
  }
  
  return null; // 세트 진행 중
}

// 매치 승자 결정
export function determineMatchWinner(matchScore: MatchScore, rules: GameRules): 'team1' | 'team2' | 'draw' | null {
  if (!matchScore.sets || matchScore.sets.length === 0) return null;
  
  let team1SetWins = 0;
  let team2SetWins = 0;
  let draws = 0;
  
  for (const setScore of matchScore.sets) {
    const setWinner = determineSetWinner(setScore, rules);
    if (setWinner === 'team1') team1SetWins++;
    else if (setWinner === 'team2') team2SetWins++;
    else if (setWinner === 'draw') draws++;
    else return null; // 세트가 아직 완료되지 않음
  }
  
  const setsToWin = Math.ceil(rules.setsPerMatch / 2);
  
  if (team1SetWins >= setsToWin) return 'team1';
  if (team2SetWins >= setsToWin) return 'team2';
  
  // 모든 세트가 완료되었지만 승자가 없는 경우
  if (matchScore.sets.length === rules.setsPerMatch) {
    if (team1SetWins === team2SetWins) return 'draw';
  }
  
  return null; // 매치 진행 중
}

// 플레이어별 게임 통계 계산
export function calculateGameStats(match: Match): {
  team1GamesWon: number;
  team1GamesLost: number;
  team2GamesWon: number;
  team2GamesLost: number;
} {
  if (!match.scores?.sets) {
    return { team1GamesWon: 0, team1GamesLost: 0, team2GamesWon: 0, team2GamesLost: 0 };
  }
  
  let team1GamesWon = 0;
  let team1GamesLost = 0;
  
  for (const setScore of match.scores.sets) {
    team1GamesWon += setScore.team1Games;
    team1GamesLost += setScore.team2Games;
  }
  
  return {
    team1GamesWon,
    team1GamesLost,
    team2GamesWon: team1GamesLost,
    team2GamesLost: team1GamesWon
  };
}

// 토너먼트 통계 계산
export function calculateTournamentStats(tournament: Tournament): PlayerStats[] {
  const playerStatsMap = new Map<string, PlayerStats>();
  
  // 모든 참가자 초기화
  tournament.participants.forEach(player => {
    playerStatsMap.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      winPoints: 0,
      gamePoints: 0,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0
    });
  });
  
  // 완료된 매치들에 대해 통계 계산
  tournament.matches.filter(match => match.completed && match.scores).forEach(match => {
    const matchWinner = determineMatchWinner(match.scores!, tournament.rules);
    const gameStats = calculateGameStats(match);
    
    // 팀 1 플레이어들
    const team1Players = [match.team1.player1.id, match.team1.player2.id];
    const team2Players = [match.team2.player1.id, match.team2.player2.id];
    
    // 매치 결과에 따른 승점 계산
    team1Players.forEach(playerId => {
      const stats = playerStatsMap.get(playerId)!;
      stats.matchesPlayed++;
      
      if (matchWinner === 'team1') {
        stats.wins++;
        stats.winPoints += 3; // 승리: 3점
      } else if (matchWinner === 'team2') {
        stats.losses++;
        stats.winPoints += 0; // 패배: 0점
      } else if (matchWinner === 'draw') {
        stats.draws++;
        stats.winPoints += 2; // 무승부: 2점
      }
      
      // 게임 포인트 계산 (팀1)
      stats.gamePoints += gameStats.team1GamesWon - gameStats.team1GamesLost;
      stats.gamesWon += gameStats.team1GamesWon;
      stats.gamesLost += gameStats.team1GamesLost;
    });
    
    team2Players.forEach(playerId => {
      const stats = playerStatsMap.get(playerId)!;
      stats.matchesPlayed++;
      
      if (matchWinner === 'team2') {
        stats.wins++;
        stats.winPoints += 3; // 승리: 3점
      } else if (matchWinner === 'team1') {
        stats.losses++;
        stats.winPoints += 0; // 패배: 0점
      } else if (matchWinner === 'draw') {
        stats.draws++;
        stats.winPoints += 2; // 무승부: 2점
      }
      
      // 게임 포인트 계산 (팀2)
      stats.gamePoints += gameStats.team2GamesWon - gameStats.team2GamesLost;
      stats.gamesWon += gameStats.team2GamesWon;
      stats.gamesLost += gameStats.team2GamesLost;
    });
    
    // 세트 통계 계산
    if (match.scores?.sets) {
      let team1SetsWon = 0;
      let team2SetsWon = 0;
      
      match.scores.sets.forEach(setScore => {
        const setWinner = determineSetWinner(setScore, tournament.rules);
        if (setWinner === 'team1') team1SetsWon++;
        else if (setWinner === 'team2') team2SetsWon++;
      });
      
      team1Players.forEach(playerId => {
        const stats = playerStatsMap.get(playerId)!;
        stats.setsWon += team1SetsWon;
        stats.setsLost += team2SetsWon;
      });
      
      team2Players.forEach(playerId => {
        const stats = playerStatsMap.get(playerId)!;
        stats.setsWon += team2SetsWon;
        stats.setsLost += team1SetsWon;
      });
    }
  });
  
  return Array.from(playerStatsMap.values());
}

// 승점 기준 순위
export function getRankingByWinPoints(playerStats: PlayerStats[]): PlayerStats[] {
  return [...playerStats].sort((a, b) => {
    if (b.winPoints !== a.winPoints) return b.winPoints - a.winPoints;
    if (b.gamePoints !== a.gamePoints) return b.gamePoints - a.gamePoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName);
  });
}

// 게임 포인트 기준 순위
export function getRankingByGamePoints(playerStats: PlayerStats[]): PlayerStats[] {
  return [...playerStats].sort((a, b) => {
    if (b.gamePoints !== a.gamePoints) return b.gamePoints - a.gamePoints;
    if (b.winPoints !== a.winPoints) return b.winPoints - a.winPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName);
  });
}

// 스코어 유효성 검증
export function validateScore(setScore: SetScore, rules: GameRules): {
  isValid: boolean;
  error?: string;
} {
  const { team1Games, team2Games, tiebreakPlayed, team1TiebreakPoints = 0, team2TiebreakPoints = 0 } = setScore;
  
  // 기본 유효성 검사
  if (team1Games < 0 || team2Games < 0) {
    return { isValid: false, error: '게임 수는 음수일 수 없습니다.' };
  }
  
  if (tiebreakPlayed && (team1TiebreakPoints < 0 || team2TiebreakPoints < 0)) {
    return { isValid: false, error: '타이브레이크 포인트는 음수일 수 없습니다.' };
  }
  
  // 타이브레이크 조건 검증
  if (tiebreakPlayed) {
    const shouldHaveTiebreak = 
      (rules.gamesPerSet === 4 && team1Games === 4 && team2Games === 4) ||
      (rules.gamesPerSet === 6 && team1Games === 6 && team2Games === 6);
      
    if (!shouldHaveTiebreak) {
      return { isValid: false, error: '현재 게임 스코어에서 타이브레이크가 필요하지 않습니다.' };
    }
    
    // 타이브레이크 포인트 검증
    const tiebreakTarget = rules.tiebreakRule === 'seven-point' ? 7 : 5;
    const maxPoints = Math.max(team1TiebreakPoints, team2TiebreakPoints);
    const minPoints = Math.min(team1TiebreakPoints, team2TiebreakPoints);
    
    if (maxPoints >= tiebreakTarget && maxPoints - minPoints >= 2) {
      // 타이브레이크 완료됨 - 유효
    } else if (maxPoints < tiebreakTarget || maxPoints - minPoints < 2) {
      // 타이브레이크 진행 중 - 유효
    } else {
      return { isValid: false, error: '타이브레이크 포인트가 유효하지 않습니다.' };
    }
  }
  
  return { isValid: true };
}

// 매치 완료 여부 확인
export function isMatchCompleted(match: Match, rules: GameRules): boolean {
  if (!match.scores?.sets) return false;
  
  const winner = determineMatchWinner(match.scores, rules);
  return winner !== null;
}

// 다음 게임/세트 정보 제공
export function getNextGameInfo(match: Match, rules: GameRules): {
  nextSet: number;
  isMatchComplete: boolean;
  needsTiebreak: boolean;
} {
  if (!match.scores?.sets) {
    return { nextSet: 1, isMatchComplete: false, needsTiebreak: false };
  }
  
  const currentSetIndex = match.scores.sets.length - 1;
  const currentSet = match.scores.sets[currentSetIndex];
  
  // 현재 세트가 완료되었는지 확인
  const setWinner = determineSetWinner(currentSet, rules);
  
  if (setWinner === null) {
    // 현재 세트 진행 중
    const needsTiebreak = 
      !currentSet.tiebreakPlayed &&
      ((rules.gamesPerSet === 4 && currentSet.team1Games === 4 && currentSet.team2Games === 4) ||
       (rules.gamesPerSet === 6 && currentSet.team1Games === 6 && currentSet.team2Games === 6)) &&
      (rules.tiebreakRule === 'seven-point' || rules.tiebreakRule === 'five-point');
    
    return {
      nextSet: currentSetIndex + 1,
      isMatchComplete: false,
      needsTiebreak
    };
  }
  
  // 현재 세트가 완료됨 - 매치 완료 여부 확인
  const matchWinner = determineMatchWinner(match.scores, rules);
  
  return {
    nextSet: matchWinner ? currentSetIndex + 1 : currentSetIndex + 2,
    isMatchComplete: matchWinner !== null,
    needsTiebreak: false
  };
}
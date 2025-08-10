import { v4 as uuidv4 } from 'uuid';
import { Player, Team, Match, GameRules } from '../types';

export interface MatchGenerationOptions {
  players: Player[];
  rules: GameRules;
  timeLimit?: number; // 시간 제한 (시간 단위)
}

// 플레이어들을 성별과 레벨에 따라 그룹화
export function groupPlayersByGenderAndLevel(players: Player[]) {
  const malesByLevel: { [key: number]: Player[] } = {};
  const femalesByLevel: { [key: number]: Player[] } = {};

  players.forEach(player => {
    if (player.gender === 'male') {
      if (!malesByLevel[player.level]) malesByLevel[player.level] = [];
      malesByLevel[player.level].push(player);
    } else {
      if (!femalesByLevel[player.level]) femalesByLevel[player.level] = [];
      femalesByLevel[player.level].push(player);
    }
  });

  return { malesByLevel, femalesByLevel };
}

// 팀 밸런스를 위한 레벨 점수 계산
function getTeamLevelScore(team: Team): number {
  return team.player1.level + team.player2.level;
}

// 가능한 팀 조합 생성
function generatePossibleTeams(players: Player[]): Team[] {
  const teams: Team[] = [];
  
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      teams.push({
        player1: players[i],
        player2: players[j]
      });
    }
  }
  
  return teams;
}

// 매치 타입 결정
function getMatchType(team1: Team, team2: Team): 'mens' | 'womens' | 'mixed' {
  const team1Genders = [team1.player1.gender, team1.player2.gender];
  const team2Genders = [team2.player1.gender, team2.player2.gender];
  
  const allMale = [...team1Genders, ...team2Genders].every(g => g === 'male');
  const allFemale = [...team1Genders, ...team2Genders].every(g => g === 'female');
  
  if (allMale) return 'mens';
  if (allFemale) return 'womens';
  return 'mixed';
}

// 플레이어가 이미 다른 매치에 참여하고 있는지 확인 (향후 사용 예정)
// function isPlayerInMatches(playerId: string, matches: Match[]): boolean {
//   return matches.some(match => 
//     match.team1.player1.id === playerId ||
//     match.team1.player2.id === playerId ||
//     match.team2.player1.id === playerId ||
//     match.team2.player2.id === playerId
//   );
// }

// 밸런스가 맞는 매치 생성
function createBalancedMatch(availableTeams: Team[], existingMatches: Match[]): Match | null {
  // 이미 매치에 참여한 플레이어들 제외
  const usedPlayerIds = new Set<string>();
  existingMatches.forEach(match => {
    usedPlayerIds.add(match.team1.player1.id);
    usedPlayerIds.add(match.team1.player2.id);
    usedPlayerIds.add(match.team2.player1.id);
    usedPlayerIds.add(match.team2.player2.id);
  });

  const eligibleTeams = availableTeams.filter(team => 
    !usedPlayerIds.has(team.player1.id) && !usedPlayerIds.has(team.player2.id)
  );

  if (eligibleTeams.length < 2) return null;

  // 레벨 밸런스를 고려한 최적의 매치 찾기
  let bestMatch: { team1: Team; team2: Team; scoreDiff: number } | null = null;

  for (let i = 0; i < eligibleTeams.length; i++) {
    for (let j = i + 1; j < eligibleTeams.length; j++) {
      const team1 = eligibleTeams[i];
      const team2 = eligibleTeams[j];
      
      // 동일한 플레이어가 두 팀에 있는지 확인
      const playerIds = [team1.player1.id, team1.player2.id, team2.player1.id, team2.player2.id];
      if (new Set(playerIds).size !== 4) continue;

      const team1Score = getTeamLevelScore(team1);
      const team2Score = getTeamLevelScore(team2);
      const scoreDiff = Math.abs(team1Score - team2Score);

      if (!bestMatch || scoreDiff < bestMatch.scoreDiff) {
        bestMatch = { team1, team2, scoreDiff };
      }
    }
  }

  if (!bestMatch) return null;

  return {
    id: uuidv4(),
    team1: bestMatch.team1,
    team2: bestMatch.team2,
    matchType: getMatchType(bestMatch.team1, bestMatch.team2),
    completed: false
  };
}

// 성별 기반 팀 생성 (같은 성별끼리 우선)
function createSameGenderTeams(players: Player[]): Team[] {
  const { malesByLevel, femalesByLevel } = groupPlayersByGenderAndLevel(players);
  const teams: Team[] = [];

  // 남자 팀들 생성
  const allMales = Object.values(malesByLevel).flat();
  teams.push(...generatePossibleTeams(allMales).filter(team => 
    team.player1.gender === 'male' && team.player2.gender === 'male'
  ));

  // 여자 팀들 생성
  const allFemales = Object.values(femalesByLevel).flat();
  teams.push(...generatePossibleTeams(allFemales).filter(team => 
    team.player1.gender === 'female' && team.player2.gender === 'female'
  ));

  return teams;
}

// 혼성 팀 생성
function createMixedTeams(players: Player[]): Team[] {
  const males = players.filter(p => p.gender === 'male');
  const females = players.filter(p => p.gender === 'female');
  const teams: Team[] = [];

  for (const male of males) {
    for (const female of females) {
      teams.push({
        player1: male,
        player2: female
      });
    }
  }

  return teams;
}

// 메인 매치 생성 함수
export function generateMatches(options: MatchGenerationOptions): Match[] {
  const { players, rules } = options;
  
  if (players.length < 4) {
    throw new Error('최소 4명의 참가자가 필요합니다.');
  }

  const matches: Match[] = [];
  const maxMatches = Math.min(rules.matchCount, Math.floor(players.length / 2));

  // 시간 기반 매치 수 조정
  if (options.timeLimit) {
    const timeBasedMaxMatches = rules.gamesPerSet === 4 ? 
      Math.floor(options.timeLimit / 2 * 6) : // 4게임: 2시간당 6매치
      Math.floor(options.timeLimit / 2 * 5);  // 6게임: 2시간당 5매치
    
    const adjustedMaxMatches = Math.min(maxMatches, timeBasedMaxMatches);
    if (adjustedMaxMatches < maxMatches) {
      console.log(`시간 제한으로 인해 매치 수가 ${maxMatches}에서 ${adjustedMaxMatches}로 조정되었습니다.`);
    }
  }

  // 1. 같은 성별끼리 팀 생성 우선
  const sameGenderTeams = createSameGenderTeams(players);
  
  // 2. 같은 성별 팀들로 매치 생성
  while (matches.length < maxMatches) {
    const newMatch = createBalancedMatch(sameGenderTeams, matches);
    if (!newMatch) break;
    matches.push(newMatch);
  }

  // 3. 남거나 성비가 맞지 않는 경우 혼성 팀 추가
  if (matches.length < maxMatches) {
    const mixedTeams = createMixedTeams(players);
    
    while (matches.length < maxMatches) {
      const newMatch = createBalancedMatch(mixedTeams, matches);
      if (!newMatch) break;
      matches.push(newMatch);
    }
  }

  // 코트 번호 할당
  matches.forEach((match, index) => {
    match.courtNumber = index + 1;
  });

  return matches;
}

// 플레이어 매치 참여 횟수 계산
export function getPlayerMatchCounts(matches: Match[]): Map<string, number> {
  const counts = new Map<string, number>();
  
  matches.forEach(match => {
    const playerIds = [
      match.team1.player1.id,
      match.team1.player2.id,
      match.team2.player1.id,
      match.team2.player2.id
    ];
    
    playerIds.forEach(id => {
      counts.set(id, (counts.get(id) || 0) + 1);
    });
  });
  
  return counts;
}

// 매치 밸런스 검증
export function validateMatchBalance(matches: Match[]): {
  isBalanced: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const playerCounts = getPlayerMatchCounts(matches);
  
  // 참여 횟수 불균형 체크
  const counts = Array.from(playerCounts.values());
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  
  if (maxCount - minCount > 1) {
    issues.push(`플레이어 참여 횟수 불균형: 최소 ${minCount}회, 최대 ${maxCount}회`);
  }

  // 레벨 밸런스 체크
  matches.forEach((match, index) => {
    const team1Score = getTeamLevelScore(match.team1);
    const team2Score = getTeamLevelScore(match.team2);
    const diff = Math.abs(team1Score - team2Score);
    
    if (diff > 3) {
      issues.push(`매치 ${index + 1}: 레벨 차이가 큼 (${diff})`);
    }
  });

  return {
    isBalanced: issues.length === 0,
    issues
  };
}
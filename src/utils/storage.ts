import { Group, Tournament, Player } from '../types';

const STORAGE_KEYS = {
  GROUPS: 'tennis_tournament_groups',
  TOURNAMENTS: 'tennis_tournament_tournaments',
} as const;

// 로컬 스토리지 헬퍼 함수들
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    // Date 객체 복원
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

// 그룹 관련 함수들
export function loadGroups(): Group[] {
  return getFromStorage<Group>(STORAGE_KEYS.GROUPS);
}

export function saveGroups(groups: Group[]): void {
  saveToStorage(STORAGE_KEYS.GROUPS, groups);
}

export function getGroupById(groupId: string): Group | undefined {
  const groups = loadGroups();
  return groups.find(group => group.id === groupId);
}

export function createGroup(group: Omit<Group, 'createdAt' | 'updatedAt'>): Group {
  const groups = loadGroups();
  const now = new Date();
  
  const newGroup: Group = {
    ...group,
    createdAt: now,
    updatedAt: now,
  };
  
  groups.push(newGroup);
  saveGroups(groups);
  
  return newGroup;
}

export function updateGroup(groupId: string, updates: Partial<Omit<Group, 'id' | 'createdAt'>>): Group | null {
  const groups = loadGroups();
  const index = groups.findIndex(group => group.id === groupId);
  
  if (index === -1) return null;
  
  groups[index] = {
    ...groups[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  saveGroups(groups);
  return groups[index];
}

export function deleteGroup(groupId: string): boolean {
  const groups = loadGroups();
  const index = groups.findIndex(group => group.id === groupId);
  
  if (index === -1) return false;
  
  groups.splice(index, 1);
  saveGroups(groups);
  
  // 관련된 토너먼트도 삭제
  const tournaments = loadTournaments();
  const filteredTournaments = tournaments.filter(tournament => tournament.groupId !== groupId);
  saveTournaments(filteredTournaments);
  
  return true;
}

export function addPlayerToGroup(groupId: string, player: Player): Group | null {
  const groups = loadGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (!group) return null;
  
  // 중복 플레이어 체크 (이름 기준)
  if (group.players.some(p => p.name === player.name)) {
    throw new Error('같은 이름의 플레이어가 이미 존재합니다.');
  }
  
  group.players.push(player);
  group.updatedAt = new Date();
  
  saveGroups(groups);
  return group;
}

export function removePlayerFromGroup(groupId: string, playerId: string): Group | null {
  const groups = loadGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (!group) return null;
  
  group.players = group.players.filter(p => p.id !== playerId);
  group.updatedAt = new Date();
  
  saveGroups(groups);
  return group;
}

export function updatePlayerInGroup(groupId: string, playerId: string, updates: Partial<Omit<Player, 'id'>>): Group | null {
  const groups = loadGroups();
  const group = groups.find(g => g.id === groupId);
  
  if (!group) return null;
  
  const playerIndex = group.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return null;
  
  group.players[playerIndex] = {
    ...group.players[playerIndex],
    ...updates,
  };
  group.updatedAt = new Date();
  
  saveGroups(groups);
  return group;
}

// 토너먼트 관련 함수들
export function loadTournaments(): Tournament[] {
  return getFromStorage<Tournament>(STORAGE_KEYS.TOURNAMENTS);
}

export function saveTournaments(tournaments: Tournament[]): void {
  saveToStorage(STORAGE_KEYS.TOURNAMENTS, tournaments);
}

export function getTournamentById(tournamentId: string): Tournament | undefined {
  const tournaments = loadTournaments();
  return tournaments.find(tournament => tournament.id === tournamentId);
}

export function getTournamentsByGroupId(groupId: string): Tournament[] {
  const tournaments = loadTournaments();
  return tournaments.filter(tournament => tournament.groupId === groupId);
}

export function createTournament(tournament: Omit<Tournament, 'createdAt' | 'updatedAt'>): Tournament {
  const tournaments = loadTournaments();
  const now = new Date();
  
  const newTournament: Tournament = {
    ...tournament,
    createdAt: now,
    updatedAt: now,
  };
  
  tournaments.push(newTournament);
  saveTournaments(tournaments);
  
  return newTournament;
}

export function updateTournament(tournamentId: string, updates: Partial<Omit<Tournament, 'id' | 'createdAt'>>): Tournament | null {
  const tournaments = loadTournaments();
  const index = tournaments.findIndex(tournament => tournament.id === tournamentId);
  
  if (index === -1) return null;
  
  tournaments[index] = {
    ...tournaments[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  saveTournaments(tournaments);
  return tournaments[index];
}

export function deleteTournament(tournamentId: string): boolean {
  const tournaments = loadTournaments();
  const index = tournaments.findIndex(tournament => tournament.id === tournamentId);
  
  if (index === -1) return false;
  
  tournaments.splice(index, 1);
  saveTournaments(tournaments);
  
  return true;
}

// 데이터 백업 및 복원
export function exportData(): {
  groups: Group[];
  tournaments: Tournament[];
  exportDate: string;
} {
  return {
    groups: loadGroups(),
    tournaments: loadTournaments(),
    exportDate: new Date().toISOString(),
  };
}

export function importData(data: {
  groups: Group[];
  tournaments: Tournament[];
}): void {
  // 데이터 유효성 검사
  if (!Array.isArray(data.groups) || !Array.isArray(data.tournaments)) {
    throw new Error('유효하지 않은 데이터 형식입니다.');
  }
  
  // Date 객체 복원
  const restoredGroups = data.groups.map(group => ({
    ...group,
    createdAt: new Date(group.createdAt),
    updatedAt: new Date(group.updatedAt),
  }));
  
  const restoredTournaments = data.tournaments.map(tournament => ({
    ...tournament,
    createdAt: new Date(tournament.createdAt),
    updatedAt: new Date(tournament.updatedAt),
  }));
  
  saveGroups(restoredGroups);
  saveTournaments(restoredTournaments);
}

// 스토리지 클리어
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.GROUPS);
  localStorage.removeItem(STORAGE_KEYS.TOURNAMENTS);
}

// 스토리지 사용량 확인 (대략적)
export function getStorageUsage(): {
  groups: number;
  tournaments: number;
  total: number;
} {
  const groupsData = localStorage.getItem(STORAGE_KEYS.GROUPS) || '';
  const tournamentsData = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS) || '';
  
  return {
    groups: new Blob([groupsData]).size,
    tournaments: new Blob([tournamentsData]).size,
    total: new Blob([groupsData + tournamentsData]).size,
  };
}

// 데이터 마이그레이션 (필요 시 사용)
export function migrateData(): void {
  try {
    // 기존 데이터 형식에서 새로운 형식으로 변환하는 로직
    // 버전 업데이트 시 필요에 따라 구현
    console.log('Data migration completed');
  } catch (error) {
    console.error('Data migration failed:', error);
  }
}
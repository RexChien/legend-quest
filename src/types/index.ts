// ==========================================
// 核心型別定義 (Legend Quest Types)
// ==========================================

export type HeroClass = 'guardian' | 'berserker' | 'priest';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ItemType = 'weapon' | 'armor' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  description: string;
  icon: string; // SVG icon identifier or symbol
  hpBonus: number;
  atkBonus: number;
  defBonus: number;
  spdBonus: number;
  critBonus?: number; // 0 - 100%
  passiveEffect?: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  shield: number;
  atk: number;
  def: number;
  spd: number;
  critRate: number; // e.g. 0.1 for 10%
}

export interface Skill {
  id: string;
  name: string;
  heroClass: HeroClass;
  icon: string;
  description: string;
  cooldown: number; // turns
  currentCooldown?: number;
  targetType: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self';
  shortcutKey: string; // '1' | '2' | '3' | '4'
  requiresCombo?: boolean;
}

export interface Player {
  id: string; // Peer ID or unique UUID
  name: string;
  heroClass: HeroClass;
  level: number;
  stats: PlayerStats;
  skills: Skill[];
  equipment: {
    weapon?: Equipment;
    armor?: Equipment;
    accessory?: Equipment;
  };
  isDowned: boolean;
  isReady: boolean;
  isHost: boolean;
  isAI?: boolean;
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  description: string;
  duration: number; // remaining turns
  icon: string;
  statModifier?: Partial<PlayerStats>;
  isTaunt?: boolean;
  isArmorBreak?: boolean;
  isGuaranteedCrit?: boolean;
}

export interface Monster {
  id: string;
  name: string;
  title?: string;
  isBoss: boolean;
  stats: {
    hp: number;
    maxHp: number;
    shield: number;
    atk: number;
    def: number;
    spd: number;
  };
  skills: {
    name: string;
    description: string;
    targetType: 'single_hero' | 'all_heroes';
  }[];
  statusEffects: StatusEffect[];
  tauntedById?: string; // target only this player
  avatarIcon: string;
}

export type DungeonNodeType = 'battle' | 'elite' | 'campfire' | 'chest' | 'boss';

export interface DungeonNode {
  id: number;
  type: DungeonNodeType;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  monsterName?: string;
}

export interface ActionChoice {
  actorId: string;
  actorType: 'player' | 'monster';
  actorName: string;
  skillId: string;
  skillName: string;
  targetId: string;
}

export interface ActionStep {
  actorId: string;
  actorName: string;
  actorType: 'player' | 'monster';
  skillId: string;
  skillName: string;
  targetId: string;
  targetName: string;
  damage?: number;
  heal?: number;
  shield?: number;
  isCrit?: boolean;
  isComboTriggered?: boolean;
  effectsApplied?: string[];
  logMessage: string;
  targetDefeated?: boolean;
}

export interface BattleState {
  round: number;
  phase: 'planning' | 'resolving' | 'victory' | 'defeat';
  players: Player[];
  monsters: Monster[];
  currentNodeIndex: number;
  actionQueue: ActionStep[];
  logs: BattleLog[];
  comboActive: boolean; // true if armor break or holy blessing is primed
  comboSource?: string;
}

export interface BattleLog {
  id: string;
  timestamp: string;
  text: string;
  type: 'damage' | 'heal' | 'shield' | 'combo' | 'downed' | 'revive' | 'system';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'combat' | 'funny' | 'progression';
  icon: string;
  unlockedAt?: string;
  bonus: string;
  statReward: Partial<PlayerStats>;
}

export interface SaveData {
  version: number;
  playerId: string;
  playerName: string;
  heroClass: HeroClass;
  level: number;
  inventory: Equipment[];
  equipped: {
    weapon?: Equipment;
    armor?: Equipment;
    accessory?: Equipment;
  };
  achievements: string[]; // unlocked achievement IDs
  dungeonProgress: number;
  teammateSnapshots: TeammateSnapshot[];
}

export interface TeammateSnapshot {
  id: string;
  name: string;
  heroClass: HeroClass;
  level: number;
  stats: PlayerStats;
  equipment: {
    weapon?: Equipment;
    armor?: Equipment;
    accessory?: Equipment;
  };
  updatedAt: string;
}

// P2P Protocol Messages
export type P2PMessage =
  | { type: 'JOIN_REQUEST'; player: Player }
  | { type: 'JOIN_ACCEPTED'; roomState: { hostId: string; players: Player[]; currentNodeIndex: number } }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'PLAYER_READY_STATUS'; playerId: string; isReady: boolean }
  | { type: 'SUBMIT_ACTION'; action: ActionChoice }
  | { type: 'TURN_RESOLVED'; actionSteps: ActionStep[]; finalState: BattleState }
  | { type: 'ADVANCE_NODE'; nodeIndex: number; nextBattle: BattleState }
  | { type: 'CAMPFIRE_REST'; playerId: string; healAmount: number }
  | { type: 'LOOT_OBTAINED'; playerId: string; item: Equipment }
  | { type: 'SYNC_PARTY'; players: Player[] }
  | { type: 'CHAT_MESSAGE'; senderName: string; text: string };

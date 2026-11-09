// ==========================================
// 存檔與成就系統 (LocalStorage + Base64 Export/Import)
// ==========================================
import type { SaveData, HeroClass, Equipment, Achievement, PlayerStats, Skill, Player } from '../types';

const SAVE_KEY = 'LEGEND_QUEST_SAVE_V1';

export const INITIAL_SKILLS: Record<HeroClass, Skill[]> = {
  guardian: [
    {
      id: 'taunt',
      name: '戰吼嘲諷',
      heroClass: 'guardian',
      icon: 'ShieldAlert',
      description: '強制怪物下一回合攻擊自己，並獲得 100 點護盾',
      cooldown: 2,
      targetType: 'single_enemy',
      shortcutKey: '1',
    },
    {
      id: 'shield_wall',
      name: '聖盾守護',
      heroClass: 'guardian',
      icon: 'Shield',
      description: '為全體隊友套上 150 點吸收護盾',
      cooldown: 3,
      targetType: 'all_allies',
      shortcutKey: '2',
    },
    {
      id: 'shield_bash',
      name: '重裝盾擊',
      heroClass: 'guardian',
      icon: 'Hammer',
      description: '造成 45 點傷害，並削弱目標 20% 攻擊力',
      cooldown: 1,
      targetType: 'single_enemy',
      shortcutKey: '3',
    },
    {
      id: 'heavy_slash',
      name: '堅定揮砍',
      heroClass: 'guardian',
      icon: 'Sword',
      description: '對單體造成 35 點穩定物理打擊',
      cooldown: 0,
      targetType: 'single_enemy',
      shortcutKey: '4',
    },
  ],
  berserker: [
    {
      id: 'armor_break',
      name: '破甲怒斬',
      heroClass: 'berserker',
      icon: 'Axe',
      description: '造成 55 傷害並降低目標 30% 防禦，點亮全隊連攜！',
      cooldown: 2,
      targetType: 'single_enemy',
      shortcutKey: '1',
    },
    {
      id: 'execute',
      name: '絕殺處決',
      heroClass: 'berserker',
      icon: 'Skull',
      description: '目標血量低於 35% 時必定暴擊，造成 120+ 巨額傷害',
      cooldown: 3,
      targetType: 'single_enemy',
      shortcutKey: '2',
      requiresCombo: true,
    },
    {
      id: 'whirlwind',
      name: '暴風橫掃',
      heroClass: 'berserker',
      icon: 'Flame',
      description: '對所有敵人造成 40 點群體爆發傷害',
      cooldown: 2,
      targetType: 'all_enemies',
      shortcutKey: '3',
    },
    {
      id: 'slash',
      name: '狂暴重劈',
      heroClass: 'berserker',
      icon: 'Swords',
      description: '對單體造成 50 點物理傷害',
      cooldown: 0,
      targetType: 'single_enemy',
      shortcutKey: '4',
    },
  ],
  priest: [
    {
      id: 'quick_heal',
      name: '快速治療',
      heroClass: 'priest',
      icon: 'HeartHandshake',
      description: '恢復隊友 120 點生命值（可將倒地隊友拉起復活）',
      cooldown: 1,
      targetType: 'single_ally',
      shortcutKey: '1',
    },
    {
      id: 'holy_blessing',
      name: '聖光祝福',
      heroClass: 'priest',
      icon: 'Sparkles',
      description: '隊伍下一擊必定暴擊並增加 35% 傷害，觸發連攜！',
      cooldown: 3,
      targetType: 'all_allies',
      shortcutKey: '2',
    },
    {
      id: 'group_heal',
      name: '群體庇護',
      heroClass: 'priest',
      icon: 'HeartPulse',
      description: '為全體隊友恢復 70 點生命值並清除 1 個負面狀態',
      cooldown: 3,
      targetType: 'all_allies',
      shortcutKey: '3',
    },
    {
      id: 'smite',
      name: '神聖懲戒',
      heroClass: 'priest',
      icon: 'Sun',
      description: '召喚聖光懲戒敵人，造成 40 點神聖魔法傷害',
      cooldown: 0,
      targetType: 'single_enemy',
      shortcutKey: '4',
    },
  ],
};

export const BASE_STATS: Record<HeroClass, PlayerStats> = {
  guardian: { hp: 350, maxHp: 350, shield: 0, atk: 35, def: 28, spd: 14, critRate: 0.05 },
  berserker: { hp: 280, maxHp: 280, shield: 0, atk: 58, def: 16, spd: 18, critRate: 0.15 },
  priest: { hp: 240, maxHp: 240, shield: 0, atk: 38, def: 18, spd: 16, critRate: 0.10 },
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: '初入地牢',
    description: '成功擊敗第一隻怪物',
    category: 'progression',
    icon: 'Sword',
    bonus: '最大生命值 +20',
    statReward: { maxHp: 20 },
  },
  {
    id: 'limit_rescue',
    title: '極限救援',
    description: '在隊友生命值低於 15% 時為其治療拉回',
    category: 'combat',
    icon: 'Heart',
    bonus: '防禦力 +5',
    statReward: { def: 5 },
  },
  {
    id: 'combo_master',
    title: '破甲連攜秒殺',
    description: '觸發破甲狀態後，由隊友一回合內將目標擊殺',
    category: 'combat',
    icon: 'Zap',
    bonus: '暴擊率 +5%',
    statReward: { critRate: 0.05 },
  },
  {
    id: 'overheal_fail',
    title: '神醫翻車',
    description: '全隊明明滿血卻仍施放了群體治療',
    category: 'funny',
    icon: 'Smile',
    bonus: '速度 +3',
    statReward: { spd: 3 },
  },
  {
    id: 'downed_clutch',
    title: '絕境翻盤',
    description: '在兩名隊友倒地的情況下完成 Boss 斬殺',
    category: 'combat',
    icon: 'Trophy',
    bonus: '全屬性 +5',
    statReward: { atk: 5, def: 5, maxHp: 25 },
  },
  {
    id: 'gear_collector',
    title: '全副武裝',
    description: '穿戴整套稀有（Rare）以上的裝備',
    category: 'progression',
    icon: 'ShieldCheck',
    bonus: '攻擊力 +6',
    statReward: { atk: 6 },
  },
];

export const INITIAL_EQUIPMENT: Record<HeroClass, { weapon: Equipment; armor: Equipment; accessory: Equipment }> = {
  guardian: {
    weapon: { id: 'w_g_1', name: '誓約長劍', type: 'weapon', rarity: 'common', description: '厚實可靠的精鋼劍', icon: 'Sword', hpBonus: 0, atkBonus: 8, defBonus: 4, spdBonus: 0 },
    armor: { id: 'a_g_1', name: '重裝板甲', type: 'armor', rarity: 'common', description: '抵擋大部分劈砍', icon: 'Shield', hpBonus: 40, atkBonus: 0, defBonus: 10, spdBonus: -1 },
    accessory: { id: 'acc_g_1', name: '石質護符', type: 'accessory', rarity: 'common', description: '堅如磐石的祝願', icon: 'Gem', hpBonus: 20, atkBonus: 0, defBonus: 4, spdBonus: 2 },
  },
  berserker: {
    weapon: { id: 'w_b_1', name: '黑鐵戰斧', type: 'weapon', rarity: 'common', description: '能輕易撕裂護甲', icon: 'Axe', hpBonus: 0, atkBonus: 14, defBonus: 0, spdBonus: 1 },
    armor: { id: 'a_b_1', name: '狂徒皮甲', type: 'armor', rarity: 'common', description: '輕巧靈動的鞣皮護甲', icon: 'Shield', hpBonus: 25, atkBonus: 3, defBonus: 5, spdBonus: 2 },
    accessory: { id: 'acc_b_1', name: '力量指環', type: 'accessory', rarity: 'common', description: '刻著蠻力符文', icon: 'Sparkles', hpBonus: 10, atkBonus: 6, defBonus: 0, spdBonus: 0, critBonus: 0.05 },
  },
  priest: {
    weapon: { id: 'w_p_1', name: '福音權杖', type: 'weapon', rarity: 'common', description: '凝聚微弱的聖光祈禱', icon: 'Sparkle', hpBonus: 0, atkBonus: 10, defBonus: 2, spdBonus: 1 },
    armor: { id: 'a_p_1', name: '修道者布袍', type: 'armor', rarity: 'common', description: '素雅整潔的祝福法袍', icon: 'Shield', hpBonus: 20, atkBonus: 2, defBonus: 6, spdBonus: 2 },
    accessory: { id: 'acc_p_1', name: '水滴吊墜', type: 'accessory', rarity: 'common', description: '沁涼心神的祝福飾物', icon: 'Gem', hpBonus: 25, atkBonus: 0, defBonus: 3, spdBonus: 3 },
  },
};

export const DEFAULT_AI_SNAPSHOTS: Player[] = [
  {
    id: 'ai_tank',
    name: '傭兵・剛鐸',
    heroClass: 'guardian',
    level: 1,
    isHost: false,
    isReady: true,
    isDowned: false,
    isAI: true,
    statusEffects: [],
    stats: { ...BASE_STATS.guardian },
    skills: [...INITIAL_SKILLS.guardian],
    equipment: { ...INITIAL_EQUIPMENT.guardian },
  },
  {
    id: 'ai_dps',
    name: '傭兵・克雷',
    heroClass: 'berserker',
    level: 1,
    isHost: false,
    isReady: true,
    isDowned: false,
    isAI: true,
    statusEffects: [],
    stats: { ...BASE_STATS.berserker },
    skills: [...INITIAL_SKILLS.berserker],
    equipment: { ...INITIAL_EQUIPMENT.berserker },
  },
  {
    id: 'ai_healer',
    name: '傭兵・艾蓮',
    heroClass: 'priest',
    level: 1,
    isHost: false,
    isReady: true,
    isDowned: false,
    isAI: true,
    statusEffects: [],
    stats: { ...BASE_STATS.priest },
    skills: [...INITIAL_SKILLS.priest],
    equipment: { ...INITIAL_EQUIPMENT.priest },
  },
];

export const SaveManager = {
  load(): SaveData {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('Failed to load save from localStorage', e);
    }
    return this.createDefaultSave();
  },

  createDefaultSave(heroClass: HeroClass = 'berserker', name = '冒險者'): SaveData {
    const id = 'p_' + Math.random().toString(36).substring(2, 9);
    const save: SaveData = {
      version: 1,
      playerId: id,
      playerName: name,
      heroClass,
      level: 1,
      inventory: [],
      equipped: { ...INITIAL_EQUIPMENT[heroClass] },
      achievements: [],
      dungeonProgress: 1,
      teammateSnapshots: [],
    };
    this.save(save);
    return save;
  },

  save(data: SaveData) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Save failed', e);
    }
  },

  exportBase64(): string {
    const data = this.load();
    const jsonStr = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonStr));
  },

  importBase64(base64Str: string): SaveData | null {
    try {
      const jsonStr = decodeURIComponent(atob(base64Str.trim()));
      const parsed = JSON.parse(jsonStr) as SaveData;
      if (parsed.playerId && parsed.heroClass) {
        this.save(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return null;
  },

  cacheTeammate(teammate: Player) {
    const save = this.load();
    const existingIdx = save.teammateSnapshots.findIndex((s) => s.id === teammate.id);
    const snapshot = {
      id: teammate.id,
      name: teammate.name,
      heroClass: teammate.heroClass,
      level: teammate.level,
      stats: teammate.stats,
      equipment: teammate.equipment,
      updatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      save.teammateSnapshots[existingIdx] = snapshot;
    } else {
      save.teammateSnapshots.push(snapshot);
      if (save.teammateSnapshots.length > 10) save.teammateSnapshots.shift();
    }
    this.save(save);
  },

  unlockAchievement(id: string): Achievement | null {
    const save = this.load();
    if (!save.achievements.includes(id)) {
      save.achievements.push(id);
      this.save(save);
      return ALL_ACHIEVEMENTS.find((a) => a.id === id) || null;
    }
    return null;
  },
};

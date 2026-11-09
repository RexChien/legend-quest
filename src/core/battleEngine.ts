// ==========================================
// 權威戰鬥狀態機與結算引擎 (Turn Resolver & AI Decision)
// ==========================================
import type {
  BattleState,
  Player,
  Monster,
  ActionChoice,
  ActionStep,
  DungeonNode,
  Equipment,
  Rarity,
  ItemType,
} from '../types';

export const DUNGEON_NODES: DungeonNode[] = [
  {
    id: 0,
    type: 'battle',
    title: '地牢哨站：哥布林斥候',
    description: '巡邏的綠皮斥候發現了你們，揮舞著生鏽的彎刀撲了上來！',
    isCompleted: false,
    isCurrent: true,
    monsterName: '哥布林斥候',
  },
  {
    id: 1,
    type: 'battle',
    title: '廢墟通道：狂暴半獸人',
    description: '魁梧的半獸人格鬥士手持破甲狼牙棒，怒吼著封鎖了通道！',
    isCompleted: false,
    isCurrent: false,
    monsterName: '狂暴半獸人',
  },
  {
    id: 2,
    type: 'campfire',
    title: '幽暗營火：微光喘息',
    description: '在石窟角落生起營火，全員烤火休息恢復 45% 最大生命值。',
    isCompleted: false,
    isCurrent: false,
  },
  {
    id: 3,
    type: 'chest',
    title: '遠古遺跡：符文寶箱',
    description: '散發著幽微金光的古代寶箱，全員各自獲得一件強大冒險裝備！',
    isCompleted: false,
    isCurrent: false,
  },
  {
    id: 4,
    type: 'boss',
    title: '深淵王座：骸骨巨龍・辛德拉苟斯',
    description: '盤踞在巨石王座上的古代骨龍甦醒，冰冷死靈烈焰籠罩全場！',
    isCompleted: false,
    isCurrent: false,
    monsterName: '骸骨巨龍・辛德拉苟斯',
  },
];

export function createMonsterForNode(nodeIndex: number): Monster[] {
  if (nodeIndex === 0) {
    return [
      {
        id: 'mon_1',
        name: '哥布林斥候',
        title: '先鋒小隊',
        isBoss: false,
        stats: { hp: 380, maxHp: 380, shield: 0, atk: 32, def: 12, spd: 15 },
        skills: [
          { name: '淬毒突刺', description: '對前排造成 35 點刺擊傷害', targetType: 'single_hero' },
          { name: '刺耳尖嘯', description: '對全體造成 20 點聲波傷害', targetType: 'all_heroes' },
        ],
        statusEffects: [],
        avatarIcon: 'Skull',
      },
    ];
  } else if (nodeIndex === 1) {
    return [
      {
        id: 'mon_2',
        name: '狂暴半獸人',
        title: '地牢衛隊長',
        isBoss: false,
        stats: { hp: 620, maxHp: 620, shield: 0, atk: 48, def: 20, spd: 13 },
        skills: [
          { name: '粉碎重槌', description: '造成 60 點重壓打擊', targetType: 'single_hero' },
          { name: '橫掃千軍', description: '對全員造成 35 點震盪傷害', targetType: 'all_heroes' },
        ],
        statusEffects: [],
        avatarIcon: 'Axe',
      },
    ];
  } else if (nodeIndex === 4) {
    return [
      {
        id: 'mon_boss',
        name: '骸骨巨龍・辛德拉苟斯',
        title: '深淵終焉領主',
        isBoss: true,
        stats: { hp: 1250, maxHp: 1250, shield: 150, atk: 65, def: 25, spd: 17 },
        skills: [
          { name: '霜火吐息', description: '對全員噴吐毀滅龍息，造成 55 點群體暗影霜凍傷害', targetType: 'all_heroes' },
          { name: '死靈龍爪', description: '以致命巨爪撕裂單體目標，造成 85 點物理打擊', targetType: 'single_hero' },
        ],
        statusEffects: [],
        avatarIcon: 'Flame',
      },
    ];
  }
  return [];
}

export function generateAiAction(player: Player, state: BattleState): ActionChoice {
  const aliveMonsters = state.monsters.filter((m) => m.stats.hp > 0);
  const targetMonster = aliveMonsters[0];
  const targetMonsterId = targetMonster ? targetMonster.id : '';

  // 1. 牧師 AI 邏輯
  if (player.heroClass === 'priest') {
    // 優先拯救倒地隊友
    const downedAlly = state.players.find((p) => p.isDowned);
    if (downedAlly) {
      return {
        actorId: player.id,
        actorType: 'player',
        actorName: player.name,
        skillId: 'quick_heal',
        skillName: '快速治療',
        targetId: downedAlly.id,
      };
    }
    // 檢查是否有殘血隊友 (< 50% HP)
    const woundedAlly = state.players.find((p) => !p.isDowned && p.stats.hp / p.stats.maxHp < 0.55);
    if (woundedAlly) {
      return {
        actorId: player.id,
        actorType: 'player',
        actorName: player.name,
        skillId: 'quick_heal',
        skillName: '快速治療',
        targetId: woundedAlly.id,
      };
    }
    // 連攜未發動時，施放聖光祝福為全隊鋪路
    if (!state.comboActive) {
      return {
        actorId: player.id,
        actorType: 'player',
        actorName: player.name,
        skillId: 'holy_blessing',
        skillName: '聖光祝福',
        targetId: player.id,
      };
    }
    // 否則神聖懲戒
    return {
      actorId: player.id,
      actorType: 'player',
      actorName: player.name,
      skillId: 'smite',
      skillName: '神聖懲戒',
      targetId: targetMonsterId,
    };
  }

  // 2. 狂戰士 AI 邏輯
  if (player.heroClass === 'berserker') {
    // 怪物血量低於 35% 或 連攜點亮時，使用處決
    if (targetMonster && (targetMonster.stats.hp / targetMonster.stats.maxHp < 0.35 || state.comboActive)) {
      return {
        actorId: player.id,
        actorType: 'player',
        actorName: player.name,
        skillId: 'execute',
        skillName: '絕殺處決',
        targetId: targetMonsterId,
      };
    }
    // 怪物未被破甲 -> 破甲怒斬
    const hasArmorBreak = targetMonster?.statusEffects.some((s) => s.isArmorBreak);
    if (!hasArmorBreak) {
      return {
        actorId: player.id,
        actorType: 'player',
        actorName: player.name,
        skillId: 'armor_break',
        skillName: '破甲怒斬',
        targetId: targetMonsterId,
      };
    }
    return {
      actorId: player.id,
      actorType: 'player',
      actorName: player.name,
      skillId: 'slash',
      skillName: '狂暴重劈',
      targetId: targetMonsterId,
    };
  }

  // 3. 守護者 AI 邏輯
  if (player.heroClass === 'guardian') {
    // 怪物未被嘲諷 -> 嘲諷
    if (targetMonster && !targetMonster.tauntedById) {
      return {
        actorId: player.id,
        actorType: 'player',
        actorName: player.name,
        skillId: 'taunt',
        skillName: '戰吼嘲諷',
        targetId: targetMonsterId,
      };
    }
    // 全體護盾
    const totalShield = state.players.reduce((acc, p) => acc + p.stats.shield, 0);
    if (totalShield < 100) {
      return {
        actorId: player.id,
        actorType: 'player',
        actorName: player.name,
        skillId: 'shield_wall',
        skillName: '聖盾守護',
        targetId: player.id,
      };
    }
    return {
      actorId: player.id,
      actorType: 'player',
      actorName: player.name,
      skillId: 'shield_bash',
      skillName: '重裝盾擊',
      targetId: targetMonsterId,
    };
  }

  // 預設普攻
  return {
    actorId: player.id,
    actorType: 'player',
    actorName: player.name,
    skillId: 'heavy_slash',
    skillName: '普通打擊',
    targetId: targetMonsterId,
  };
}

/**
 * 權威回合結算邏輯 (Host Authoritative Turn Resolver)
 */
export function resolveBattleTurn(
  currentState: BattleState,
  playerActions: ActionChoice[]
): { actionSteps: ActionStep[]; finalState: BattleState } {
  // 深拷貝當前狀態
  const state: BattleState = JSON.parse(JSON.stringify(currentState));
  const steps: ActionStep[] = [];

  // 1. 為怪物生成意圖
  const monsterActions: ActionChoice[] = [];
  for (const monster of state.monsters) {
    if (monster.stats.hp <= 0) continue;
    const skill = monster.skills[Math.floor(Math.random() * monster.skills.length)];

    // 若被嘲諷，鎖定嘲諷者；否則隨機選未倒地隊友
    let targetHero: Player | undefined;
    if (monster.tauntedById) {
      targetHero = state.players.find((p) => p.id === monster.tauntedById && !p.isDowned);
    }
    if (!targetHero) {
      const aliveHeroes = state.players.filter((p) => !p.isDowned);
      targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
    }

    if (targetHero) {
      monsterActions.push({
        actorId: monster.id,
        actorType: 'monster',
        actorName: monster.name,
        skillId: skill.name,
        skillName: skill.name,
        targetId: skill.targetType === 'all_heroes' ? 'all' : targetHero.id,
      });
    }
  }

  // 2. 建立所有行動者序列，依 Speed 降序排序
  interface QueueItem {
    choice: ActionChoice;
    speed: number;
  }

  const queue: QueueItem[] = [];

  for (const choice of playerActions) {
    const hero = state.players.find((p) => p.id === choice.actorId);
    if (hero && !hero.isDowned) {
      queue.push({ choice, speed: hero.stats.spd });
    }
  }

  for (const choice of monsterActions) {
    const monster = state.monsters.find((m) => m.id === choice.actorId);
    if (monster && monster.stats.hp > 0) {
      queue.push({ choice, speed: monster.stats.spd });
    }
  }

  queue.sort((a, b) => b.speed - a.speed);

  // 3. 逐一結算行動
  for (const item of queue) {
    const choice = item.choice;

    if (choice.actorType === 'player') {
      const hero = state.players.find((p) => p.id === choice.actorId);
      if (!hero || hero.isDowned) continue;

      let targetMonster = state.monsters.find((m) => m.id === choice.targetId && m.stats.hp > 0);
      // 若原怪物已被打倒，自動重選下一個活著的怪
      if (!targetMonster && choice.targetId !== 'all') {
        targetMonster = state.monsters.find((m) => m.stats.hp > 0);
      }

      // --- 狂戰士技能結算 ---
      if (choice.skillId === 'armor_break') {
        if (!targetMonster) continue;
        const baseDmg = Math.max(10, hero.stats.atk * 1.2 - targetMonster.stats.def * 0.5);
        const actualDmg = Math.round(baseDmg);
        applyDamageToMonster(targetMonster, actualDmg);

        // 破甲 Debuff & 點亮連攜
        targetMonster.statusEffects.push({
          id: 'armor_break',
          name: '破甲狀態',
          type: 'debuff',
          description: '防禦力降低 30%',
          duration: 2,
          icon: 'ShieldOff',
          isArmorBreak: true,
        });
        state.comboActive = true;
        state.comboSource = hero.name;

        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: targetMonster.id,
          targetName: targetMonster.name,
          damage: actualDmg,
          isComboTriggered: true,
          logMessage: `${hero.name} 施放【${choice.skillName}】，撕裂 ${targetMonster.name} 造成 ${actualDmg} 傷害！(防禦降低 30%，觸發金色連攜！)`,
          targetDefeated: targetMonster.stats.hp <= 0,
        });
      } else if (choice.skillId === 'execute') {
        if (!targetMonster) continue;
        const isLowHp = targetMonster.stats.hp / targetMonster.stats.maxHp <= 0.35;
        const isCrit = isLowHp || state.comboActive;
        const critMultiplier = isCrit ? 2.2 : 1.2;
        const actualDmg = Math.round(hero.stats.atk * critMultiplier);
        applyDamageToMonster(targetMonster, actualDmg);

        // 消耗連攜
        state.comboActive = false;

        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: targetMonster.id,
          targetName: targetMonster.name,
          damage: actualDmg,
          isCrit,
          isComboTriggered: isCrit,
          logMessage: `${hero.name} 怒喝發動【${choice.skillName}】！${isCrit ? '💥 暴擊斬殺！' : ''} 造成 ${actualDmg} 點致命巨額傷害！`,
          targetDefeated: targetMonster.stats.hp <= 0,
        });
      } else if (choice.skillId === 'whirlwind') {
        for (const mon of state.monsters) {
          if (mon.stats.hp <= 0) continue;
          const dmg = Math.round(hero.stats.atk * 0.85);
          applyDamageToMonster(mon, dmg);
          steps.push({
            actorId: hero.id,
            actorName: hero.name,
            actorType: 'player',
            skillId: choice.skillId,
            skillName: choice.skillName,
            targetId: mon.id,
            targetName: mon.name,
            damage: dmg,
            logMessage: `${hero.name} 旋風橫掃劈中 ${mon.name}，造成 ${dmg} 點物理群傷！`,
            targetDefeated: mon.stats.hp <= 0,
          });
        }
      } else if (choice.skillId === 'slash' || choice.skillId === 'heavy_slash') {
        if (!targetMonster) continue;
        const actualDmg = Math.round(hero.stats.atk);
        applyDamageToMonster(targetMonster, actualDmg);
        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: targetMonster.id,
          targetName: targetMonster.name,
          damage: actualDmg,
          logMessage: `${hero.name} 揮動武器斬中 ${targetMonster.name}，造成 ${actualDmg} 傷害！`,
          targetDefeated: targetMonster.stats.hp <= 0,
        });
      }

      // --- 守護者技能結算 ---
      else if (choice.skillId === 'taunt') {
        if (!targetMonster) continue;
        targetMonster.tauntedById = hero.id;
        hero.stats.shield += 100;
        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: targetMonster.id,
          targetName: targetMonster.name,
          shield: 100,
          logMessage: `${hero.name} 發出【戰吼嘲諷】，吸引 ${targetMonster.name} 的全部仇恨，並獲得 100 護盾！`,
        });
      } else if (choice.skillId === 'shield_wall') {
        for (const p of state.players) {
          if (!p.isDowned) {
            p.stats.shield += 150;
          }
        }
        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: 'all',
          targetName: '全體隊伍',
          shield: 150,
          logMessage: `${hero.name} 高舉重盾張開【聖盾守護】，全員獲得 150 點吸收護盾！`,
        });
      } else if (choice.skillId === 'shield_bash') {
        if (!targetMonster) continue;
        const actualDmg = Math.round(hero.stats.atk * 0.9);
        applyDamageToMonster(targetMonster, actualDmg);
        targetMonster.stats.atk = Math.max(10, Math.round(targetMonster.stats.atk * 0.8));
        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: targetMonster.id,
          targetName: targetMonster.name,
          damage: actualDmg,
          logMessage: `${hero.name} 以重盾猛擊 ${targetMonster.name}，造成 ${actualDmg} 傷害並使其攻擊力降低 20%！`,
          targetDefeated: targetMonster.stats.hp <= 0,
        });
      }

      // --- 牧師技能結算 ---
      else if (choice.skillId === 'quick_heal') {
        let targetAlly = state.players.find((p) => p.id === choice.targetId);
        if (!targetAlly) {
          targetAlly = state.players.find((p) => p.isDowned) || state.players[0];
        }
        if (targetAlly) {
          const wasDowned = targetAlly.isDowned;
          targetAlly.isDowned = false;
          const healAmount = 140;
          targetAlly.stats.hp = Math.min(targetAlly.stats.maxHp, targetAlly.stats.hp + healAmount);
          steps.push({
            actorId: hero.id,
            actorName: hero.name,
            actorType: 'player',
            skillId: choice.skillId,
            skillName: choice.skillName,
            targetId: targetAlly.id,
            targetName: targetAlly.name,
            heal: healAmount,
            logMessage: wasDowned
              ? `${hero.name} 施放【${choice.skillName}】，奇蹟般將倒地的 ${targetAlly.name} 復活拉起（恢復 ${healAmount} HP）！`
              : `${hero.name} 施放【${choice.skillName}】，溫暖聖光為 ${targetAlly.name} 恢復 ${healAmount} HP！`,
          });
        }
      } else if (choice.skillId === 'holy_blessing') {
        state.comboActive = true;
        state.comboSource = hero.name;
        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: 'all',
          targetName: '全體隊友',
          isComboTriggered: true,
          logMessage: `${hero.name} 吟唱【${choice.skillName}】，神聖光輝籠罩全隊！下一擊必定暴擊並觸發金色連攜！`,
        });
      } else if (choice.skillId === 'group_heal') {
        const healAmt = 80;
        for (const p of state.players) {
          if (!p.isDowned) {
            p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + healAmt);
          }
        }
        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: 'all',
          targetName: '全體隊友',
          heal: healAmt,
          logMessage: `${hero.name} 展開【群體庇護】，甘霖滋潤全員恢復 ${healAmt} HP！`,
        });
      } else if (choice.skillId === 'smite') {
        if (!targetMonster) continue;
        const actualDmg = Math.round(hero.stats.atk * 1.1);
        applyDamageToMonster(targetMonster, actualDmg);
        steps.push({
          actorId: hero.id,
          actorName: hero.name,
          actorType: 'player',
          skillId: choice.skillId,
          skillName: choice.skillName,
          targetId: targetMonster.id,
          targetName: targetMonster.name,
          damage: actualDmg,
          logMessage: `${hero.name} 召喚審判聖光懲戒 ${targetMonster.name}，造成 ${actualDmg} 點神聖魔法傷害！`,
          targetDefeated: targetMonster.stats.hp <= 0,
        });
      }
    } else {
      // 怪物行動結算
      const monster = state.monsters.find((m) => m.id === choice.actorId);
      if (!monster || monster.stats.hp <= 0) continue;

      if (choice.targetId === 'all') {
        // 全體攻擊
        for (const hero of state.players) {
          if (hero.isDowned) continue;
          const dmg = calculateMonsterDamage(monster.stats.atk * 0.7, hero.stats.def);
          const actualDmg = applyDamageToHero(hero, dmg);
          steps.push({
            actorId: monster.id,
            actorName: monster.name,
            actorType: 'monster',
            skillId: choice.skillId,
            skillName: choice.skillName,
            targetId: hero.id,
            targetName: hero.name,
            damage: actualDmg,
            logMessage: `⚠️ ${monster.name} 發動【${choice.skillName}】，狂嘯波及 ${hero.name} 造成 ${actualDmg} 傷害！${hero.isDowned ? '（倒地瀕死！）' : ''}`,
            targetDefeated: hero.isDowned,
          });
        }
      } else {
        // 單體攻擊
        let targetHero = state.players.find((p) => p.id === choice.targetId && !p.isDowned);
        if (!targetHero) {
          targetHero = state.players.find((p) => !p.isDowned);
        }
        if (targetHero) {
          const rawDmg = calculateMonsterDamage(monster.stats.atk, targetHero.stats.def);
          const actualDmg = applyDamageToHero(targetHero, rawDmg);
          steps.push({
            actorId: monster.id,
            actorName: monster.name,
            actorType: 'monster',
            skillId: choice.skillId,
            skillName: choice.skillName,
            targetId: targetHero.id,
            targetName: targetHero.name,
            damage: actualDmg,
            logMessage: `⚠️ ${monster.name} 猛擊 ${targetHero.name}，造成 ${actualDmg} 傷害！${targetHero.isDowned ? '（傷重倒地！）' : ''}`,
            targetDefeated: targetHero.isDowned,
          });
        }
      }

      // 重設怪物嘲諷
      if (monster.tauntedById) {
        monster.tauntedById = undefined;
      }
    }
  }

  // 4. 更新狀態效果計時
  for (const mon of state.monsters) {
    mon.statusEffects = mon.statusEffects
      .map((s) => ({ ...s, duration: s.duration - 1 }))
      .filter((s) => s.duration > 0);
  }

  // 5. 勝利 / 滅團判定
  const allMonstersDead = state.monsters.every((m) => m.stats.hp <= 0);
  const allHeroesDowned = state.players.every((p) => p.isDowned);

  if (allMonstersDead) {
    state.phase = 'victory';
    steps.push({
      actorId: 'system',
      actorName: '系統',
      actorType: 'player',
      skillId: 'victory',
      skillName: '戰鬥勝利',
      targetId: 'all',
      targetName: '全體',
      logMessage: '🎉 戰鬥勝利！所有敵人已被肅清！',
    });
  } else if (allHeroesDowned) {
    state.phase = 'defeat';
    steps.push({
      actorId: 'system',
      actorName: '系統',
      actorType: 'player',
      skillId: 'defeat',
      skillName: '滅團戰敗',
      targetId: 'all',
      targetName: '全體',
      logMessage: '💀 全體隊友倒地... 本次冒險以滅團告終，退回大廳整備！',
    });
  } else {
    state.phase = 'planning';
    state.round += 1;
    // 重設玩家準備狀態
    for (const p of state.players) {
      p.isReady = false;
    }
  }

  return { actionSteps: steps, finalState: state };
}

function applyDamageToMonster(monster: Monster, damage: number) {
  if (monster.stats.shield > 0) {
    if (monster.stats.shield >= damage) {
      monster.stats.shield -= damage;
      return;
    } else {
      damage -= monster.stats.shield;
      monster.stats.shield = 0;
    }
  }
  monster.stats.hp = Math.max(0, monster.stats.hp - damage);
}

function applyDamageToHero(hero: Player, damage: number): number {
  let netDamage = damage;
  if (hero.stats.shield > 0) {
    if (hero.stats.shield >= netDamage) {
      hero.stats.shield -= netDamage;
      return netDamage;
    } else {
      netDamage -= hero.stats.shield;
      hero.stats.shield = 0;
    }
  }
  hero.stats.hp = Math.max(0, hero.stats.hp - netDamage);
  if (hero.stats.hp <= 0) {
    hero.isDowned = true;
  }
  return damage;
}

function calculateMonsterDamage(atk: number, def: number): number {
  return Math.max(8, Math.round(atk * (100 / (100 + def))));
}

/**
 * 寶箱隨機戰利品生成 (Random Affixes)
 */
export function generateRandomLoot(): Equipment {
  const rarities: Rarity[] = ['rare', 'epic', 'legendary'];
  const types: ItemType[] = ['weapon', 'armor', 'accessory'];
  const chosenType = types[Math.floor(Math.random() * types.length)];
  const chosenRarity = rarities[Math.floor(Math.random() * rarities.length)];

  const multiplier = chosenRarity === 'legendary' ? 2.5 : chosenRarity === 'epic' ? 1.8 : 1.3;

  const names: Record<ItemType, string[]> = {
    weapon: ['深淵毀滅者', '光鑄誓約聖劍', '龍骨粉碎巨斧', '星輝救贖神杖', '暗影碎魂匕首'],
    armor: ['泰坦不滅胸甲', '虛空編織輕袍', '巨龍鱗甲', '守護者戰甲'],
    accessory: ['鳳凰重生之羽', '暴擊精準戒指', '狂戰士之顱', '賢者之石吊墜'],
  };

  const pool = names[chosenType];
  const name = pool[Math.floor(Math.random() * pool.length)];

  return {
    id: 'item_' + Math.random().toString(36).substring(2, 9),
    name,
    type: chosenType,
    rarity: chosenRarity,
    description: `散發著 ${chosenRarity.toUpperCase()} 幽光的古代遺物，大幅增強冒險者戰力。`,
    icon: chosenType === 'weapon' ? 'Sword' : chosenType === 'armor' ? 'Shield' : 'Gem',
    hpBonus: Math.round((chosenType === 'armor' ? 60 : 25) * multiplier),
    atkBonus: Math.round((chosenType === 'weapon' ? 24 : 8) * multiplier),
    defBonus: Math.round((chosenType === 'armor' ? 18 : 6) * multiplier),
    spdBonus: Math.round(3 * multiplier),
    critBonus: chosenType === 'accessory' ? 0.12 : undefined,
  };
}

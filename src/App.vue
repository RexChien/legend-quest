<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import confetti from 'canvas-confetti';
import {
  SaveManager,
  BASE_STATS,
  INITIAL_SKILLS,
  INITIAL_EQUIPMENT,
  DEFAULT_AI_SNAPSHOTS,
  ALL_ACHIEVEMENTS,
} from './storage/save';
import { network } from './network/peer';
import {
  createMonsterForNode,
  generateAiAction,
  resolveBattleTurn,
  generateRandomLoot,
  DUNGEON_NODES,
} from './core/battleEngine';
import { SoundManager } from './audio/sound';
import { MusicManager } from './audio/music';
import type {
  BattleState,
  Player,
  HeroClass,
  ActionChoice,
  ActionStep,
  Equipment,
  Achievement,
  P2PMessage,
} from './types';

import LobbyView from './components/LobbyView.vue';
import BattleView from './components/BattleView.vue';
import ToastBanner from './components/ToastBanner.vue';
import AchievementsModal from './components/AchievementsModal.vue';
import EquipmentModal from './components/EquipmentModal.vue';

// 視圖狀態
const gameView = ref<'lobby' | 'battle'>('lobby');
const playerName = ref('傳奇勇者');
const selectedClass = ref<HeroClass>('berserker');
const roomIdInput = ref('');
const myPeerId = ref('');
const isConnecting = ref(false);
const useAiMercenaries = ref(true);

// 存檔資料
const currentSave = ref(SaveManager.load());

// 戰鬥狀態
const battleState = ref<BattleState>({
  round: 1,
  phase: 'planning',
  players: [],
  monsters: [],
  currentNodeIndex: 0,
  actionQueue: [],
  logs: [],
  comboActive: false,
});

// 當前回合操作與演出狀態
const selectedAction = ref<ActionChoice | null>(null);
const isResolving = ref(false);
const activeAttackerId = ref<string | null>(null);
const activeTargetId = ref<string | null>(null);
const floatingDamage = ref<{ text: string; isCrit: boolean } | null>(null);

// 房主收集的所有玩家行動 (key: playerId)
const submittedActionsMap = reactive(new Map<string, ActionChoice>());

// 彈窗狀態
const showAchievements = ref(false);
const inspectingEquipment = ref<Equipment | null>(null);
const unlockedToast = ref<Achievement | null>(null);
const showSaveModal = ref<'export' | 'import' | null>(null);
const base64SaveInput = ref('');
const saveCopySuccess = ref(false);

onMounted(async () => {
  // 載入玩家存檔
  const save = SaveManager.load();
  playerName.value = save.playerName || '傳奇勇者';
  selectedClass.value = save.heroClass || 'berserker';

  // 初始化 P2P Peer
  try {
    const id = await network.initPeer();
    myPeerId.value = id;
  } catch (e) {
    console.warn('PeerJS init failed:', e);
  }

  // 監聽 P2P 訊息廣播
  network.onMessage((msg: P2PMessage, senderId: string) => {
    handleIncomingP2P(msg, senderId);
  });
});

/**
 * 觸發成就解鎖並彈出 Toast + Fanfare
 */
function triggerUnlockAchievement(achievementId: string) {
  const ach = SaveManager.unlockAchievement(achievementId);
  if (ach) {
    unlockedToast.value = ach;
    SoundManager.playAchievement();
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.2 },
      });
    } catch {}
    // 3.8秒後自動隱藏
    setTimeout(() => {
      if (unlockedToast.value?.id === ach.id) {
        unlockedToast.value = null;
      }
    }, 4500);
  }
}

/**
 * 建立當前玩家實例
 */
function createMyPlayer(isHost: boolean): Player {
  const pClass = selectedClass.value;
  const baseStats = BASE_STATS[pClass];
  const save = currentSave.value;

  // 計算已解鎖成就的永久屬性加成
  const unlocked = save.achievements;
  let bonusHp = 0;
  let bonusAtk = 0;
  let bonusDef = 0;
  let bonusSpd = 0;

  for (const achId of unlocked) {
    const ach = ALL_ACHIEVEMENTS.find((a) => a.id === achId);
    if (ach?.statReward) {
      bonusHp += ach.statReward.maxHp || 0;
      bonusAtk += ach.statReward.atk || 0;
      bonusDef += ach.statReward.def || 0;
      bonusSpd += ach.statReward.spd || 0;
    }
  }

  return {
    id: myPeerId.value || 'local_player',
    name: playerName.value || '冒險者',
    heroClass: pClass,
    level: save.level || 1,
    stats: {
      hp: baseStats.hp + bonusHp,
      maxHp: baseStats.maxHp + bonusHp,
      shield: 0,
      atk: baseStats.atk + bonusAtk,
      def: baseStats.def + bonusDef,
      spd: baseStats.spd + bonusSpd,
      critRate: baseStats.critRate,
    },
    skills: [...INITIAL_SKILLS[pClass]],
    equipment: save.equipped || { ...INITIAL_EQUIPMENT[pClass] },
    isDowned: false,
    isReady: false,
    isHost,
    isAI: false,
    statusEffects: [],
  };
}

/**
 * 開始單人遊戲（補齊 2 名 AI 傭兵替身）
 */
function startSoloGame() {
  const myPlayer = createMyPlayer(true);
  network.isHost = true;

  // 選擇另外兩個互補職業作為 AI 傭兵
  const otherClasses: HeroClass[] = (['guardian', 'berserker', 'priest'] as HeroClass[]).filter(
    (c) => c !== myPlayer.heroClass
  );

  const team: Player[] = [myPlayer];

  for (const c of otherClasses) {
    const defaultAi = DEFAULT_AI_SNAPSHOTS.find((m) => m.heroClass === c);
    if (defaultAi) {
      team.push({
        ...defaultAi,
        id: `ai_${c}`,
        stats: { ...BASE_STATS[c] },
        skills: [...INITIAL_SKILLS[c]],
        isDowned: false,
        isReady: true,
      });
    }
  }

  initDungeonBattle(team, 0);
}

/**
 * 房主建立連線房間
 */
async function handleCreateRoom() {
  isConnecting.value = true;
  try {
    const id = await network.createRoom();
    myPeerId.value = id;
    const myPlayer = createMyPlayer(true);

    const team = [myPlayer];
    // 如果開啟 AI 傭兵補位，預設先加一名 AI
    if (useAiMercenaries.value) {
      const companionClass = myPlayer.heroClass === 'guardian' ? 'priest' : 'guardian';
      const aiComp = DEFAULT_AI_SNAPSHOTS.find((m) => m.heroClass === companionClass);
      if (aiComp) {
        team.push({ ...aiComp, stats: { ...BASE_STATS[companionClass] }, isReady: true });
      }
    }

    initDungeonBattle(team, 0);
  } finally {
    isConnecting.value = false;
  }
}

/**
 * 隊友加入連線房間
 */
async function handleJoinRoom() {
  if (!roomIdInput.value) return;
  isConnecting.value = true;
  try {
    const success = await network.joinRoom(roomIdInput.value);
    if (success) {
      const myPlayer = createMyPlayer(false);
      network.broadcast({ type: 'JOIN_REQUEST', player: myPlayer });
    } else {
      alert('無法連線至該房間，請確認房間代碼正確且房主已開房！');
    }
  } finally {
    isConnecting.value = false;
  }
}

/**
 * 初始化地牢戰鬥狀態
 */
function initDungeonBattle(party: Player[], nodeIdx: number) {
  const monsters = createMonsterForNode(nodeIdx);

  battleState.value = {
    round: 1,
    phase: 'planning',
    players: party,
    monsters,
    currentNodeIndex: nodeIdx,
    actionQueue: [],
    logs: [
      {
        id: 'log_' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        text: `⚔️ 隊伍抵達：${DUNGEON_NODES[nodeIdx].title}！全員進入戰備狀態。`,
        type: 'system',
      },
    ],
    comboActive: false,
  };

  selectedAction.value = null;
  submittedActionsMap.clear();
  gameView.value = 'battle';

  // 播放戰鬥音樂
  MusicManager.play(nodeIdx === 4 ? 'boss' : 'battle');
}

/**
 * 處理收到的 P2P 訊息
 */
function handleIncomingP2P(msg: P2PMessage, _senderId: string) {
  // 1. 隊友請求加入（Host 端）
  if (msg.type === 'JOIN_REQUEST' && network.isHost) {
    SaveManager.cacheTeammate(msg.player);

    // 加入隊伍
    const existingIdx = battleState.value.players.findIndex((p) => p.id === msg.player.id);
    if (existingIdx >= 0) {
      battleState.value.players[existingIdx] = msg.player;
    } else {
      // 替換 AI 傭兵或追加
      const aiIdx = battleState.value.players.findIndex((p) => p.isAI);
      if (aiIdx >= 0 && battleState.value.players.length >= 3) {
        battleState.value.players.splice(aiIdx, 1, msg.player);
      } else if (battleState.value.players.length < 3) {
        battleState.value.players.push(msg.player);
      }
    }

    // 回覆隊友
    network.broadcast({
      type: 'SYNC_PARTY',
      players: battleState.value.players,
    });
  }

  // 2. 同步隊伍資料（Client 端）
  else if (msg.type === 'SYNC_PARTY') {
    battleState.value.players = msg.players;
    if (gameView.value !== 'battle') {
      battleState.value.monsters = createMonsterForNode(battleState.value.currentNodeIndex);
      gameView.value = 'battle';
      MusicManager.play('battle');
    }
  }

  // 3. 隊友提交行動（Host 端）
  else if (msg.type === 'SUBMIT_ACTION' && network.isHost) {
    submittedActionsMap.set(msg.action.actorId, msg.action);

    // 更新該隊友 ready 狀態
    const hero = battleState.value.players.find((p) => p.id === msg.action.actorId);
    if (hero) hero.isReady = true;

    checkAndResolveTurn();
  }

  // 4. 回合結算廣播（所有人接收並播放動畫）
  else if (msg.type === 'TURN_RESOLVED') {
    playTurnResolution(msg.actionSteps, msg.finalState);
  }

  // 5. 節點推進同步
  else if (msg.type === 'ADVANCE_NODE') {
    battleState.value.currentNodeIndex = msg.nodeIndex;
    battleState.value = msg.nextBattle;
    selectedAction.value = null;
    submittedActionsMap.clear();
  }
}

/**
 * 玩家點擊巨型決策按鈕選取行動
 */
function handleSelectSkill(skillId: string) {
  const myPlayer = battleState.value.players.find((p) => p.id === myPeerId.value) || battleState.value.players[0];
  if (!myPlayer || myPlayer.isDowned || myPlayer.isReady) return;

  const skill = myPlayer.skills.find((s) => s.id === skillId);
  if (!skill) return;

  SoundManager.playClick();

  const aliveMonsters = battleState.value.monsters.filter((m) => m.stats.hp > 0);
  const targetId = skill.targetType === 'single_ally' ? myPlayer.id : aliveMonsters[0]?.id || '';

  const action: ActionChoice = {
    actorId: myPlayer.id,
    actorType: 'player',
    actorName: myPlayer.name,
    skillId: skill.id,
    skillName: skill.name,
    targetId,
  };

  selectedAction.value = action;
  myPlayer.isReady = true;

  if (network.isHost) {
    submittedActionsMap.set(myPlayer.id, action);
    checkAndResolveTurn();
  } else {
    network.broadcast({ type: 'SUBMIT_ACTION', action });
  }
}

/**
 * 檢查是否全員皆已鎖定出招，若齊備則 Host 執行回合結算
 */
function checkAndResolveTurn() {
  if (!network.isHost || isResolving.value) return;

  // 檢查所有非 AI 且未倒地的真人隊友是否皆已 ready
  const activeHumanPlayers = battleState.value.players.filter((p) => !p.isAI && !p.isDowned);
  const allHumansReady = activeHumanPlayers.every((p) => submittedActionsMap.has(p.id));

  if (!allHumansReady) return;

  // 為所有未倒地的 AI 傭兵生成決策
  const aiPlayers = battleState.value.players.filter((p) => p.isAI && !p.isDowned);
  for (const ai of aiPlayers) {
    const aiChoice = generateAiAction(ai, battleState.value);
    submittedActionsMap.set(ai.id, aiChoice);
  }

  // 收集所有行動清單
  const allActions = Array.from(submittedActionsMap.values());

  // 呼叫權威結算機
  const { actionSteps, finalState } = resolveBattleTurn(battleState.value, allActions);

  // 廣播給全房間隊友
  network.broadcast({
    type: 'TURN_RESOLVED',
    actionSteps,
    finalState,
  });

  // Host 本地播放演出
  playTurnResolution(actionSteps, finalState);
}

/**
 * 依序逐一播放行動序列演出動畫 (0.7 秒間隔)
 */
async function playTurnResolution(steps: ActionStep[], finalState: BattleState) {
  isResolving.value = true;

  for (const step of steps) {
    activeAttackerId.value = step.actorId;

    // 出招打擊音效
    if (step.skillId === 'armor_break') {
      SoundManager.playAttack();
    } else if (step.skillId === 'execute') {
      SoundManager.playCriticalHit();
    } else if (step.skillId === 'quick_heal' || step.skillId === 'group_heal') {
      SoundManager.playHeal();
    } else if (step.skillId === 'taunt' || step.skillId === 'shield_wall') {
      SoundManager.playShield();
    } else if (step.isComboTriggered) {
      SoundManager.playCombo();
    } else {
      SoundManager.playAttack();
    }

    // 延遲 260ms 展現受擊回饋與飄浮數字
    await new Promise((r) => setTimeout(r, 260));

    activeTargetId.value = step.targetId;

    if (step.damage) {
      floatingDamage.value = {
        text: `-${step.damage}`,
        isCrit: !!step.isCrit,
      };
      if (step.actorType === 'player') {
        SoundManager.playMonsterHit();
      }
    } else if (step.heal) {
      floatingDamage.value = {
        text: `+${step.heal}`,
        isCrit: false,
      };
    } else if (step.shield) {
      floatingDamage.value = {
        text: `🛡️ +${step.shield}`,
        isCrit: false,
      };
    }

    // 新增日誌
    battleState.value.logs.push({
      id: 'log_' + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      text: step.logMessage,
      type: step.isComboTriggered
        ? 'combo'
        : step.heal
        ? 'heal'
        : step.shield
        ? 'shield'
        : step.targetDefeated
        ? 'downed'
        : 'damage',
    });

    // 成就判定
    if (step.targetDefeated && step.actorType === 'player') {
      triggerUnlockAchievement('first_blood');
    }
    if (step.isComboTriggered && step.isCrit) {
      triggerUnlockAchievement('combo_master');
    }

    // 演出等待間隔
    await new Promise((r) => setTimeout(r, 550));

    // 清除單步動畫標記
    activeAttackerId.value = null;
    activeTargetId.value = null;
    floatingDamage.value = null;
  }

  // 套用結算後的最終狀態
  battleState.value = finalState;
  selectedAction.value = null;
  submittedActionsMap.clear();
  isResolving.value = false;

  // 結算勝負
  if (finalState.phase === 'victory') {
    MusicManager.play('victory');
    SoundManager.playAchievement();
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } catch {}

    // 如果打敗深淵骸骨巨龍
    if (finalState.currentNodeIndex === 4) {
      triggerUnlockAchievement('downed_clutch');
    }
  } else if (finalState.phase === 'defeat') {
    MusicManager.stop();
    SoundManager.playDefeat();
  }
}

/**
 * 營火休息（恢復全員 45% 最大生命值）
 */
function handleCampfireRest() {
  SoundManager.playHeal();
  for (const hero of battleState.value.players) {
    const healAmt = Math.round(hero.stats.maxHp * 0.45);
    hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + healAmt);
    hero.isDowned = false;
  }
  battleState.value.logs.push({
    id: 'log_' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    text: '🔥 全員圍坐在營火旁烤火整備，生命值恢復 45%！',
    type: 'heal',
  });
}

/**
 * 開啟符文寶箱（全員獲得裝備）
 */
function handleOpenChest() {
  SoundManager.playLoot();
  for (const hero of battleState.value.players) {
    const loot = generateRandomLoot();
    hero.equipment[loot.type] = loot;
    hero.stats.atk += loot.atkBonus;
    hero.stats.def += loot.defBonus;
    hero.stats.hp += loot.hpBonus;
    hero.stats.maxHp += loot.hpBonus;

    if (hero.id === myPeerId.value) {
      inspectingEquipment.value = loot;
    }
  }
  triggerUnlockAchievement('gear_collector');
  battleState.value.logs.push({
    id: 'log_' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    text: '✨ 符文寶箱開啟！全員獲得了強大的遠古遺物裝備，戰力大幅提升！',
    type: 'combo',
  });
}

/**
 * 前進至下一地牢節點
 */
function handleAdvanceNode() {
  if (!network.isHost) return;
  const nextIdx = battleState.value.currentNodeIndex + 1;
  if (nextIdx < DUNGEON_NODES.length) {
    initDungeonBattle(battleState.value.players, nextIdx);
    network.broadcast({
      type: 'ADVANCE_NODE',
      nodeIndex: nextIdx,
      nextBattle: battleState.value,
    });
  } else {
    alert('🎉 恭喜通關所有地牢節點，取得冒險勝利！');
    gameView.value = 'lobby';
    MusicManager.play('lobby');
  }
}

/**
 * 退出戰鬥返回大廳
 */
function handleLeaveGame() {
  SoundManager.playClick();
  MusicManager.play('lobby');
  gameView.value = 'lobby';
}

/**
 * 匯出存檔 Base64
 */
function handleExportSave() {
  base64SaveInput.value = SaveManager.exportBase64();
  showSaveModal.value = 'export';
  saveCopySuccess.value = false;
}

function copyExportCode() {
  navigator.clipboard.writeText(base64SaveInput.value);
  saveCopySuccess.value = true;
  SoundManager.playClick();
  setTimeout(() => (saveCopySuccess.value = false), 2000);
}

/**
 * 匯入還原存檔 Base64
 */
function handleImportSave() {
  base64SaveInput.value = '';
  showSaveModal.value = 'import';
}

function submitImportSave() {
  const imported = SaveManager.importBase64(base64SaveInput.value);
  if (imported) {
    currentSave.value = imported;
    playerName.value = imported.playerName;
    selectedClass.value = imported.heroClass;
    showSaveModal.value = null;
    SoundManager.playAchievement();
    alert('✅ 存檔還原成功！');
  } else {
    alert('❌ 存檔代碼格式無效，請檢查！');
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-between font-sans selection:bg-yellow-500 selection:text-black">
    <!-- 成就解鎖頂部橫幅 -->
    <ToastBanner :achievement="unlockedToast" @close="unlockedToast = null" />

    <!-- 視圖切換：大廳 / 戰鬥 -->
    <main class="w-full max-w-5xl flex-1 flex flex-col justify-center my-auto">
      <LobbyView
        v-if="gameView === 'lobby'"
        :player-name="playerName"
        :selected-class="selectedClass"
        :room-id-input="roomIdInput"
        :my-peer-id="myPeerId"
        :is-connecting="isConnecting"
        :use-ai-mercenaries="useAiMercenaries"
        :unlocked-achievements-count="currentSave.achievements.length"
        @update:player-name="playerName = $event"
        @update:selected-class="selectedClass = $event"
        @update:room-id-input="roomIdInput = $event"
        @update:use-ai-mercenaries="useAiMercenaries = $event"
        @start-solo-game="startSoloGame"
        @create-room="handleCreateRoom"
        @join-room="handleJoinRoom"
        @open-achievements="showAchievements = true"
        @export-save="handleExportSave"
        @import-save="handleImportSave"
      />

      <BattleView
        v-else
        :battle-state="battleState"
        :current-player-id="myPeerId"
        :is-host="network.isHost"
        :selected-action="selectedAction"
        :is-resolving="isResolving"
        :active-attacker-id="activeAttackerId"
        :active-target-id="activeTargetId"
        :floating-damage="floatingDamage"
        @select-action="handleSelectSkill"
        @advance-node="handleAdvanceNode"
        @rest-campfire="handleCampfireRest"
        @open-chest="handleOpenChest"
        @inspect-equipment="inspectingEquipment = $event"
        @leave-game="handleLeaveGame"
        @open-achievements="showAchievements = true"
      />
    </main>

    <!-- 底部版權宣告與 GitHub Pages 零後端狀態指示 -->
    <footer class="w-full max-w-5xl text-center py-4 text-xs text-slate-500 border-t border-slate-900 mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>
        <span>Legend Quest: Serverless P2P Board-Game RPG</span>
        <span class="mx-1.5">•</span>
        <span class="text-amber-400/80">純前端靜態部署 100% 零後端零帳單</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
        <span>WebRTC P2P (PeerJS) Ready</span>
      </div>
    </footer>

    <!-- 成就貼紙簿彈窗 -->
    <AchievementsModal
      v-if="showAchievements"
      :unlocked-ids="currentSave.achievements"
      @close="showAchievements = false"
    />

    <!-- 裝備檢視彈窗 -->
    <EquipmentModal
      :equipment="inspectingEquipment"
      @close="inspectingEquipment = null"
    />

    <!-- 存檔代碼 Base64 匯出/還原彈窗 -->
    <div v-if="showSaveModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl">
        <h3 class="text-lg font-black text-yellow-300 mb-2">
          {{ showSaveModal === 'export' ? '📋 複製個人存檔代碼 (Base64)' : '📥 貼上還原存檔' }}
        </h3>
        <p class="text-xs text-slate-400 mb-3">
          {{ showSaveModal === 'export' ? '存檔包含您的角色等級、裝備與榮耀貼紙簿進度，可隨時備份：' : '請貼上先前複製的 Base64 存檔字串，將立即復原進度：' }}
        </p>

        <textarea
          v-model="base64SaveInput"
          rows="5"
          class="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-yellow-400"
          :placeholder="showSaveModal === 'export' ? '' : '在此貼上存檔代碼...'"
          :readonly="showSaveModal === 'export'"
        />

        <div class="flex items-center justify-end gap-2 mt-4">
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-700"
            @click="showSaveModal = null"
          >
            關閉
          </button>

          <button
            v-if="showSaveModal === 'export'"
            type="button"
            class="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black cursor-pointer shadow"
            @click="copyExportCode"
          >
            {{ saveCopySuccess ? '✅ 已複製到剪貼簿' : '一鍵複製代碼' }}
          </button>

          <button
            v-else
            type="button"
            class="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 text-xs font-black cursor-pointer shadow"
            @click="submitImportSave"
          >
            確認還原存檔
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

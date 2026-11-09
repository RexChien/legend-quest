<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Volume2,
  VolumeX,
  Music,
  LogOut,
  Sparkles,
  Trophy,
  ChevronRight,
  Flame,
  Gem,
  Check,
} from 'lucide-vue-next';
import type { BattleState, ActionChoice, Equipment } from '../types';
import BigActionButton from './BigActionButton.vue';
import TeammateCard from './TeammateCard.vue';
import MonsterCard from './MonsterCard.vue';
import DungeonMapView from './DungeonMapView.vue';
import { SoundManager } from '../audio/sound';
import { MusicManager } from '../audio/music';
import { DUNGEON_NODES } from '../core/battleEngine';

const props = defineProps<{
  battleState: BattleState;
  currentPlayerId: string;
  isHost: boolean;
  selectedAction: ActionChoice | null;
  isResolving: boolean;
  activeAttackerId: string | null;
  activeTargetId: string | null;
  floatingDamage: { text: string; isCrit: boolean } | null;
}>();

const emit = defineEmits<{
  (e: 'select-action', skillId: string): void;
  (e: 'advance-node'): void;
  (e: 'rest-campfire'): void;
  (e: 'open-chest'): void;
  (e: 'inspect-equipment', item: Equipment): void;
  (e: 'leave-game'): void;
  (e: 'open-achievements'): void;
}>();

const isMuted = ref(!SoundManager.enabled);
const isMusicOn = ref(MusicManager.isPlaying);

const currentPlayer = computed(() => {
  return props.battleState.players.find((p) => p.id === props.currentPlayerId) || props.battleState.players[0];
});

const currentMonster = computed(() => {
  return props.battleState.monsters[0] || null;
});

const isCurrentPlayerDowned = computed(() => {
  return currentPlayer.value?.isDowned || false;
});

const isReady = computed(() => {
  return currentPlayer.value?.isReady || false;
});

const currentNode = computed(() => {
  return DUNGEON_NODES[props.battleState.currentNodeIndex] || DUNGEON_NODES[0];
});

const nextNode = computed(() => {
  return DUNGEON_NODES[props.battleState.currentNodeIndex + 1] || null;
});

// 監聽鍵盤 1, 2, 3, 4 與 空白鍵 快捷決策
function handleKeyDown(event: KeyboardEvent) {
  if (currentNode.value.type === 'campfire') {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!props.battleState.campfireUsed) {
        emit('rest-campfire');
      } else {
        emit('advance-node');
      }
    }
    return;
  }

  if (currentNode.value.type === 'chest') {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!props.battleState.chestOpened) {
        emit('open-chest');
      } else {
        emit('advance-node');
      }
    }
    return;
  }

  if (props.battleState.phase === 'victory') {
    if (event.key === 'Enter' || event.key === ' ' || event.key === '1') {
      event.preventDefault();
      emit('advance-node');
    }
    return;
  }

  if (props.isResolving || isCurrentPlayerDowned.value || isReady.value) return;

  const key = event.key;
  if (['1', '2', '3', '4'].includes(key)) {
    const skillIndex = parseInt(key) - 1;
    const skill = currentPlayer.value?.skills[skillIndex];
    if (skill) {
      event.preventDefault();
      emit('select-action', skill.id);
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function toggleAudio() {
  SoundManager.enabled = !SoundManager.enabled;
  isMuted.value = !SoundManager.enabled;
  SoundManager.playClick();
}

function toggleBgm() {
  const playing = MusicManager.toggle('battle');
  isMusicOn.value = playing;
  SoundManager.playClick();
}
</script>

<template>
  <div class="w-full max-w-5xl mx-auto space-y-4">
    <!-- 頂部資訊與控制欄 -->
    <div class="flex items-center justify-between bg-slate-900/90 border-2 border-slate-800 rounded-2xl px-4 py-2.5 shadow-lg">
      <div class="flex items-center gap-3">
        <span class="text-sm font-black text-amber-300 bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-500/40">
          {{ currentNode.type === 'campfire' ? '營火休整' : currentNode.type === 'chest' ? '寶箱秘室' : `回合 ${battleState.round}` }}
        </span>

        <!-- 連攜點亮警示橫幅 -->
        <div
          v-if="battleState.comboActive && (currentNode.type === 'battle' || currentNode.type === 'boss')"
          class="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-yellow-500/30 to-amber-500/20 border border-yellow-400 text-yellow-300 text-xs font-black anim-combo-glow"
        >
          <Sparkles class="w-4 h-4 fill-yellow-400 text-yellow-300" />
          <span>🔥 金色連攜已點燃！下一次技能暴擊率與傷害巨幅躍升！</span>
        </div>
      </div>

      <!-- 影音與選單控制 -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="p-2 rounded-xl border transition cursor-pointer text-xs flex items-center gap-1"
          :class="isMusicOn ? 'bg-amber-500/20 border-yellow-400 text-yellow-300' : 'bg-slate-800 border-slate-700 text-slate-400'"
          title="切換 BGM 背景音樂"
          @click="toggleBgm"
        >
          <Music class="w-4 h-4" />
          <span class="hidden sm:inline font-bold">BGM</span>
        </button>

        <button
          type="button"
          class="p-2 rounded-xl border transition cursor-pointer text-xs flex items-center gap-1"
          :class="!isMuted ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-red-950/40 border-red-800 text-red-400'"
          title="音效開關"
          @click="toggleAudio"
        >
          <Volume2 v-if="!isMuted" class="w-4 h-4" />
          <VolumeX v-else class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-slate-700 transition cursor-pointer text-xs flex items-center gap-1"
          title="桌遊榮耀貼紙簿"
          @click="$emit('open-achievements')"
        >
          <Trophy class="w-4 h-4" />
        </button>

        <button
          type="button"
          class="p-2 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition cursor-pointer text-xs flex items-center gap-1"
          title="退出冒險返回大廳"
          @click="$emit('leave-game')"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- 地牢節點推進地圖 -->
    <DungeonMapView
      :current-node-index="battleState.currentNodeIndex"
      :is-host="isHost"
      :battle-phase="battleState.phase"
      @advance-node="$emit('advance-node')"
    />

    <!-- 主舞台：隊伍卡片 + (怪物 / 營火 / 寶箱) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
      <!-- 隊伍三人卡片 (7 欄寬) -->
      <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TeammateCard
          v-for="hero in battleState.players"
          :key="hero.id"
          :player="hero"
          :is-current-player="hero.id === currentPlayerId"
          :is-attacking="activeAttackerId === hero.id"
          :is-hit="activeTargetId === hero.id"
          @inspect-equipment="(item) => $emit('inspect-equipment', item)"
        />
      </div>

      <!-- 右側區域 (5 欄寬)：依節點展示 怪物、營火、或寶箱 -->
      <div class="lg:col-span-5 flex justify-center w-full">
        <!-- 1. 營火營地專屬卡片 -->
        <div
          v-if="currentNode.type === 'campfire'"
          class="relative w-full max-w-md rounded-3xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/70 via-slate-900/90 to-slate-950 p-6 text-center shadow-2xl shadow-amber-500/20"
        >
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-3">
            <Flame class="w-4 h-4 fill-amber-400 text-amber-300 animate-pulse" />
            <span>幽暗營火庇護所（非戰鬥區）</span>
          </div>

          <h3 class="text-2xl font-black text-amber-100 mb-2">微光營地休整</h3>
          <p class="text-xs text-amber-200/80 mb-4 leading-relaxed">
            燃燒的篝火驅散了寒氣與恐懼。全隊可在火堆旁烤火療傷一次，全員恢復 45% 最大生命值。
          </p>

          <!-- 營火大圖示 -->
          <div class="w-28 h-28 mx-auto my-3 rounded-full bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-2 border-amber-400/60 flex items-center justify-center shadow-inner">
            <Flame class="w-16 h-16 text-amber-400 fill-amber-500/80 animate-bounce" />
          </div>

          <!-- 烤火狀態按鈕 -->
          <div class="mt-4">
            <button
              v-if="!battleState.campfireUsed"
              type="button"
              class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm cursor-pointer shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 transition active:scale-95"
              @click="emit('rest-campfire')"
            >
              <Flame class="w-4 h-4 fill-slate-950" />
              <span>點燃篝火：全員恢復 45% HP（限一次）</span>
            </button>
            <div
              v-else
              class="py-3 px-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Check class="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>全員已完成烤火修整，活力充沛！</span>
            </div>
          </div>
        </div>

        <!-- 2. 符文寶箱專屬卡片 -->
        <div
          v-else-if="currentNode.type === 'chest'"
          class="relative w-full max-w-md rounded-3xl border-2 border-yellow-400/80 bg-gradient-to-b from-amber-950/60 via-slate-900/90 to-slate-950 p-6 text-center shadow-2xl shadow-yellow-500/20"
        >
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-xs font-bold mb-3">
            <Sparkles class="w-4 h-4 fill-yellow-400 text-yellow-300" />
            <span>遠古秘寶石室（無怪物威脅）</span>
          </div>

          <h3 class="text-2xl font-black text-yellow-100 mb-2">遠古符文寶箱</h3>
          <p class="text-xs text-yellow-200/80 mb-4 leading-relaxed">
            石室中央散發著幽微金光的古代秘寶箱。開啟將為全體隊友各獲得一件稀有/史詩級裝備！
          </p>

          <!-- 寶箱大圖示 -->
          <div class="w-28 h-28 mx-auto my-3 rounded-full bg-gradient-to-b from-yellow-500/20 to-amber-500/10 border-2 border-yellow-400/60 flex items-center justify-center shadow-inner anim-combo-glow">
            <Gem class="w-16 h-16 text-yellow-300" />
          </div>

          <!-- 開箱狀態按鈕 -->
          <div class="mt-4">
            <button
              v-if="!battleState.chestOpened"
              type="button"
              class="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm cursor-pointer shadow-xl shadow-yellow-500/30 flex items-center justify-center gap-2 transition active:scale-95 animate-pulse"
              @click="emit('open-chest')"
            >
              <Sparkles class="w-4 h-4 fill-slate-950" />
              <span>開啟遠古寶箱：全員領取神裝（限開一次）</span>
            </button>
            <div
              v-else
              class="py-3 px-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Check class="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>寶箱已開啟！全員已換上古代神裝！</span>
            </div>
          </div>
        </div>

        <!-- 3. 戰鬥節點：怪物卡片 -->
        <MonsterCard
          v-else-if="currentMonster"
          :monster="currentMonster"
          :is-attacking="activeAttackerId === currentMonster.id"
          :is-hit="activeTargetId === currentMonster.id"
          :floating-damage="activeTargetId === currentMonster.id ? floatingDamage : null"
        />
      </div>
    </div>

    <!-- 戰況即時日誌視窗 -->
    <div class="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shadow-inner text-xs font-mono max-h-24 overflow-y-auto space-y-1">
      <div v-if="battleState.logs.length === 0" class="text-slate-500 italic">
        等待全員出招... 請在下方巨型按鈕點擊行動（支援快捷鍵 1~4）
      </div>
      <div
        v-for="log in battleState.logs.slice(-5)"
        :key="log.id"
        class="leading-tight transition-all"
        :class="[
          log.type === 'combo' ? 'text-yellow-300 font-bold' :
          log.type === 'damage' ? 'text-rose-300' :
          log.type === 'heal' ? 'text-emerald-300' :
          log.type === 'shield' ? 'text-cyan-300' :
          'text-slate-300'
        ]"
      >
        <span class="text-slate-600 mr-2">[{{ log.timestamp }}]</span>
        <span>{{ log.text }}</span>
      </div>
    </div>

    <!-- 巨型決策操作按鈕甲板 (Accessibility-First) -->

    <!-- 1. 營火專屬行動甲板 -->
    <div
      v-if="currentNode.type === 'campfire'"
      class="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/80 rounded-3xl p-5 shadow-2xl"
    >
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="text-left">
          <h4 class="text-base font-black text-amber-200 flex items-center gap-2">
            <Flame class="w-5 h-5 fill-amber-400 text-amber-300" />
            營火營地休整：此地無怪物，享受安歇時光
          </h4>
          <p class="text-xs text-slate-300 mt-0.5">
            {{ battleState.campfireUsed ? '全員生命值已回復，請點擊右方按鈕啟程。' : '點擊上方營火按鈕可為全員恢復 45% 生命值。' }}
          </p>
        </div>

        <button
          type="button"
          class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm cursor-pointer shadow-lg shadow-amber-500/25 flex items-center gap-2 transition active:scale-95 ml-auto"
          @click="emit('advance-node')"
        >
          <span>整備就緒，出發前往下一站：{{ nextNode?.title }}</span>
          <ChevronRight class="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>

    <!-- 2. 寶箱專屬行動甲板 -->
    <div
      v-else-if="currentNode.type === 'chest'"
      class="bg-gradient-to-r from-yellow-950/90 via-slate-900 to-yellow-950/90 border-2 border-yellow-400/80 rounded-3xl p-5 shadow-2xl"
    >
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="text-left">
          <h4 class="text-base font-black text-yellow-200 flex items-center gap-2">
            <Gem class="w-5 h-5 text-yellow-300" />
            秘寶石室：安全無威脅，點擊上方寶箱領取神裝
          </h4>
          <p class="text-xs text-slate-300 mt-0.5">
            {{ battleState.chestOpened ? '全體隊員已完成裝備更新，請點擊右方按鈕前往下一節點。' : '請先點擊上方寶箱開啟領取神裝（限開一次）！' }}
          </p>
        </div>

        <button
          type="button"
          class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm cursor-pointer shadow-lg shadow-yellow-500/25 flex items-center gap-2 transition active:scale-95 ml-auto"
          @click="emit('advance-node')"
        >
          <span>收好神裝，啟程前往下一節點：{{ nextNode?.title }}</span>
          <ChevronRight class="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    </div>

    <!-- 3. 戰鬥大獲全勝甲板 -->
    <div
      v-else-if="battleState.phase === 'victory'"
      class="bg-gradient-to-r from-amber-950/90 via-yellow-900/90 to-amber-950/90 border-2 border-yellow-400 rounded-3xl p-6 text-center shadow-2xl anim-combo-glow"
    >
      <div class="flex items-center justify-center gap-2 mb-2">
        <Sparkles class="w-6 h-6 text-yellow-300 fill-yellow-400" />
        <h3 class="text-2xl font-black text-yellow-100">🎉 戰鬥大獲全勝！敵人已被肅清！</h3>
        <Sparkles class="w-6 h-6 text-yellow-300 fill-yellow-400" />
      </div>
      <p class="text-sm text-yellow-200/90 mb-5">
        全員狀態整備完成。請點擊下方按鈕或按【空白鍵 / Enter】啟程前往下一節點！
      </p>

      <button
        type="button"
        class="w-full max-w-md mx-auto py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-base cursor-pointer shadow-xl shadow-yellow-500/30 flex items-center justify-center gap-3 transition transform hover:scale-102 active:scale-98"
        @click="emit('advance-node')"
      >
        <span v-if="nextNode">啟程前往下一節點：{{ nextNode.title }}</span>
        <span v-else>遠征通關！榮耀回城</span>
        <ChevronRight class="w-6 h-6 stroke-[3]" />
      </button>
    </div>

    <!-- 4. 滅團戰敗甲板 -->
    <div
      v-else-if="battleState.phase === 'defeat'"
      class="bg-slate-950 border-2 border-rose-600 rounded-3xl p-6 text-center shadow-2xl"
    >
      <h3 class="text-2xl font-black text-rose-400 mb-2">💀 全軍覆沒... 本次冒險告終</h3>
      <p class="text-sm text-slate-300 mb-5">全隊體力耗盡倒地，請返回大廳重整旗鼓。</p>
      <button
        type="button"
        class="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base cursor-pointer shadow-lg transition"
        @click="emit('leave-game')"
      >
        返回冒險大廳
      </button>
    </div>

    <!-- 5. 戰鬥決策甲板（回合出招） -->
    <div v-else class="bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-4 md:p-5 shadow-2xl">
      <div class="flex items-center justify-between mb-3 px-1">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" :class="isReady ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'" />
          <h3 class="text-sm font-black text-slate-200">
            {{ isReady ? '✅ 你的行動已鎖定！等待回合結算演出...' : '⚡ 請選擇本回合出招（可直接按鍵盤 1 ~ 4）' }}
          </h3>
        </div>

        <span v-if="isResolving" class="text-xs font-bold text-yellow-300 bg-yellow-950/80 px-2.5 py-1 rounded-full border border-yellow-500/40 animate-pulse">
          ⚔️ 回合結算演出中...
        </span>
      </div>

      <!-- 四個超大決策技能卡片 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <BigActionButton
          v-for="skill in currentPlayer?.skills"
          :key="skill.id"
          :skill="skill"
          :disabled="isResolving || isCurrentPlayerDowned || isReady"
          :is-selected="selectedAction?.skillId === skill.id"
          :is-combo-ready="battleState.comboActive && (skill.requiresCombo || skill.id === 'execute')"
          @click="emit('select-action', skill.id)"
        />
      </div>
    </div>
  </div>
</template>

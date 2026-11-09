<script setup lang="ts">
import { ref } from 'vue';
import {
  Shield,
  Axe,
  HeartHandshake,
  Users,
  Play,
  Trophy,
  Copy,
  Download,
  Share2,
  Check,
  Bot,
} from 'lucide-vue-next';
import type { HeroClass } from '../types';
import { SoundManager } from '../audio/sound';

const props = defineProps<{
  playerName: string;
  selectedClass: HeroClass;
  roomIdInput: string;
  myPeerId: string;
  isConnecting: boolean;
  useAiMercenaries: boolean;
  unlockedAchievementsCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:playerName', name: string): void;
  (e: 'update:selectedClass', heroClass: HeroClass): void;
  (e: 'update:roomIdInput', id: string): void;
  (e: 'update:useAiMercenaries', val: boolean): void;
  (e: 'create-room'): void;
  (e: 'join-room'): void;
  (e: 'start-solo-game'): void;
  (e: 'open-achievements'): void;
  (e: 'export-save'): void;
  (e: 'import-save'): void;
}>();

const copiedRoomId = ref(false);

function handleClassSelect(c: HeroClass) {
  SoundManager.playClick();
  emit('update:selectedClass', c);
}

function copyRoomId() {
  if (!props.myPeerId) return;
  SoundManager.playClick();
  navigator.clipboard.writeText(props.myPeerId);
  copiedRoomId.value = true;
  setTimeout(() => {
    copiedRoomId.value = false;
  }, 2000);
}
</script>

<template>
  <div class="w-full max-w-4xl mx-auto space-y-6">
    <!-- 主視覺 Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-yellow-500/50 p-6 md:p-8 text-center shadow-2xl">
      <div class="absolute -right-10 -bottom-10 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -left-10 -top-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold mb-3">
        <span>⚔️ 無伺服器 WebRTC P2P 零帳單架構</span>
      </div>
      <h1 class="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 tracking-tight">
        傳奇戰線：地牢遠征
      </h1>
      <p class="text-sm md:text-base text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
        無障礙巨型按鈕、盲選共時回合制、鐵三角連攜合作，支援雙人線上 P2P 組隊或一人召喚替身傭兵出團！
      </p>

      <!-- 快捷存檔與成就工具列 -->
      <div class="flex flex-wrap items-center justify-center gap-3 mt-5 pt-4 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-yellow-300 border border-yellow-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow"
          @click="SoundManager.playClick(); $emit('open-achievements')"
        >
          <Trophy class="w-4 h-4 text-yellow-400" />
          桌遊貼紙簿 (已解鎖 {{ unlockedAchievementsCount }})
        </button>

        <button
          type="button"
          class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
          @click="SoundManager.playClick(); $emit('export-save')"
        >
          <Copy class="w-3.5 h-3.5" />
          複製存檔代碼 (Base64)
        </button>

        <button
          type="button"
          class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
          @click="SoundManager.playClick(); $emit('import-save')"
        >
          <Download class="w-3.5 h-3.5" />
          還原/匯入存檔
        </button>
      </div>
    </div>

    <!-- 冒險者身分配置區 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 角色設定卡片 -->
      <div class="md:col-span-2 bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">冒險者暱稱</label>
          <input
            :value="playerName"
            type="text"
            maxlength="12"
            class="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-2xl text-slate-100 font-bold focus:border-yellow-400 outline-none text-base"
            placeholder="請輸入暱稱..."
            @input="$emit('update:playerName', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">選擇戰鬥職業（鐵三角職能）</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- 守護者 (Tank) -->
            <button
              type="button"
              class="p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between"
              :class="[
                selectedClass === 'guardian'
                  ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-400/30 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400',
              ]"
              @click="handleClassSelect('guardian')"
            >
              <div class="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300 mb-2">
                <Shield class="w-6 h-6" />
              </div>
              <div>
                <h4 class="font-black text-sm text-slate-100">守護者 (Tank)</h4>
                <p class="text-xs text-slate-400 mt-1 leading-snug">高血量與群體護盾，戰吼嘲諷強吸仇恨</p>
              </div>
            </button>

            <!-- 狂戰士 (DPS) -->
            <button
              type="button"
              class="p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between"
              :class="[
                selectedClass === 'berserker'
                  ? 'bg-red-950/60 border-red-400 ring-2 ring-red-400/30 text-white shadow-lg shadow-red-500/20'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400',
              ]"
              @click="handleClassSelect('berserker')"
            >
              <div class="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/50 flex items-center justify-center text-red-300 mb-2">
                <Axe class="w-6 h-6" />
              </div>
              <div>
                <h4 class="font-black text-sm text-slate-100">狂戰士 (DPS)</h4>
                <p class="text-xs text-slate-400 mt-1 leading-snug">破甲斬擊點燃連攜，殘血絕殺暴擊斬殺</p>
              </div>
            </button>

            <!-- 牧師 (Healer) -->
            <button
              type="button"
              class="p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between"
              :class="[
                selectedClass === 'priest'
                  ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/30 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400',
              ]"
              @click="handleClassSelect('priest')"
            >
              <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mb-2">
                <HeartHandshake class="w-6 h-6" />
              </div>
              <div>
                <h4 class="font-black text-sm text-slate-100">牧師 (Support)</h4>
                <p class="text-xs text-slate-400 mt-1 leading-snug">及時拉起倒地隊友，全隊暴擊聖光祝福</p>
              </div>
            </button>
          </div>
        </div>

        <!-- 一鍵召喚替身 AI 傭兵選項 -->
        <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Bot class="w-5 h-5 text-cyan-400" />
            <div>
              <span class="text-sm font-bold text-slate-200">單人模式自動補齊 3 人 AI 傭兵隊友</span>
              <p class="text-xs text-slate-400">即使沒有朋友在線，也能自動配對傭兵替身出團</p>
            </div>
          </div>
          <input
            type="checkbox"
            :checked="useAiMercenaries"
            class="w-5 h-5 accent-yellow-400 cursor-pointer"
            @change="$emit('update:useAiMercenaries', ($event.target as HTMLInputElement).checked)"
          />
        </div>
      </div>

      <!-- 組隊連線與快速開團卡片 -->
      <div class="bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <h3 class="text-base font-black text-yellow-300 mb-3 flex items-center gap-2">
            <Users class="w-5 h-5" /> 組隊連線 (WebRTC P2P)
          </h3>

          <!-- 單人即刻出團按鈕 -->
          <button
            type="button"
            class="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base cursor-pointer shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-98"
            @click="SoundManager.playClick(); $emit('start-solo-game')"
          >
            <Play class="w-5 h-5 fill-slate-950" />
            立即出團（直接開戰）
          </button>
        </div>

        <div class="relative flex py-1 items-center">
          <div class="flex-grow border-t border-slate-800" />
          <span class="flex-shrink mx-3 text-xs text-slate-500 font-bold uppercase">或與朋友雙人連線</span>
          <div class="flex-grow border-t border-slate-800" />
        </div>

        <!-- 建立房間 (房主) -->
        <div class="space-y-2">
          <button
            type="button"
            class="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold text-sm cursor-pointer border border-yellow-500/30 transition flex items-center justify-center gap-2"
            :disabled="isConnecting"
            @click="SoundManager.playClick(); $emit('create-room')"
          >
            <Share2 class="w-4 h-4" />
            建立連線房間 (成為房主 Host)
          </button>

          <!-- 房號複製區 -->
          <div v-if="myPeerId" class="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div class="text-xs">
              <span class="text-slate-400">房間代碼：</span>
              <span class="font-mono font-bold text-yellow-300">{{ myPeerId }}</span>
            </div>
            <button
              type="button"
              class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 cursor-pointer"
              @click="copyRoomId"
            >
              <Check v-if="copiedRoomId" class="w-3.5 h-3.5 text-emerald-400" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedRoomId ? '已複製' : '複製' }}
            </button>
          </div>
        </div>

        <!-- 加入房間 (隊員) -->
        <div class="space-y-2 pt-1">
          <div class="flex gap-2">
            <input
              :value="roomIdInput"
              type="text"
              placeholder="輸入房主房間代碼..."
              class="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:border-yellow-400 outline-none"
              @input="$emit('update:roomIdInput', ($event.target as HTMLInputElement).value)"
            />
            <button
              type="button"
              class="px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs cursor-pointer transition disabled:opacity-50"
              :disabled="!roomIdInput || isConnecting"
              @click="SoundManager.playClick(); $emit('join-room')"
            >
              {{ isConnecting ? '連線中...' : '加入' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

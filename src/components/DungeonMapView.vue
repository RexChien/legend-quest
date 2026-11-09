<script setup lang="ts">
import { computed } from 'vue';
import { Swords, Flame, Sparkles, Skull, Check } from 'lucide-vue-next';
import { DUNGEON_NODES } from '../core/battleEngine';
import type { DungeonNodeType } from '../types';

const props = defineProps<{
  currentNodeIndex: number;
  isHost: boolean;
  battlePhase?: string;
}>();

const emit = defineEmits<{
  (e: 'advance-node'): void;
  (e: 'rest-campfire'): void;
  (e: 'open-chest'): void;
}>();

const currentNode = computed(() => DUNGEON_NODES[props.currentNodeIndex] || DUNGEON_NODES[0]);

function getNodeIcon(type: DungeonNodeType) {
  switch (type) {
    case 'battle': return Swords;
    case 'elite': return Swords;
    case 'campfire': return Flame;
    case 'chest': return Sparkles;
    case 'boss': return Skull;
    default: return Swords;
  }
}
</script>

<template>
  <div class="w-full bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
    <!-- 地牢推進節點橫幅 -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-black text-amber-300 flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
        地牢進度地圖（第 {{ currentNodeIndex + 1 }} / {{ DUNGEON_NODES.length }} 站）
      </h3>
      <span class="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
        {{ isHost ? '你是隊長 (Host)' : '隊員' }}
      </span>
    </div>

    <!-- 節點步道 -->
    <div class="relative flex items-center justify-between my-6 px-2">
      <!-- 連接線條 -->
      <div class="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1.5 bg-slate-800 -z-0 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500 rounded-full"
          :style="{ width: `${(currentNodeIndex / (DUNGEON_NODES.length - 1)) * 100}%` }"
        />
      </div>

      <!-- 各節點按鈕 -->
      <div
        v-for="(node, idx) in DUNGEON_NODES"
        :key="node.id"
        class="relative z-10 flex flex-col items-center group"
      >
        <div
          class="w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg"
          :class="[
            idx < currentNodeIndex
              ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
              : idx === currentNodeIndex
              ? 'bg-amber-500 border-yellow-200 text-slate-950 scale-110 ring-4 ring-amber-400/40 font-black'
              : 'bg-slate-900 border-slate-700 text-slate-500',
          ]"
        >
          <Check v-if="idx < currentNodeIndex" class="w-6 h-6 stroke-[3]" />
          <component v-else :is="getNodeIcon(node.type)" class="w-6 h-6" />
        </div>
        <span
          class="text-xs font-bold mt-2 whitespace-nowrap transition-colors"
          :class="[
            idx === currentNodeIndex
              ? 'text-yellow-300 font-black scale-105'
              : idx < currentNodeIndex
              ? 'text-emerald-400'
              : 'text-slate-500',
          ]"
        >
          {{ node.type === 'boss' ? '首領戰' : node.type === 'campfire' ? '營火' : node.type === 'chest' ? '寶箱' : `戰鬥 ${idx + 1}` }}
        </span>
      </div>
    </div>

    <!-- 當前節點事件卡片 -->
    <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mt-2">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h4 class="text-lg font-black text-slate-100 flex items-center gap-2">
            <component :is="getNodeIcon(currentNode.type)" class="w-5 h-5 text-amber-400" />
            {{ currentNode.title }}
          </h4>
          <p class="text-sm text-slate-300 mt-1 leading-relaxed">
            {{ currentNode.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

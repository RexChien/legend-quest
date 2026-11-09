<script setup lang="ts">
import { computed } from 'vue';
import {
  Shield,
  ShieldAlert,
  Hammer,
  Sword,
  Axe,
  Skull,
  Flame,
  Swords,
  HeartHandshake,
  Sparkles,
  HeartPulse,
  Sun,
  Zap,
} from 'lucide-vue-next';
import type { Skill } from '../types';

const props = defineProps<{
  skill: Skill;
  disabled?: boolean;
  isComboReady?: boolean;
  isSelected?: boolean;
  cooldownRemaining?: number;
}>();

defineEmits<{
  (e: 'click'): void;
}>();

const iconComponent = computed(() => {
  switch (props.skill.icon) {
    case 'ShieldAlert': return ShieldAlert;
    case 'Shield': return Shield;
    case 'Hammer': return Hammer;
    case 'Sword': return Sword;
    case 'Axe': return Axe;
    case 'Skull': return Skull;
    case 'Flame': return Flame;
    case 'Swords': return Swords;
    case 'HeartHandshake': return HeartHandshake;
    case 'Sparkles': return Sparkles;
    case 'HeartPulse': return HeartPulse;
    case 'Sun': return Sun;
    default: return Zap;
  }
});
</script>

<template>
  <button
    type="button"
    class="relative w-full min-h-[84px] p-3.5 rounded-2xl border-2 text-left flex items-center gap-3.5 transition-all duration-200 select-none outline-none focus-visible:ring-4 focus-visible:ring-yellow-400 group cursor-pointer active:scale-[0.98]"
    :class="[
      disabled
        ? 'bg-slate-900/60 border-slate-700/60 text-slate-500 opacity-60 cursor-not-allowed'
        : isSelected
        ? 'bg-amber-600/30 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20 text-white'
        : isComboReady
        ? 'bg-gradient-to-r from-amber-950/80 via-yellow-900/60 to-slate-900 border-yellow-400 shadow-lg shadow-yellow-500/30 hover:border-yellow-300 text-white anim-combo-glow'
        : 'bg-slate-900/90 border-slate-700 hover:border-slate-500 hover:bg-slate-800/90 text-slate-100 shadow-md',
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <!-- 快捷按鍵徽章 -->
    <div
      class="absolute -top-2.5 -left-2 px-2 py-0.5 rounded-md text-xs font-black tracking-wider uppercase border shadow-md flex items-center gap-1"
      :class="[
        disabled
          ? 'bg-slate-800 border-slate-700 text-slate-500'
          : isComboReady
          ? 'bg-yellow-500 border-yellow-300 text-black font-black animate-pulse'
          : 'bg-slate-800 border-slate-600 text-slate-200 group-hover:border-yellow-400',
      ]"
    >
      <span>按鍵</span>
      <span class="text-sm font-black">{{ skill.shortcutKey }}</span>
    </div>

    <!-- 技能圖示 -->
    <div
      class="w-13 h-13 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
      :class="[
        disabled
          ? 'bg-slate-800 border-slate-700 text-slate-600'
          : isComboReady
          ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
          : 'bg-indigo-950/50 border-indigo-700/60 text-indigo-300',
      ]"
    >
      <component :is="iconComponent" class="w-7 h-7" />
    </div>

    <!-- 技能文字與預覽效果 -->
    <div class="flex-1 min-w-0 pr-1">
      <div class="flex items-center gap-2">
        <h4 class="text-base font-black tracking-wide truncate" :class="{ 'text-yellow-300': isComboReady }">
          {{ skill.name }}
        </h4>
        <span
          v-if="isComboReady"
          class="text-[11px] font-bold px-1.5 py-0.5 bg-yellow-500/30 text-yellow-300 border border-yellow-400/50 rounded"
        >
          連攜加成！
        </span>
        <span
          v-if="cooldownRemaining && cooldownRemaining > 0"
          class="text-xs font-bold px-2 py-0.5 bg-red-950/80 text-red-300 border border-red-500/50 rounded"
        >
          冷卻 {{ cooldownRemaining }} 回合
        </span>
      </div>
      <p class="text-xs text-slate-300 mt-1 leading-snug line-clamp-2">
        {{ skill.description }}
      </p>
    </div>

    <!-- 選取鎖定指示器 -->
    <div v-if="isSelected" class="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-black font-black text-sm">
      ✓
    </div>
  </button>
</template>

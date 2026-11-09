<script setup lang="ts">
import { Trophy } from 'lucide-vue-next';
import type { Achievement } from '../types';

defineProps<{
  achievement: Achievement | null;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="transform -translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform -translate-y-full opacity-0"
  >
    <div
      v-if="achievement"
      class="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 border-2 border-yellow-400 rounded-2xl p-4 shadow-2xl shadow-yellow-500/30 flex items-center gap-4 cursor-pointer"
      @click="$emit('close')"
    >
      <div class="w-14 h-14 rounded-xl bg-yellow-500/20 border border-yellow-400/60 flex items-center justify-center shrink-0 text-yellow-300 animate-bounce">
        <Trophy class="w-8 h-8" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold uppercase tracking-wider text-yellow-300 bg-yellow-950/80 px-2 py-0.5 rounded border border-yellow-500/40">成就解鎖！</span>
          <span class="text-xs text-yellow-200/80">獲得永久全隊屬性加成</span>
        </div>
        <h3 class="text-lg font-black text-yellow-100 truncate mt-0.5">{{ achievement.title }}</h3>
        <p class="text-sm text-yellow-200/90 truncate">{{ achievement.description }}</p>
        <div class="mt-1 text-xs font-semibold text-emerald-400 bg-black/40 px-2 py-0.5 rounded inline-block">
          🎁 {{ achievement.bonus }}
        </div>
      </div>
    </div>
  </Transition>
</template>

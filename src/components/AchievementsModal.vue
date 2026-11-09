<script setup lang="ts">
import { computed } from 'vue';
import { Trophy, CheckCircle2, Lock, X, Sparkles } from 'lucide-vue-next';
import { ALL_ACHIEVEMENTS } from '../storage/save';

const props = defineProps<{
  unlockedIds: string[];
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const unlockedCount = computed(() => props.unlockedIds.length);
const totalCount = ALL_ACHIEVEMENTS.length;
const percent = computed(() => Math.round((unlockedCount.value / totalCount) * 100));

function isUnlocked(id: string) {
  return props.unlockedIds.includes(id);
}

function getCategoryBadge(cat: string) {
  switch (cat) {
    case 'combat': return { text: '戰鬥高光', style: 'bg-rose-950/80 border-rose-500/50 text-rose-300' };
    case 'funny': return { text: '搞笑翻車', style: 'bg-amber-950/80 border-amber-500/50 text-amber-300' };
    default: return { text: '進度收集', style: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300' };
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="relative w-full max-w-2xl bg-slate-900 border-2 border-yellow-500/70 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
      <!-- 頂部標題與關閉按鈕 -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-yellow-300">
            <Trophy class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-black text-yellow-100 flex items-center gap-2">
              桌遊榮耀貼紙簿
              <span class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                成就進度 {{ unlockedCount }} / {{ totalCount }} ({{ percent }}%)
              </span>
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">每解鎖一個成就，全隊角色皆獲得永久微幅屬性加成！</p>
          </div>
        </div>

        <button
          type="button"
          class="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition"
          @click="$emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 成就列表卡片 -->
      <div class="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
        <div
          v-for="ach in ALL_ACHIEVEMENTS"
          :key="ach.id"
          class="rounded-2xl border-2 p-4 transition-all duration-200 flex items-start gap-4"
          :class="[
            isUnlocked(ach.id)
              ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-yellow-400/80 shadow-md'
              : 'bg-slate-950/60 border-slate-800 opacity-60',
          ]"
        >
          <!-- 貼紙圖示 -->
          <div
            class="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0"
            :class="[
              isUnlocked(ach.id)
                ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-inner'
                : 'bg-slate-800 border-slate-700 text-slate-600',
            ]"
          >
            <CheckCircle2 v-if="isUnlocked(ach.id)" class="w-8 h-8 text-yellow-400" />
            <Lock v-else class="w-6 h-6 text-slate-500" />
          </div>

          <!-- 成就內容 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded border" :class="getCategoryBadge(ach.category).style">
                {{ getCategoryBadge(ach.category).text }}
              </span>
              <h3 class="text-base font-black truncate" :class="isUnlocked(ach.id) ? 'text-yellow-100' : 'text-slate-400'">
                {{ ach.title }}
              </h3>
            </div>
            <p class="text-xs text-slate-300 mb-2 leading-relaxed">
              {{ ach.description }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-black/50 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles class="w-3 h-3" /> 獎勵：{{ ach.bonus }}
              </span>
              <span v-if="isUnlocked(ach.id)" class="text-[11px] font-bold text-amber-300">
                ★ 已貼上榮耀貼紙
              </span>
              <span v-else class="text-[11px] text-slate-500">
                尚未達成
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按鈕 -->
      <div class="pt-3 border-t border-slate-800 flex justify-end">
        <button
          type="button"
          class="px-6 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black cursor-pointer transition shadow-lg shadow-yellow-500/20"
          @click="$emit('close')"
        >
          關閉貼紙簿
        </button>
      </div>
    </div>
  </div>
</template>

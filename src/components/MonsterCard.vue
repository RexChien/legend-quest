<script setup lang="ts">
import { computed } from 'vue';
import { Skull, ShieldOff, Flame, Axe, ShieldAlert, Shield } from 'lucide-vue-next';
import type { Monster } from '../types';

const props = defineProps<{
  monster: Monster;
  isHit?: boolean;
  isAttacking?: boolean;
  floatingDamage?: { text: string; isCrit: boolean } | null;
}>();

const hpPercent = computed(() => {
  return Math.max(0, Math.min(100, Math.round((props.monster.stats.hp / props.monster.stats.maxHp) * 100)));
});

const isDead = computed(() => props.monster.stats.hp <= 0);

const hasArmorBreak = computed(() => props.monster.statusEffects.some((s) => s.isArmorBreak));
</script>

<template>
  <div
    class="relative rounded-3xl border-2 p-5 text-center transition-all duration-300 max-w-md w-full mx-auto select-none shadow-2xl"
    :class="[
      isDead
        ? 'bg-slate-950/70 border-slate-800 opacity-40 scale-95'
        : monster.isBoss
        ? 'bg-gradient-to-b from-rose-950/80 via-slate-900/90 to-black border-red-500/80 ring-2 ring-red-500/30'
        : 'bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950 border-purple-900/80',
      isAttacking ? 'anim-monster-attack' : '',
      isHit ? 'anim-hit' : 'anim-idle',
    ]"
  >
    <!-- 飄浮暴擊與傷害數字 -->
    <div
      v-if="floatingDamage"
      class="absolute -top-8 left-1/2 -translate-x-1/2 z-30 font-black pointer-events-none damage-float whitespace-nowrap text-3xl"
      :class="floatingDamage.isCrit ? 'text-yellow-300 drop-shadow-[0_0_12px_rgba(234,179,8,1)] scale-125' : 'text-red-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'"
    >
      {{ floatingDamage.text }}
    </div>

    <!-- 標題與 Boss 標籤 -->
    <div class="flex items-center justify-center gap-2 mb-2">
      <span
        v-if="monster.isBoss"
        class="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-md shadow-red-500/40 animate-pulse flex items-center gap-1"
      >
        <Flame class="w-3.5 h-3.5 fill-white" /> 首領 BOSS
      </span>
      <span v-else class="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
        {{ monster.title || '普通怪物' }}
      </span>
    </div>

    <!-- 怪物名稱 -->
    <h3 class="text-2xl font-black text-slate-100 tracking-wide mb-3">
      {{ monster.name }}
    </h3>

    <!-- 怪物頭像立繪 -->
    <div class="relative w-32 h-32 mx-auto my-3 flex items-center justify-center">
      <div
        class="w-full h-full rounded-full border-2 flex items-center justify-center shadow-inner overflow-hidden transition-transform"
        :class="[
          monster.isBoss
            ? 'bg-red-950/60 border-red-500 text-red-300'
            : 'bg-purple-950/60 border-purple-600 text-purple-300',
        ]"
      >
        <Flame v-if="monster.avatarIcon === 'Flame'" class="w-18 h-18 text-rose-400" />
        <Axe v-else-if="monster.avatarIcon === 'Axe'" class="w-16 h-16 text-amber-400" />
        <Skull v-else class="w-16 h-16 text-slate-300" />
      </div>

      <!-- 破甲特效光環 -->
      <div
        v-if="hasArmorBreak"
        class="absolute inset-0 rounded-full border-2 border-dashed border-yellow-400 animate-spin"
        style="animation-duration: 8s"
      />
    </div>

    <!-- 狀態標籤（破甲、嘲諷等） -->
    <div class="flex flex-wrap items-center justify-center gap-2 mb-3 min-h-[26px]">
      <span
        v-if="hasArmorBreak"
        class="text-xs font-bold px-2 py-0.5 rounded-md bg-yellow-950/80 text-yellow-300 border border-yellow-400/80 flex items-center gap-1 animate-pulse shadow-sm shadow-yellow-500/20"
      >
        <ShieldOff class="w-3.5 h-3.5" /> 破甲狀態 (-30% DEF)
      </span>
      <span
        v-if="monster.tauntedById"
        class="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-400/80 flex items-center gap-1 shadow-sm shadow-blue-500/20"
      >
        <ShieldAlert class="w-3.5 h-3.5" /> 仇恨鎖定中
      </span>
    </div>

    <!-- 怪物 HP 條與護盾 -->
    <div class="space-y-1.5 px-2">
      <div class="flex items-center justify-between text-xs font-bold text-slate-300">
        <span>生命值 (HP)</span>
        <span class="text-rose-400">{{ monster.stats.hp }} / {{ monster.stats.maxHp }} ({{ hpPercent }}%)</span>
      </div>

      <div class="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="[
            hpPercent > 50 ? 'bg-gradient-to-r from-red-600 to-rose-500' :
            hpPercent > 20 ? 'bg-gradient-to-r from-amber-600 to-orange-500' :
            'bg-gradient-to-r from-red-700 to-rose-900 animate-pulse'
          ]"
          :style="{ width: `${hpPercent}%` }"
        />
      </div>

      <!-- 護盾顯示 -->
      <div v-if="monster.stats.shield > 0" class="flex items-center justify-between text-xs font-bold text-cyan-300">
        <span class="flex items-center gap-1">
          <Shield class="w-3.5 h-3.5 fill-cyan-400/40" /> 護盾防護
        </span>
        <span>+{{ monster.stats.shield }}</span>
      </div>
    </div>
  </div>
</template>

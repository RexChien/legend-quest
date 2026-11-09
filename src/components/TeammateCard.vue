<script setup lang="ts">
import { computed } from 'vue';
import { Shield, Sword, Heart, Gem, Bot, User } from 'lucide-vue-next';
import type { Player, Equipment } from '../types';

const props = defineProps<{
  player: Player;
  isCurrentPlayer?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'inspect-equipment', equipment: Equipment): void;
}>();

const hpPercent = computed(() => {
  return Math.max(0, Math.min(100, Math.round((props.player.stats.hp / props.player.stats.maxHp) * 100)));
});

const classLabel = computed(() => {
  switch (props.player.heroClass) {
    case 'guardian': return { name: '守護者 (Tank)', color: 'text-blue-400 bg-blue-950/60 border-blue-500/40' };
    case 'berserker': return { name: '狂戰士 (DPS)', color: 'text-red-400 bg-red-950/60 border-red-500/40' };
    case 'priest': return { name: '牧師 (Healer)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
    default: return { name: '冒險者', color: 'text-slate-400 bg-slate-900 border-slate-700' };
  }
});

function getRarityBorder(rarity?: string) {
  switch (rarity) {
    case 'legendary': return 'border-amber-400 bg-amber-950/50 text-amber-300';
    case 'epic': return 'border-purple-400 bg-purple-950/50 text-purple-300';
    case 'rare': return 'border-blue-400 bg-blue-950/50 text-blue-300';
    default: return 'border-slate-700 bg-slate-800 text-slate-400';
  }
}
</script>

<template>
  <div
    class="relative rounded-2xl border-2 p-3.5 transition-all duration-300 select-none shadow-lg flex flex-col justify-between"
    :class="[
      player.isDowned
        ? 'bg-rose-950/40 border-rose-600/70 opacity-80'
        : isCurrentPlayer
        ? 'bg-slate-900/95 border-amber-400/80 ring-2 ring-amber-400/30'
        : 'bg-slate-900/80 border-slate-700/80',
      isAttacking ? 'anim-attack' : '',
      isHit ? 'anim-hit' : 'anim-idle',
    ]"
  >
    <!-- 頂部身分與狀態 -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="p-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          <Bot v-if="player.isAI" class="w-3.5 h-3.5 text-cyan-400" />
          <User v-else class="w-3.5 h-3.5 text-amber-400" />
        </span>
        <h4 class="font-black text-sm text-slate-100 truncate">
          {{ player.name }}
          <span v-if="isCurrentPlayer" class="text-xs text-amber-400 font-bold ml-1">(你)</span>
        </h4>
      </div>

      <!-- 準備狀態標籤 -->
      <div>
        <span
          v-if="player.isDowned"
          class="text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white animate-pulse"
        >
          倒地瀕死
        </span>
        <span
          v-else-if="player.isReady"
          class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600/80 text-white border border-emerald-400/50"
        >
          已準備
        </span>
        <span
          v-else
          class="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 animate-pulse"
        >
          思考中...
        </span>
      </div>
    </div>

    <!-- 職業標籤 -->
    <div class="mb-2.5">
      <span class="text-[11px] font-bold px-2 py-0.5 rounded border inline-block" :class="classLabel.color">
        {{ classLabel.name }} Lv.{{ player.level }}
      </span>
    </div>

    <!-- 生命值條與護盾 -->
    <div class="space-y-1.5 mb-3">
      <div class="flex items-center justify-between text-xs font-bold">
        <span class="flex items-center gap-1 text-rose-400">
          <Heart class="w-3.5 h-3.5 fill-rose-500" /> HP
        </span>
        <span class="text-slate-200">{{ player.stats.hp }} / {{ player.stats.maxHp }}</span>
      </div>

      <!-- 血條 -->
      <div class="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
        <div
          class="h-full transition-all duration-300 rounded-full"
          :class="[
            hpPercent > 50 ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
            hpPercent > 25 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
            'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
          ]"
          :style="{ width: `${hpPercent}%` }"
        />
      </div>

      <!-- 護盾顯示 -->
      <div v-if="player.stats.shield > 0" class="flex items-center justify-between text-xs font-bold text-cyan-300 pt-0.5">
        <span class="flex items-center gap-1">
          <Shield class="w-3.5 h-3.5 fill-cyan-400/40" /> 護盾
        </span>
        <span>+{{ player.stats.shield }}</span>
      </div>
    </div>

    <!-- 輕量圖示紙娃娃裝備欄位 (3 個欄位) -->
    <div class="pt-2 border-t border-slate-800/80">
      <div class="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center justify-between">
        <span>裝備配置</span>
        <span class="text-[10px] text-slate-500">點擊查看</span>
      </div>
      <div class="grid grid-cols-3 gap-1.5">
        <!-- 武器 -->
        <button
          type="button"
          class="h-9 rounded-lg border flex items-center justify-center p-1 transition hover:scale-105 cursor-pointer"
          :class="getRarityBorder(player.equipment.weapon?.rarity)"
          :title="player.equipment.weapon ? `${player.equipment.weapon.name} (+${player.equipment.weapon.atkBonus} ATK)` : '無武器'"
          @click="player.equipment.weapon && emit('inspect-equipment', player.equipment.weapon)"
        >
          <Sword class="w-4 h-4" />
        </button>

        <!-- 防具 -->
        <button
          type="button"
          class="h-9 rounded-lg border flex items-center justify-center p-1 transition hover:scale-105 cursor-pointer"
          :class="getRarityBorder(player.equipment.armor?.rarity)"
          :title="player.equipment.armor ? `${player.equipment.armor.name} (+${player.equipment.armor.defBonus} DEF)` : '無防具'"
          @click="player.equipment.armor && emit('inspect-equipment', player.equipment.armor)"
        >
          <Shield class="w-4 h-4" />
        </button>

        <!-- 飾品 -->
        <button
          type="button"
          class="h-9 rounded-lg border flex items-center justify-center p-1 transition hover:scale-105 cursor-pointer"
          :class="getRarityBorder(player.equipment.accessory?.rarity)"
          :title="player.equipment.accessory ? `${player.equipment.accessory.name} (+${player.equipment.accessory.hpBonus} HP)` : '無飾品'"
          @click="player.equipment.accessory && emit('inspect-equipment', player.equipment.accessory)"
        >
          <Gem class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

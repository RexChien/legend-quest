<script setup lang="ts">
import { Sword, Shield, Gem, X, Sparkles } from 'lucide-vue-next';
import type { Equipment } from '../types';

defineProps<{
  equipment: Equipment | null;
  canEquip?: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'equip', item: Equipment): void;
}>();

function getRarityStyle(rarity?: string) {
  switch (rarity) {
    case 'legendary': return { border: 'border-amber-400', bg: 'bg-amber-950/40', text: 'text-amber-400', label: '傳說 (Legendary)' };
    case 'epic': return { border: 'border-purple-400', bg: 'bg-purple-950/40', text: 'text-purple-400', label: '史詩 (Epic)' };
    case 'rare': return { border: 'border-blue-400', bg: 'bg-blue-950/40', text: 'text-blue-400', label: '稀有 (Rare)' };
    default: return { border: 'border-slate-600', bg: 'bg-slate-800/40', text: 'text-slate-400', label: '普通 (Common)' };
  }
}
</script>

<template>
  <div v-if="equipment" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div
      class="relative w-full max-w-md bg-slate-900 border-2 rounded-3xl p-6 shadow-2xl"
      :class="getRarityStyle(equipment.rarity).border"
    >
      <!-- 頂部與關閉按鈕 -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0"
            :class="[getRarityStyle(equipment.rarity).border, getRarityStyle(equipment.rarity).bg]"
          >
            <Sword v-if="equipment.type === 'weapon'" class="w-8 h-8" :class="getRarityStyle(equipment.rarity).text" />
            <Shield v-else-if="equipment.type === 'armor'" class="w-8 h-8" :class="getRarityStyle(equipment.rarity).text" />
            <Gem v-else class="w-8 h-8" :class="getRarityStyle(equipment.rarity).text" />
          </div>
          <div>
            <span
              class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider inline-block mb-1"
              :class="[getRarityStyle(equipment.rarity).border, getRarityStyle(equipment.rarity).text]"
            >
              {{ getRarityStyle(equipment.rarity).label }}
            </span>
            <h3 class="text-xl font-black text-slate-100">{{ equipment.name }}</h3>
          </div>
        </div>

        <button
          type="button"
          class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition"
          @click="$emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 說明文案 -->
      <p class="text-sm text-slate-300 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        {{ equipment.description }}
      </p>

      <!-- 屬性加成一覽 -->
      <div class="space-y-2 mb-6">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">屬性加成</div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div v-if="equipment.atkBonus" class="bg-red-950/30 border border-red-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
            <span class="text-red-400 font-medium">攻擊力</span>
            <span class="font-black text-red-300">+{{ equipment.atkBonus }}</span>
          </div>
          <div v-if="equipment.defBonus" class="bg-blue-950/30 border border-blue-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
            <span class="text-blue-400 font-medium">防禦力</span>
            <span class="font-black text-blue-300">+{{ equipment.defBonus }}</span>
          </div>
          <div v-if="equipment.hpBonus" class="bg-emerald-950/30 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
            <span class="text-emerald-400 font-medium">最大生命</span>
            <span class="font-black text-emerald-300">+{{ equipment.hpBonus }}</span>
          </div>
          <div v-if="equipment.spdBonus" class="bg-cyan-950/30 border border-cyan-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
            <span class="text-cyan-400 font-medium">速度</span>
            <span class="font-black text-cyan-300">+{{ equipment.spdBonus }}</span>
          </div>
          <div v-if="equipment.critBonus" class="col-span-2 bg-amber-950/30 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
            <span class="text-amber-400 font-medium flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5" /> 暴擊率加成
            </span>
            <span class="font-black text-amber-300">+{{ Math.round(equipment.critBonus * 100) }}%</span>
          </div>
        </div>
      </div>

      <!-- 動作按鈕 -->
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer transition text-sm"
          @click="$emit('close')"
        >
          關閉
        </button>
        <button
          v-if="canEquip"
          type="button"
          class="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black cursor-pointer transition text-sm shadow-lg shadow-amber-500/20"
          @click="$emit('equip', equipment); $emit('close')"
        >
          立即穿戴
        </button>
      </div>
    </div>
  </div>
</template>

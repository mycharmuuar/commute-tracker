<template>
  <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
    <button
      v-for="mode in modes"
      :key="mode.id"
      type="button"
      @click="$emit('update:modelValue', mode.id)"
      :class="[
        'flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition-all',
        modelValue === mode.id
          ? 'bg-white text-blue-600 shadow-sm font-semibold border border-slate-200'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
      ]"
    >
      <span>{{ mode.icon }}</span>
      <span>{{ mode.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TravelMode } from '~/types';

defineProps<{
  modelValue: TravelMode;
}>();

defineEmits<{
  (e: 'update:modelValue', value: TravelMode): void;
}>();

const modes = [
  { id: 'driving' as TravelMode, label: 'ขับรถ', icon: '🚗' },
  { id: 'transit' as TravelMode, label: 'รถสาธารณะ', icon: '🚌' },
  { id: 'walking' as TravelMode, label: 'เดิน', icon: '🚶' },
  { id: 'bicycling' as TravelMode, label: 'จักรยาน', icon: '🚲' },
];
</script>

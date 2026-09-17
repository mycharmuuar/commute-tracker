<template>
  <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <span>📊</span>
        <span>เปรียบเทียบทุกรูปแบบการเดินทาง (Multimodal Comparison)</span>
      </h3>
      <span class="text-[10px] text-slate-400">คลิกเพื่อเลือกโหมด</span>
    </div>

    <!-- Comparison Table / Grid -->
    <div class="space-y-2">
      <div
        v-for="item in comparisons"
        :key="item.mode"
        @click="$emit('selectMode', item.mode)"
        class="p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
        :class="
          activeMode === item.mode
            ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300 shadow-xs'
            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80'
        "
      >
        <!-- Icon & Name -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-white shadow-2xs border border-slate-200/60 flex items-center justify-center text-base">
            {{ item.icon }}
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-slate-800">{{ item.name }}</span>
              <span
                v-if="item.isFastest"
                class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800"
              >
                เร็วที่สุด ⚡
              </span>
              <span
                v-if="item.isEco"
                class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800"
              >
                รักษ์โลก 🌱
              </span>
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">ระยะทาง ~{{ item.distance }}</p>
          </div>
        </div>

        <!-- Time & Cost Metrics -->
        <div class="text-right">
          <p class="font-black font-mono text-sm" :class="activeMode === item.mode ? 'text-blue-700' : 'text-slate-800'">
            {{ item.duration }}
          </p>
          <div class="flex items-center justify-end gap-2 text-[10px] text-slate-400 mt-0.5">
            <span>~{{ item.cost }}</span>
            <span>•</span>
            <span>{{ item.calories }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TravelMode } from '~/types';

const props = defineProps<{
  activeMode: TravelMode;
  distanceKm: number;
  drivingMinutes: number;
}>();

defineEmits<{
  (e: 'selectMode', mode: TravelMode): void;
}>();

const comparisons = computed(() => {
  const km = props.distanceKm || 5.2;
  const driveMins = props.drivingMinutes || 25;

  return [
    {
      mode: 'driving' as TravelMode,
      name: 'ขับรถยนต์',
      icon: '🚗',
      duration: `${driveMins} นาที`,
      distance: `${km.toFixed(1)} กม.`,
      cost: `${Math.round(km * 3.8)} บาท`,
      calories: '20 kcal',
      isFastest: true,
      isEco: false,
    },
    {
      mode: 'transit' as TravelMode,
      name: 'รถโดยสารสาธารณะ',
      icon: '🚌',
      duration: `${Math.round(driveMins * 1.5)} นาที`,
      distance: `${(km * 1.1).toFixed(1)} กม.`,
      cost: `${Math.round(15 + km * 1.5)} บาท`,
      calories: '45 kcal',
      isFastest: false,
      isEco: true,
    },
    {
      mode: 'bicycling' as TravelMode,
      name: 'ปั่นจักรยาน',
      icon: '🚲',
      duration: `${Math.round(km * 3.5)} นาที`,
      distance: `${(km * 0.95).toFixed(1)} กม.`,
      cost: 'ฟรี 0 บาท',
      calories: `${Math.round(km * 35)} kcal`,
      isFastest: false,
      isEco: true,
    },
    {
      mode: 'walking' as TravelMode,
      name: 'เดินเท้า',
      icon: '🚶',
      duration: `${Math.round(km * 12)} นาที`,
      distance: `${(km * 0.9).toFixed(1)} กม.`,
      cost: 'ฟรี 0 บาท',
      calories: `${Math.round(km * 65)} kcal`,
      isFastest: false,
      isEco: true,
    },
  ];
});
</script>

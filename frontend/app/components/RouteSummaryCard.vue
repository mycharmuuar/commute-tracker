<template>
  <div v-if="routeData" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <!-- Main Highlights -->
    <div class="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-b border-slate-100">
      <div class="flex items-center justify-between gap-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {{ modeLabel }}
          </span>
          <span
            v-if="routeData.hasTrafficData"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
            title="คำนวณตามสภาพการจราจรจริง ณ เวลาปัจจุบัน (departure_time=now)"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            สภาพจราจร Real-time
          </span>
        </div>
        <span class="text-xs text-slate-400">อัปเดต: {{ formatTime(routeData.departureTime) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Duration -->
        <div class="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
          <p class="text-xs font-medium text-slate-500 mb-0.5">เวลาเดินทางโดยประมาณ</p>
          <div class="flex items-baseline gap-1.5">
            <span class="text-2xl font-bold text-slate-900">
              {{ routeData.duration_in_traffic?.text || routeData.duration.text }}
            </span>
          </div>
          <p v-if="routeData.hasTrafficData && routeData.duration_in_traffic.value !== routeData.duration.value" class="text-[11px] text-slate-400 mt-0.5">
            (เวลาปกติ: {{ routeData.duration.text }})
          </p>
        </div>

        <!-- Distance -->
        <div class="p-3 bg-white rounded-xl shadow-xs border border-slate-100">
          <p class="text-xs font-medium text-slate-500 mb-0.5">ระยะทางรวม</p>
          <span class="text-2xl font-bold text-slate-900">
            {{ routeData.distance.text }}
          </span>
          <p class="text-[11px] text-slate-400 mt-0.5">เส้นทางที่เร็วที่สุด</p>
        </div>
      </div>
    </div>

    <!-- Locations -->
    <div class="p-5 space-y-3 text-xs border-b border-slate-100">
      <div class="flex items-start gap-3">
        <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
          A
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-slate-400 font-medium">จุดเริ่มต้น (ต้นทาง)</p>
          <p class="text-slate-700 font-medium truncate">{{ routeData.startAddress }}</p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <span class="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
          B
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-slate-400 font-medium">จุดหมายปลายทาง (บริษัท)</p>
          <p class="text-slate-700 font-medium truncate">{{ routeData.endAddress }}</p>
        </div>
      </div>
    </div>

    <!-- Step by Step Instructions Toggle -->
    <div class="p-4 bg-slate-50/50">
      <button
        @click="showSteps = !showSteps"
        class="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
      >
        <span>ขั้นตอนการเดินทาง ({{ routeData.steps.length }} จุดเปลี่ยนทิศทาง)</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 transition-transform duration-200"
          :class="{ 'rotate-180': showSteps }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Steps List -->
      <ol v-if="showSteps" class="mt-3 space-y-2 text-xs border-t border-slate-200 pt-3">
        <li
          v-for="(step, idx) in routeData.steps"
          :key="idx"
          class="flex items-start gap-2.5 text-slate-600"
        >
          <span class="w-4 h-4 rounded bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 font-medium text-[10px]">
            {{ idx + 1 }}
          </span>
          <div class="flex-1">
            <p class="font-medium text-slate-800">{{ step.instructions }}</p>
            <p class="text-[10px] text-slate-400">{{ step.distance }} • {{ step.duration }}</p>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { RouteResponse } from '~/types';

const props = defineProps<{
  routeData: RouteResponse;
}>();

const showSteps = ref(false);

const modeLabel = computed(() => {
  switch (props.routeData.travelMode) {
    case 'transit':
      return 'รถโดยสารสาธารณะ';
    case 'walking':
      return 'เดินเท้า';
    case 'bicycling':
      return 'ปั่นจักรยาน';
    default:
      return 'ขับรถยนต์';
  }
});

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  } catch {
    return 'เมื่อสักครู่';
  }
};
</script>

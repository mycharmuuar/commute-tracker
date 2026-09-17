<template>
  <div v-if="routeData" class="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden transition-all duration-300">
    
    <!-- Header with Animated Journey Progress Bar -->
    <div class="p-5 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 border-b border-slate-100 space-y-4">
      
      <!-- Top Title & Badge -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
            <span>{{ modeIcon }}</span>
            <span>{{ modeLabel }}</span>
          </span>
          <span
            v-if="trafficSeverity.status === 'smooth'"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            จราจรคล่องตัว
          </span>
          <span
            v-else-if="trafficSeverity.status === 'moderate'"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
          >
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            ชะลอตัวเล็กน้อย (+{{ trafficSeverity.delayMinutes }} น.)
          </span>
          <span
            v-else-if="trafficSeverity.status === 'heavy'"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800"
          >
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            รถติดหนาแน่น (+{{ trafficSeverity.delayMinutes }} น.)
          </span>
        </div>

        <span class="text-[11px] text-slate-400 font-mono">
          {{ formatTime(routeData.departureTime) }}
        </span>
      </div>

      <!-- Animated Journey Track (Visual Commute Simulation) -->
      <div class="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-blue-100/80 shadow-xs">
        <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
          <span class="flex items-center gap-1 text-blue-600">
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            ออกเดินทาง ({{ nowTimeString }})
          </span>
          <span class="flex items-center gap-1 text-rose-600 font-bold">
            🏁 คาดว่าจะถึง (~{{ estimatedArrivalTime }})
          </span>
        </div>

        <!-- Progress track with moving icon animation -->
        <div class="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center p-0.5">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500 opacity-25"></div>
          
          <!-- Moving vehicle along track -->
          <div class="relative w-full h-full">
            <div class="absolute top-1/2 -translate-y-1/2 animate-car-commute text-xs select-none">
              {{ modeIcon }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
          <span>พิกัดของคุณ (A)</span>
          <span>ระยะทาง {{ routeData.distance.text }}</span>
          <span>บริษัท (B)</span>
        </div>
      </div>

      <!-- Main Numbers: Duration & Distance -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Duration Card -->
        <div class="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <p class="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <span>⏱️</span> เวลาเดินทางรวม
          </p>
          <div class="my-1">
            <span class="text-2xl font-black text-slate-900 tracking-tight">
              {{ routeData.duration_in_traffic?.text || routeData.duration.text }}
            </span>
          </div>
          <p v-if="routeData.hasTrafficData" class="text-[10px] text-slate-400">
            คำนวณตามการจราจร Real-time
          </p>
          <p v-else class="text-[10px] text-slate-400">
            เวลามาตรฐานเฉลี่ย
          </p>
        </div>

        <!-- Distance Card -->
        <div class="p-3.5 bg-white rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <p class="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <span>📏</span> ระยะทางทั้งหมด
          </p>
          <div class="my-1">
            <span class="text-2xl font-black text-slate-900 tracking-tight">
              {{ routeData.distance.text }}
            </span>
          </div>
          <p class="text-[10px] text-emerald-600 font-medium">
            ✓ เส้นทางที่ดีที่สุดขณะนี้
          </p>
        </div>
      </div>
    </div>

    <!-- Commute Insights (Eco / Calories / Cost) -->
    <div class="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
      <div class="p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
        <p class="text-[10px] text-slate-400 font-medium">คาดการณ์ค่าน้ำมัน</p>
        <p class="text-xs font-bold text-slate-700 mt-0.5">~{{ estimatedCost }} บาท</p>
      </div>
      <div class="p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
        <p class="text-[10px] text-slate-400 font-medium">คาร์บอน (CO₂)</p>
        <p class="text-xs font-bold text-slate-700 mt-0.5">~{{ estimatedCO2 }} kg</p>
      </div>
      <div class="p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
        <p class="text-[10px] text-slate-400 font-medium">เผาผลาญพลังงาน</p>
        <p class="text-xs font-bold text-amber-600 mt-0.5">~{{ estimatedCalories }} kcal</p>
      </div>
    </div>

    <!-- Origin & Destination Addresses -->
    <div class="p-5 space-y-3 text-xs border-b border-slate-100">
      <div class="flex items-start gap-3">
        <span class="w-6 h-6 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-xs">
          A
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">จุดเริ่มต้น (ต้นทาง)</p>
          <p class="text-slate-800 font-semibold truncate mt-0.5">{{ routeData.startAddress }}</p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <span class="w-6 h-6 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-xs">
          B
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">จุดหมายปลายทาง (บริษัท)</p>
          <p class="text-slate-800 font-semibold truncate mt-0.5">{{ routeData.endAddress }}</p>
        </div>
      </div>
    </div>

    <!-- Step by Step Navigation Instructions Toggle -->
    <div class="p-4 bg-slate-50/50">
      <button
        @click="showSteps = !showSteps"
        class="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
      >
        <span class="flex items-center gap-1.5">
          <span>🧭</span>
          <span>ขั้นตอนการนำทาง ({{ routeData.steps.length }} จุดสำคัญ)</span>
        </span>
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
      <ol v-if="showSteps" class="mt-3 space-y-2 text-xs border-t border-slate-200/80 pt-3">
        <li
          v-for="(step, idx) in routeData.steps"
          :key="idx"
          class="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition-colors"
        >
          <span class="w-5 h-5 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
            {{ idx + 1 }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-800 leading-snug">{{ step.instructions }}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">{{ step.distance }} • {{ step.duration }}</p>
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

const modeIcon = computed(() => {
  switch (props.routeData.travelMode) {
    case 'transit': return '🚌';
    case 'walking': return '🚶';
    case 'bicycling': return '🚲';
    default: return '🚗';
  }
});

const modeLabel = computed(() => {
  switch (props.routeData.travelMode) {
    case 'transit': return 'รถโดยสารสาธารณะ';
    case 'walking': return 'เดินเท้า';
    case 'bicycling': return 'ปั่นจักรยาน';
    default: return 'ขับรถยนต์';
  }
});

const nowTimeString = computed(() => {
  const d = new Date();
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
});

const estimatedArrivalTime = computed(() => {
  const seconds = props.routeData.duration_in_traffic?.value || props.routeData.duration.value || 0;
  const arrival = new Date(Date.now() + seconds * 1000);
  return arrival.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
});

// ประเมินสภาพการจราจร
const trafficSeverity = computed(() => {
  const trafficSec = props.routeData.duration_in_traffic?.value || props.routeData.duration.value;
  const staticSec = props.routeData.duration.value;
  const diffMinutes = Math.round((trafficSec - staticSec) / 60);

  if (diffMinutes > 15) {
    return { status: 'heavy', delayMinutes: diffMinutes };
  } else if (diffMinutes > 5) {
    return { status: 'moderate', delayMinutes: diffMinutes };
  }
  return { status: 'smooth', delayMinutes: 0 };
});

// ประมาณการค่าน้ำมัน (คำนวณจากระยะทาง km * 3.5 บาท/km)
const estimatedCost = computed(() => {
  const km = (props.routeData.distance.value || 0) / 1000;
  if (props.routeData.travelMode === 'walking' || props.routeData.travelMode === 'bicycling') return 0;
  if (props.routeData.travelMode === 'transit') return Math.round(15 + km * 1.5);
  return Math.round(km * 3.8);
});

// ประมาณการปล่อยก๊าซ CO2 (kg)
const estimatedCO2 = computed(() => {
  const km = (props.routeData.distance.value || 0) / 1000;
  if (props.routeData.travelMode === 'walking' || props.routeData.travelMode === 'bicycling') return '0.0';
  if (props.routeData.travelMode === 'transit') return (km * 0.05).toFixed(1);
  return (km * 0.15).toFixed(1);
});

// ประมาณการแคลอรีที่เผาผลาญ (kcal)
const estimatedCalories = computed(() => {
  const km = (props.routeData.distance.value || 0) / 1000;
  if (props.routeData.travelMode === 'walking') return Math.round(km * 65);
  if (props.routeData.travelMode === 'bicycling') return Math.round(km * 35);
  return Math.round(km * 2.5); // นั่งขับรถ
});

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return 'อัปเดต ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  } catch {
    return 'เมื่อสักครู่';
  }
};
</script>

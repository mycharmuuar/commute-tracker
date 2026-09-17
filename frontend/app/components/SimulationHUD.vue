<template>
  <div
    v-if="isActive"
    class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-lg bg-slate-900/90 backdrop-blur-xl border border-blue-500/40 rounded-3xl p-4 shadow-2xl text-white select-none animate-in fade-in duration-300"
  >
    <!-- Top HUD info -->
    <div class="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-3 mb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-lg animate-pulse">
          🚗
        </div>
        <div>
          <p class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">GPS Simulation Mode</p>
          <p class="text-xs font-bold text-white flex items-center gap-1.5">
            <span>กำลังจำลองการนำทางเสมือนจริง</span>
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </p>
        </div>
      </div>

      <!-- Virtual Speedometer -->
      <div class="text-right">
        <div class="flex items-baseline justify-end gap-1">
          <span class="text-2xl font-black font-mono text-emerald-400">{{ currentSpeed }}</span>
          <span class="text-[10px] text-slate-400 font-bold">km/h</span>
        </div>
        <p class="text-[9px] text-slate-400">ความเร็วเฉลี่ย</p>
      </div>
    </div>

    <!-- Progress & Metrics -->
    <div class="space-y-2 mb-3">
      <div class="flex items-center justify-between text-[11px] font-semibold text-slate-300">
        <span>ความคืบหน้า: {{ progressPercent }}%</span>
        <span>เหลืออีก ~{{ remainingDistanceKm }} กม.</span>
      </div>

      <!-- Animated Progress Bar -->
      <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
        <div
          class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-150 shadow-sm shadow-blue-500/50"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="flex items-center justify-between gap-2 pt-1">
      <div class="flex items-center gap-1.5">
        <!-- Play / Pause Button -->
        <button
          type="button"
          @click="$emit('togglePause')"
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
          :class="isPaused ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'"
        >
          <span>{{ isPaused ? '▶️ เล่นต่อ' : '⏸️ หยุดชั่วคราว' }}</span>
        </button>

        <!-- Speed Multiplier (1x, 2x, 4x) -->
        <button
          type="button"
          @click="$emit('cycleSpeed')"
          class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-colors"
          title="ปรับความเร็วการจำลอง"
        >
          ⚡ {{ speedMultiplier }}x
        </button>
      </div>

      <!-- Stop Simulation Button -->
      <button
        type="button"
        @click="$emit('stop')"
        class="px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors flex items-center gap-1"
      >
        <span>⏹️ สิ้นสุดการจำลอง</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isActive: boolean;
  isPaused: boolean;
  progressPercent: number;
  currentSpeed: number;
  remainingDistanceKm: string;
  speedMultiplier: number;
}>();

defineEmits<{
  (e: 'togglePause'): void;
  (e: 'stop'): void;
  (e: 'cycleSpeed'): void;
}>();
</script>

<template>
  <div class="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs space-y-3">
    <div class="flex items-start gap-2.5 text-amber-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <div>
        <p class="font-semibold text-amber-900">ระบุตำแหน่งต้นทางด้วยตนเอง (Fallback)</p>
        <p class="text-amber-700 mt-0.5">เนื่องจากไม่ได้เปิด GPS คุณสามารถเลือกจุดเริ่มต้นยอดนิยม หรือป้อนพิกัด ละติจูด, ลองจิจูด</p>
      </div>
    </div>

    <!-- Quick Preset Buttons -->
    <div>
      <p class="text-[11px] font-medium text-amber-900/70 mb-1.5">เลือกจุดเริ่มต้นจำลองยอดนิยม:</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="preset in presets"
          :key="preset.name"
          type="button"
          @click="selectPreset(preset)"
          class="px-2.5 py-1 bg-white hover:bg-amber-100/60 border border-amber-200 rounded-lg text-amber-900 font-medium text-[11px] transition-colors"
        >
          📍 {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- Manual Coordinates Input -->
    <div class="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row gap-2">
      <input
        v-model="manualLat"
        type="number"
        step="any"
        placeholder="ละติจูด (Lat) เช่น 13.7563"
        class="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <input
        v-model="manualLng"
        type="number"
        step="any"
        placeholder="ลองจิจูด (Lng) เช่น 100.5018"
        class="flex-1 px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <button
        type="button"
        @click="applyManualCoords"
        class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        ตกลง
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { LatLng } from '~/types';

const emit = defineEmits<{
  (e: 'selectLocation', coords: LatLng): void;
}>();

const manualLat = ref('');
const manualLng = ref('');

const presets = [
  { name: 'อนุสาวรีย์ชัยสมรภูมิ', lat: 13.7649, lng: 100.5383 },
  { name: 'สยามพารากอน', lat: 13.7466, lng: 100.5347 },
  { name: 'ฟิวเจอร์พาร์ค รังสิต', lat: 13.9892, lng: 100.6177 },
  { name: 'เมกาบางนา', lat: 13.6468, lng: 100.6802 },
  { name: 'เซ็นทรัลเวสต์เกต', lat: 13.8767, lng: 100.4116 },
];

const selectPreset = (p: { lat: number; lng: number }) => {
  manualLat.value = p.lat.toString();
  manualLng.value = p.lng.toString();
  emit('selectLocation', { lat: p.lat, lng: p.lng });
};

const applyManualCoords = () => {
  const lat = parseFloat(manualLat.value);
  const lng = parseFloat(manualLng.value);
  if (!isNaN(lat) && !isNaN(lng)) {
    emit('selectLocation', { lat, lng });
  }
};
</script>

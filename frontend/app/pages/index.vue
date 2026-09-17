<template>
  <main class="flex-1 flex flex-col bg-slate-50 min-h-screen">
    <!-- Navbar Header -->
    <header class="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-lg">
            <span>📍</span>
            <span class="absolute -top-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-black text-slate-900 leading-tight tracking-tight">Commute Tracker</h1>
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Nuxt 4 Pro</span>
            </div>
            <p class="text-xs text-slate-500 hidden sm:block">ระบบติดตามและวิเคราะห์เส้นทางไปบริษัทแบบ Real-time</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Smart Alarm Launch Button in Header -->
          <button
            v-if="routeData"
            @click="isAlarmModalOpen = true"
            type="button"
            class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-2xs"
          >
            <span>⏰</span>
            <span class="hidden sm:inline">ตั้งเวลาออกจากบ้าน</span>
          </button>

          <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/90 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span class="truncate max-w-[140px] sm:max-w-none">ปลายทาง: {{ companyName }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Layout -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <!-- Left Panel: Controls & Information (5 Cols on LG) -->
        <div class="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
          
          <!-- Card: Location Status & Refresh -->
          <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span class="w-6 h-6 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs">🎯</span>
                <span>จุดเริ่มต้นการเดินทาง</span>
              </h2>
              <button
                @click="handleRequestLocation"
                :disabled="geoStatus === 'prompting' || isRouteLoading"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-xs font-semibold text-blue-600 hover:bg-blue-100/80 disabled:opacity-50 transition-all active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3.5 h-3.5"
                  :class="{ 'animate-spin': geoStatus === 'prompting' }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>ค้นหา GPS อีกครั้ง</span>
              </button>
            </div>

            <!-- Geolocation Status Badges / Alerts -->
            <div v-if="geoStatus === 'prompting'" class="p-3.5 bg-blue-50/90 border border-blue-100 rounded-2xl flex items-center gap-3 text-xs text-blue-800 animate-pulse">
              <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังขออนุญาตเข้าถึงพิกัด GPS จากเบราว์เซอร์ของคุณ...</span>
            </div>

            <div v-else-if="geoStatus === 'granted' && userCoords" class="p-3 bg-emerald-50/90 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                <span class="font-medium">พิกัด GPS: {{ userCoords.lat.toFixed(4) }}, {{ userCoords.lng.toFixed(4) }}</span>
              </div>
              <span class="text-[10px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                LIVE GPS
              </span>
            </div>

            <div v-else-if="geoStatus === 'denied'" class="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
              <div class="flex items-center gap-2 font-bold">
                <span class="text-rose-600">⚠️</span>
                <span>การเข้าถึงตำแหน่ง GPS ถูกปฏิเสธ (Permission Denied)</span>
              </div>
              <p class="text-[11px] text-rose-700 leading-relaxed">คุณสามารถเลือกจุดเริ่มต้นยอดนิยม หรือกรอกพิกัดจำลองในกล่องสำรองด้านล่างได้ทันทีครับ</p>
            </div>

            <div v-else-if="geoStatus === 'timeout' || geoStatus === 'error'" class="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
              <span>⚠️ {{ geoError || 'ไม่สามารถระบุตำแหน่ง GPS ได้ กรุณาใช้ตัวเลือกด้านล่าง' }}</span>
            </div>

            <!-- Travel Mode Selector -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-2">เลือกรูปแบบการเดินทาง:</label>
              <TravelModeSelector
                :model-value="activeMode"
                @update:model-value="handleModeChange"
              />
            </div>

            <!-- Fallback Location Component (When denied or manually toggled) -->
            <FallbackLocationInput
              v-if="geoStatus === 'denied' || geoStatus === 'timeout' || !userCoords"
              @select-location="handleManualLocation"
            />
          </div>

          <!-- Loading Indicator for Route Calculation -->
          <div
            v-if="isRouteLoading"
            class="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 text-center"
          >
            <div class="relative flex items-center justify-center">
              <div class="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span class="absolute text-sm">🛰️</span>
            </div>
            <div>
              <p class="text-xs font-bold text-slate-800">กำลังวิเคราะห์ข้อมูลจราจรและเส้นทาง...</p>
              <p class="text-[11px] text-slate-400 mt-0.5">เรียก Google Routes API ฝั่ง Backend Proxy แบบ Real-time</p>
            </div>
          </div>

          <!-- Route Error Message (Human Readable) -->
          <div
            v-else-if="routeError"
            class="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-xs text-rose-800 space-y-2 shadow-xs"
          >
            <div class="flex items-center gap-2 font-bold text-rose-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ไม่สามารถคำนวณเส้นทางได้</span>
            </div>
            <p class="text-[11px] text-rose-700 leading-relaxed">{{ routeError }}</p>
          </div>

          <!-- Route Summary Card -->
          <RouteSummaryCard
            v-else-if="routeData"
            :route-data="routeData"
          />

          <!-- Multimodal Comparison Matrix (Advanced Feature) -->
          <MultimodalComparison
            v-if="routeData"
            :active-mode="activeMode"
            :distance-km="(routeData.distance.value || 5200) / 1000"
            :driving-minutes="Math.round((routeData.duration_in_traffic?.value || routeData.duration.value || 1500) / 60)"
            @select-mode="handleModeChange"
          />

          <!-- Destination Info Details -->
          <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div class="flex items-center justify-between text-slate-800 font-bold">
              <span class="flex items-center gap-1.5">
                <span>🏢</span>
                <span>ข้อมูลบริษัทปลายทาง</span>
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">ตั้งค่าผ่าน .env</span>
            </div>
            <p class="text-slate-800 font-semibold">{{ companyName }}</p>
            <p class="text-[11px] text-slate-400 font-mono">พิกัด: {{ destinationCoords.lat }}, {{ destinationCoords.lng }}</p>
          </div>
        </div>

        <!-- Right Panel: Google Map Canvas (7 Cols on LG) -->
        <div class="lg:col-span-7 flex flex-col order-1 lg:order-2 min-h-[500px] lg:min-h-full">
          <GoogleMap
            :origin="userCoords"
            :destination="destinationCoords"
            :company-name="companyName"
            :overview-polyline="routeData?.overviewPolyline || null"
            :travel-mode="activeMode"
          />
        </div>

      </div>
    </div>

    <!-- Smart Alarm Modal (Advanced Feature) -->
    <SmartAlarmModal
      :is-open="isAlarmModalOpen"
      :duration-seconds="routeData?.duration_in_traffic?.value || routeData?.duration.value || 1500"
      :commute-duration-text="routeData?.duration_in_traffic?.text || routeData?.duration.text || '25 นาที'"
      @close="isAlarmModalOpen = false"
    />

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="font-medium text-slate-500">Commute Tracker • Full-stack Nuxt 4 + Express TypeScript Proxy</p>
        <p class="text-[11px]">Powered by Google Routes API & Maps JavaScript API</p>
      </div>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { LatLng, TravelMode } from '~/types';
import { useGeolocation } from '~/composables/useGeolocation';
import { useRouteTracker } from '~/composables/useRouteTracker';
import SmartAlarmModal from '~/components/SmartAlarmModal.vue';
import MultimodalComparison from '~/components/MultimodalComparison.vue';

const config = useRuntimeConfig();

// ปลายทาง: บริษัท
const companyName = ref(config.public.companyName || 'อาคารสาทรสแควร์ (Sathorn Square)');
const destinationCoords = ref<LatLng>({
  lat: parseFloat(config.public.companyLat || '13.7226'),
  lng: parseFloat(config.public.companyLng || '100.5284'),
});

const isAlarmModalOpen = ref(false);

const {
  status: geoStatus,
  userCoords,
  errorMessage: geoError,
  requestLocation,
  setManualCoords,
} = useGeolocation();

const {
  routeData,
  isLoading: isRouteLoading,
  error: routeError,
  activeMode,
  fetchRoute,
} = useRouteTracker();

// เมื่อขอพิกัดผู้ใช้สำเร็จ ให้ยิงคำนวณเส้นทางทันที
const handleRequestLocation = async () => {
  const coords = await requestLocation();
  if (coords) {
    await fetchRoute(coords, destinationCoords.value, activeMode.value);
  }
};

// กรณีผู้ใช้เลือกจุดพิกัดสำรองเอง
const handleManualLocation = async (coords: LatLng) => {
  setManualCoords(coords);
  await fetchRoute(coords, destinationCoords.value, activeMode.value);
};

// เมื่อผู้ใช้สลับโหมดเดินทาง (ขับรถ/รถสาธารณะ/เดิน/จักรยาน)
const handleModeChange = async (mode: TravelMode) => {
  activeMode.value = mode;
  if (userCoords.value) {
    await fetchRoute(userCoords.value, destinationCoords.value, mode);
  }
};

onMounted(async () => {
  // ขอพิกัดผู้ใช้ทันทีเมื่อโหลดหน้าเว็บ
  await handleRequestLocation();
});
</script>

<template>
  <main class="flex-1 flex flex-col">
    <!-- Navbar Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold text-lg">
            📍
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">Commute Tracker</h1>
            <p class="text-xs text-slate-500">ระบบคำนวณและแสดงเส้นทางไปบริษัทแบบ Real-time</p>
          </div>
        </div>

        <div class="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ปลายทาง: {{ companyName }}</span>
        </div>
      </div>
    </header>

    <!-- Main Content Layout -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <!-- Left Panel: Controls & Information (5 Cols on LG) -->
        <div class="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
          
          <!-- Card: Location Status & Refresh -->
          <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>🎯</span> ตำแหน่งปัจจุบันของคุณ
              </h2>
              <button
                @click="handleRequestLocation"
                :disabled="geoStatus === 'prompting' || isRouteLoading"
                class="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  :class="{ 'animate-spin': geoStatus === 'prompting' }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>รีเฟรชตำแหน่ง</span>
              </button>
            </div>

            <!-- Geolocation Status Badges / Alerts -->
            <div v-if="geoStatus === 'prompting'" class="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 text-xs text-blue-800">
              <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>กำลังขออนุญาตเข้าถึงพิกัด GPS จากเบราว์เซอร์ของคุณ...</span>
            </div>

            <div v-else-if="geoStatus === 'granted' && userCoords" class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>พบตำแหน่ง GPS แล้ว: {{ userCoords.lat.toFixed(4) }}, {{ userCoords.lng.toFixed(4) }}</span>
              </div>
              <span class="text-[10px] text-emerald-600 font-mono">GPS Active</span>
            </div>

            <div v-else-if="geoStatus === 'denied'" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
              <div class="flex items-center gap-2 font-medium">
                <span class="text-rose-600">⚠️</span>
                <span>การเข้าถึงตำแหน่ง GPS ถูกปฏิเสธ (Permission Denied)</span>
              </div>
              <p class="text-[11px] text-rose-700">กรุณาเปิดสิทธิ์ในเบราว์เซอร์ หรือเลือกตำแหน่งจำลอง/กรอกพิกัดเองในกล่องสำรองด้านล่าง</p>
            </div>

            <div v-else-if="geoStatus === 'timeout' || geoStatus === 'error'" class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <span>⚠️ {{ geoError || 'ไม่สามารถระบุตำแหน่ง GPS ได้ กรุณาใช้ตัวเลือกด้านล่าง' }}</span>
            </div>

            <!-- Travel Mode Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-2">เลือกรูปแบบการเดินทาง:</label>
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
            class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3 text-center"
          >
            <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-medium text-slate-600">กำลังส่งข้อมูลให้ Backend Proxy คำนวณเส้นทางและเวลาตามสภาพจราจร Real-time...</p>
          </div>

          <!-- Route Error Message (Human Readable) -->
          <div
            v-else-if="routeError"
            class="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 space-y-1.5"
          >
            <div class="flex items-center gap-2 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>ไม่สามารถคำนวณเส้นทางได้</span>
            </div>
            <p class="text-[11px] text-rose-700">{{ routeError }}</p>
          </div>

          <!-- Route Summary Card -->
          <RouteSummaryCard
            v-else-if="routeData"
            :route-data="routeData"
          />

          <!-- Destination Info Details -->
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-xs text-slate-600 space-y-2">
            <div class="flex items-center justify-between text-slate-800 font-semibold">
              <span>🏢 ข้อมูลบริษัทปลายทาง</span>
              <span class="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">ค่าคงที่จาก .env</span>
            </div>
            <p class="text-slate-700 font-medium">{{ companyName }}</p>
            <p class="text-[11px] text-slate-400">พิกัดปลายทาง: {{ destinationCoords.lat }}, {{ destinationCoords.lng }}</p>
          </div>
        </div>

        <!-- Right Panel: Google Map Canvas (7 Cols on LG) -->
        <div class="lg:col-span-7 flex flex-col order-1 lg:order-2 min-h-[420px] lg:min-h-full">
          <GoogleMap
            :origin="userCoords"
            :destination="destinationCoords"
            :company-name="companyName"
            :overview-polyline="routeData?.overviewPolyline || null"
          />
        </div>

      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Commute Tracker • Full-stack Nuxt 4 + Express TypeScript Proxy</p>
        <p>Google Maps Directions API Real-time Integration</p>
      </div>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { LatLng, TravelMode } from '~/types';
import { useGeolocation } from '~/composables/useGeolocation';
import { useRouteTracker } from '~/composables/useRouteTracker';

const config = useRuntimeConfig();

// ปลายทาง: บริษัท
const companyName = ref(config.public.companyName || 'อาคารสาทรสแควร์ (Sathorn Square)');
const destinationCoords = ref<LatLng>({
  lat: parseFloat(config.public.companyLat || '13.7226'),
  lng: parseFloat(config.public.companyLng || '100.5284'),
});

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

// เมื่อผู้ใช้สลับโหมดเดินทาง (ขับรถ/รถสาธารณะ/เดิน)
const handleModeChange = async (mode: TravelMode) => {
  if (userCoords.value) {
    await fetchRoute(userCoords.value, destinationCoords.value, mode);
  } else {
    activeMode.value = mode;
  }
};

onMounted(async () => {
  // ขอพิกัดผู้ใช้ทันทีเมื่อโหลดหน้าเว็บ
  await handleRequestLocation();
});
</script>

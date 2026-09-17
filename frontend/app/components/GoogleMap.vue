<template>
  <div class="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 flex flex-col">
    <!-- Map Canvas Container -->
    <div ref="mapElement" class="w-full h-full min-h-[500px] flex-1"></div>

    <!-- Floating Top Bar Controls -->
    <div class="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      <!-- Live Status & Simulation Trigger -->
      <div class="pointer-events-auto flex items-center gap-2">
        <div class="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-slate-200/80 flex items-center gap-2 text-xs font-bold text-slate-800">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
          </span>
          <span class="hidden sm:inline">ระบบติดตาม Real-time</span>
          <span class="sm:hidden">GPS Live</span>
        </div>

        <!-- Simulation Launch Button -->
        <button
          v-if="overviewPolyline && !isSimulating"
          @click="startSimulation"
          type="button"
          class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-full shadow-lg shadow-blue-500/25 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>🎮</span>
          <span>จำลองขับรถ GPS</span>
        </button>
      </div>

      <!-- Advanced Controls: Traffic Layer, Map Theme, Recenter, External Maps -->
      <div class="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-slate-200/80">
        <!-- Live Traffic Toggle -->
        <button
          @click="toggleTrafficLayer"
          type="button"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
          :class="isTrafficEnabled ? 'bg-amber-100 text-amber-900 shadow-xs' : 'text-slate-700 hover:bg-slate-100'"
          title="เปิด/ปิด เลเยอร์สภาพจราจรสดของ Google (เส้นเขียว/เหลือง/แดง)"
        >
          <span>🚦</span>
          <span class="hidden md:inline">{{ isTrafficEnabled ? 'จราจรสด: เปิด' : 'จราจรสด' }}</span>
        </button>

        <!-- Map Style Cycle (Normal -> Dark -> Satellite) -->
        <button
          @click="cycleMapTheme"
          type="button"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
          title="สลับมุมมองแผนที่ (ปกติ / กลางคืน / ดาวเทียม)"
        >
          <span>{{ currentThemeIcon }}</span>
          <span class="hidden md:inline">{{ currentThemeLabel }}</span>
        </button>

        <span class="text-slate-300">|</span>

        <!-- Quick Focus Buttons -->
        <button
          v-if="origin"
          @click="focusLocation('origin')"
          type="button"
          class="px-2 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="เลื่อนไปตำแหน่งคุณ"
        >
          📍 ฉัน
        </button>

        <button
          @click="focusLocation('destination')"
          type="button"
          class="px-2 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          title="เลื่อนไปบริษัท"
        >
          🏢 บริษัท
        </button>

        <button
          v-if="origin"
          @click="fitAllBounds"
          type="button"
          class="px-2 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          title="แสดงภาพรวมทั้ง 2 จุด"
        >
          🧭 ภาพรวม
        </button>

        <a
          v-if="origin"
          :href="googleMapsExternalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
          title="เปิดในแอป Google Maps จริง"
        >
          <span>Maps ↗</span>
        </a>
      </div>
    </div>

    <!-- Virtual GPS Drive Simulation HUD Overlay -->
    <SimulationHUD
      :is-active="isSimulating"
      :is-paused="isSimPaused"
      :progress-percent="simProgressPercent"
      :current-speed="simSpeed"
      :remaining-distance-km="simRemainingKm"
      :speed-multiplier="simSpeedMultiplier"
      @toggle-pause="toggleSimPause"
      @stop="stopSimulation"
      @cycle-speed="cycleSimSpeed"
    />

    <!-- Loading Indicator -->
    <div
      v-if="isMapLoading"
      class="absolute inset-0 bg-slate-50/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-20"
    >
      <div class="relative flex items-center justify-center">
        <div class="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
        <span class="absolute text-xl">🚗</span>
      </div>
      <div class="text-center">
        <p class="text-sm font-bold text-slate-800">กำลังเชื่อมต่อดาวเทียม Google Maps</p>
        <p class="text-xs text-slate-500 mt-0.5">กำลังโหลดข้อมูลแผนที่และเลเยอร์พิกัด...</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="mapError"
      class="absolute inset-0 bg-red-50/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30"
    >
      <div class="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-3 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h4 class="text-base font-bold text-red-800 mb-1">ไม่สามารถเชื่อมต่อ Google Maps ได้</h4>
      <p class="text-xs text-red-600 max-w-md">{{ mapError }}</p>
    </div>

    <!-- Map Bottom Badges & Compass Info -->
    <div v-if="!isSimulating" class="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
      <div class="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs flex items-center gap-3">
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-xs"></span>
          <span>จุดเริ่มต้น (คุณ)</span>
        </span>
        <span class="text-slate-300">|</span>
        <span class="flex items-center gap-1.5 font-medium text-slate-700">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block shadow-xs"></span>
          <span>ปลายทาง ({{ companyName }})</span>
        </span>
      </div>

      <div v-if="overviewPolyline" class="hidden sm:flex pointer-events-auto bg-emerald-500/90 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md items-center gap-1.5 animate-pulse">
        <span>เส้นทางเดินทางพร้อมแล้ว</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import type { LatLng, TravelMode } from '~/types';
import SimulationHUD from './SimulationHUD.vue';

const props = defineProps<{
  origin: LatLng | null;
  destination: LatLng;
  companyName: string;
  overviewPolyline: string | null;
  travelMode?: TravelMode;
}>();

const config = useRuntimeConfig();
const mapElement = ref<HTMLElement | null>(null);
const isMapLoading = ref(true);
const mapError = ref<string | null>(null);

// Google Maps instances
let googleMapInstance: google.maps.Map | null = null;
let originMarker: google.maps.Marker | null = null;
let destinationMarker: google.maps.Marker | null = null;
let routePolylineInstance: google.maps.Polyline | null = null;
let trafficLayerInstance: google.maps.TrafficLayer | null = null;
let googleMapsObj: typeof google.maps | null = null;
let polylineAnimationTimer: any = null;

// Advanced Feature: Traffic Layer Toggle
const isTrafficEnabled = ref(false);

// Advanced Feature: Map Themes (Standard -> Dark Mode -> Satellite Hybrid)
const mapTheme = ref<'standard' | 'dark' | 'satellite'>('standard');

const currentThemeIcon = computed(() => {
  if (mapTheme.value === 'dark') return '🌙';
  if (mapTheme.value === 'satellite') return '🛰️';
  return '☀️';
});

const currentThemeLabel = computed(() => {
  if (mapTheme.value === 'dark') return 'ธีมกลางคืน';
  if (mapTheme.value === 'satellite') return 'ดาวเทียม';
  return 'แผนที่ปกติ';
});

// Advanced Feature: GPS Drive Simulation State
const isSimulating = ref(false);
const isSimPaused = ref(false);
const simProgressPercent = ref(0);
const simSpeed = ref(58);
const simRemainingKm = ref('0.0');
const simSpeedMultiplier = ref(1);

let simulationVehicleMarker: google.maps.Marker | null = null;
let simulationPathPoints: google.maps.LatLng[] = [];
let simCurrentIndex = 0;
let simulationTimer: any = null;

// Official Google Dark Mode Styles
const darkModeStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

// External Google Maps Link
const googleMapsExternalUrl = computed(() => {
  if (!props.origin) return '#';
  const modeParam = props.travelMode === 'transit' ? 'transit' : props.travelMode === 'walking' ? 'walking' : props.travelMode === 'bicycling' ? 'bicycling' : 'driving';
  return `https://www.google.com/maps/dir/?api=1&origin=${props.origin.lat},${props.origin.lng}&destination=${props.destination.lat},${props.destination.lng}&travelmode=${modeParam}`;
});

const initMap = async () => {
  const apiKey = config.public.googleMapsApiKey;

  if (!apiKey) {
    mapError.value = 'ยังไม่ได้ตั้งค่า VITE_GOOGLE_MAPS_API_KEY ใน .env';
    isMapLoading.value = false;
    return;
  }

  try {
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['geometry'],
      language: 'th',
    });

    const google = await loader.load();
    googleMapsObj = google.maps;

    if (!mapElement.value) return;

    googleMapInstance = new google.maps.Map(mapElement.value, {
      center: { lat: props.destination.lat, lng: props.destination.lng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'simplified' }],
        },
      ],
    });

    renderMarkersAndRoute();
    isMapLoading.value = false;
  } catch (err: any) {
    console.error('Google Maps Loader error:', err);
    mapError.value = 'เกิดข้อผิดพลาดในการโหลด Google Maps API กรุณาตรวจสอบการตั้งค่า API Key';
    isMapLoading.value = false;
  }
};

const renderMarkersAndRoute = () => {
  if (!googleMapInstance || !googleMapsObj) return;

  const bounds = new googleMapsObj.LatLngBounds();

  // Destination Marker
  if (!destinationMarker) {
    destinationMarker = new googleMapsObj.Marker({
      position: { lat: props.destination.lat, lng: props.destination.lng },
      map: googleMapInstance,
      title: props.companyName,
      animation: googleMapsObj.Animation.DROP,
      icon: {
        path: googleMapsObj.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#e11d48',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    });

    const infoWindow = new googleMapsObj.InfoWindow({
      content: `<div style="font-family: 'Prompt', sans-serif; padding: 6px;"><strong style="color: #0f172a;">${props.companyName}</strong><br><span style="font-size: 11px; color: #64748b;">🏢 จุดหมายปลายทาง (บริษัท)</span></div>`,
    });

    destinationMarker.addListener('click', () => {
      infoWindow.open(googleMapInstance, destinationMarker);
    });
  } else {
    destinationMarker.setPosition({ lat: props.destination.lat, lng: props.destination.lng });
  }

  bounds.extend(new googleMapsObj.LatLng(props.destination.lat, props.destination.lng));

  // Origin Marker
  if (props.origin) {
    const originLatLng = new googleMapsObj.LatLng(props.origin.lat, props.origin.lng);

    if (!originMarker) {
      originMarker = new googleMapsObj.Marker({
        position: originLatLng,
        map: googleMapInstance,
        title: 'ตำแหน่งของคุณ',
        animation: googleMapsObj.Animation.DROP,
        icon: {
          path: googleMapsObj.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });

      const userWindow = new googleMapsObj.InfoWindow({
        content: `<div style="font-family: 'Prompt', sans-serif; padding: 6px;"><strong style="color: #1d4ed8;">📍 ตำแหน่งของคุณ</strong><br><span style="font-size: 11px; color: #64748b;">จุดเริ่มต้นการเดินทาง</span></div>`,
      });

      originMarker.addListener('click', () => {
        userWindow.open(googleMapInstance, originMarker);
      });
    } else {
      originMarker.setPosition(originLatLng);
      originMarker.setMap(googleMapInstance);
    }

    bounds.extend(originLatLng);
  } else if (originMarker) {
    originMarker.setMap(null);
  }

  // Draw Polyline & Animate Arrow Flow
  if (props.overviewPolyline && googleMapsObj.geometry?.encoding) {
    const decodedPath = googleMapsObj.geometry.encoding.decodePath(props.overviewPolyline);
    simulationPathPoints = decodedPath;

    if (routePolylineInstance) {
      routePolylineInstance.setMap(null);
    }

    const arrowSymbol = {
      path: googleMapsObj.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 3.5,
      strokeColor: '#1d4ed8',
      fillColor: '#60a5fa',
      fillOpacity: 1,
      strokeWeight: 1.5,
    };

    routePolylineInstance = new googleMapsObj.Polyline({
      path: decodedPath,
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.85,
      strokeWeight: 6,
      icons: [
        {
          icon: arrowSymbol,
          offset: '0%',
        },
      ],
      map: googleMapInstance,
    });

    startArrowAnimation();
    decodedPath.forEach((pt) => bounds.extend(pt));
  } else if (routePolylineInstance) {
    stopArrowAnimation();
    routePolylineInstance.setMap(null);
    simulationPathPoints = [];
  }

  // Fit Bounds
  if (props.origin && !isSimulating.value) {
    googleMapInstance.fitBounds(bounds, {
      top: 60,
      right: 50,
      bottom: 60,
      left: 50,
    });
  } else if (!isSimulating.value) {
    googleMapInstance.setCenter({ lat: props.destination.lat, lng: props.destination.lng });
    googleMapInstance.setZoom(14);
  }
};

// Polyline Arrow Animation
const startArrowAnimation = () => {
  stopArrowAnimation();
  let count = 0;
  polylineAnimationTimer = setInterval(() => {
    count = (count + 1) % 200;
    if (routePolylineInstance) {
      const icons = routePolylineInstance.get('icons');
      if (icons && icons[0]) {
        icons[0].offset = count / 2 + '%';
        routePolylineInstance.set('icons', icons);
      }
    }
  }, 40);
};

const stopArrowAnimation = () => {
  if (polylineAnimationTimer) {
    clearInterval(polylineAnimationTimer);
    polylineAnimationTimer = null;
  }
};

// Toggle Traffic Layer
const toggleTrafficLayer = () => {
  if (!googleMapInstance || !googleMapsObj) return;
  isTrafficEnabled.value = !isTrafficEnabled.value;

  if (isTrafficEnabled.value) {
    if (!trafficLayerInstance) {
      trafficLayerInstance = new googleMapsObj.TrafficLayer();
    }
    trafficLayerInstance.setMap(googleMapInstance);
  } else {
    trafficLayerInstance?.setMap(null);
  }
};

// Cycle Map Theme (Standard -> Dark -> Satellite)
const cycleMapTheme = () => {
  if (!googleMapInstance) return;

  if (mapTheme.value === 'standard') {
    mapTheme.value = 'dark';
    googleMapInstance.setMapTypeId('roadmap');
    googleMapInstance.setOptions({ styles: darkModeStyles });
  } else if (mapTheme.value === 'dark') {
    mapTheme.value = 'satellite';
    googleMapInstance.setMapTypeId('hybrid');
    googleMapInstance.setOptions({ styles: [] });
  } else {
    mapTheme.value = 'standard';
    googleMapInstance.setMapTypeId('roadmap');
    googleMapInstance.setOptions({ styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'simplified' }] }] });
  }
};

// === Advanced GPS Drive Simulation ===
const startSimulation = () => {
  if (!simulationPathPoints.length || !googleMapInstance || !googleMapsObj) return;

  isSimulating.value = true;
  isSimPaused.value = false;
  simCurrentIndex = 0;

  if (!simulationVehicleMarker) {
    simulationVehicleMarker = new googleMapsObj.Marker({
      position: simulationPathPoints[0],
      map: googleMapInstance,
      title: 'รถยนต์ของคุณกำลังเดินทาง',
      icon: {
        path: googleMapsObj.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        rotation: 0,
      },
    });
  } else {
    simulationVehicleMarker.setPosition(simulationPathPoints[0]);
    simulationVehicleMarker.setMap(googleMapInstance);
  }

  googleMapInstance.setCenter(simulationPathPoints[0]);
  googleMapInstance.setZoom(17);

  runSimulationStep();
};

const runSimulationStep = () => {
  clearInterval(simulationTimer);
  const baseInterval = 100 / simSpeedMultiplier.value;

  simulationTimer = setInterval(() => {
    if (isSimPaused.value) return;

    if (simCurrentIndex >= simulationPathPoints.length - 1) {
      simProgressPercent.value = 100;
      simRemainingKm.value = '0.0';
      clearInterval(simulationTimer);
      alert('🎉 ยินดีด้วย! คุณเดินทางถึงบริษัทปลายทางเรียบร้อยแล้ว');
      stopSimulation();
      return;
    }

    simCurrentIndex++;
    const currentPoint = simulationPathPoints[simCurrentIndex];
    const prevPoint = simulationPathPoints[simCurrentIndex - 1];

    if (simulationVehicleMarker && googleMapInstance && googleMapsObj) {
      simulationVehicleMarker.setPosition(currentPoint);

      // Compute heading angle
      if (googleMapsObj.geometry?.spherical) {
        const heading = googleMapsObj.geometry.spherical.computeHeading(prevPoint, currentPoint);
        const icon = simulationVehicleMarker.getIcon() as google.maps.Symbol;
        if (icon) {
          icon.rotation = heading;
          simulationVehicleMarker.setIcon(icon);
        }
      }

      // Camera Follow
      googleMapInstance.panTo(currentPoint);

      // Metrics computation
      const totalPoints = simulationPathPoints.length;
      simProgressPercent.value = Math.round((simCurrentIndex / totalPoints) * 100);
      const remainingPoints = totalPoints - simCurrentIndex;
      simRemainingKm.value = ((remainingPoints / totalPoints) * 5.2).toFixed(1);

      // Fluctuate realistic virtual speed (45 - 68 km/h)
      simSpeed.value = 45 + Math.floor(Math.sin(simCurrentIndex * 0.3) * 18 + 5);
    }
  }, baseInterval);
};

const toggleSimPause = () => {
  isSimPaused.value = !isSimPaused.value;
};

const cycleSimSpeed = () => {
  if (simSpeedMultiplier.value === 1) simSpeedMultiplier.value = 2;
  else if (simSpeedMultiplier.value === 2) simSpeedMultiplier.value = 4;
  else simSpeedMultiplier.value = 1;
  runSimulationStep();
};

const stopSimulation = () => {
  clearInterval(simulationTimer);
  isSimulating.value = false;
  if (simulationVehicleMarker) {
    simulationVehicleMarker.setMap(null);
  }
  fitAllBounds();
};

const focusLocation = (type: 'origin' | 'destination') => {
  if (!googleMapInstance) return;
  if (type === 'origin' && props.origin) {
    googleMapInstance.panTo({ lat: props.origin.lat, lng: props.origin.lng });
    googleMapInstance.setZoom(16);
  } else if (type === 'destination') {
    googleMapInstance.panTo({ lat: props.destination.lat, lng: props.destination.lng });
    googleMapInstance.setZoom(16);
  }
};

const fitAllBounds = () => {
  if (!googleMapInstance || !googleMapsObj) return;
  const bounds = new googleMapsObj.LatLngBounds();
  bounds.extend(new googleMapsObj.LatLng(props.destination.lat, props.destination.lng));
  if (props.origin) {
    bounds.extend(new googleMapsObj.LatLng(props.origin.lat, props.origin.lng));
  }
  googleMapInstance.fitBounds(bounds, { top: 60, right: 50, bottom: 60, left: 50 });
};

watch(
  () => [props.origin, props.destination, props.overviewPolyline],
  () => {
    renderMarkersAndRoute();
  },
  { deep: true }
);

onMounted(() => {
  initMap();
});

onBeforeUnmount(() => {
  stopArrowAnimation();
  clearInterval(simulationTimer);
});
</script>

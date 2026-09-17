<template>
  <div class="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
    <!-- Map Canvas Container -->
    <div ref="mapElement" class="w-full h-full min-h-[420px]"></div>

    <!-- Loading Indicator -->
    <div
      v-if="isMapLoading"
      class="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10"
    >
      <div class="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm font-medium text-slate-700">กำลังโหลดแผนที่ Google Maps...</p>
    </div>

    <!-- Error State -->
    <div
      v-if="mapError"
      class="absolute inset-0 bg-red-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20"
    >
      <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h4 class="text-base font-semibold text-red-800 mb-1">ไม่สามารถโหลดแผนที่ได้</h4>
      <p class="text-xs text-red-600 max-w-md">{{ mapError }}</p>
    </div>

    <!-- Map Overlay Badges -->
    <div class="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs flex items-center gap-3">
      <span class="flex items-center gap-1.5 font-medium text-slate-700">
        <span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> คุณ (ต้นทาง)
      </span>
      <span class="flex items-center gap-1.5 font-medium text-slate-700">
        <span class="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span> บริษัท (ปลายทาง)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';
import type { LatLng } from '~/types';

const props = defineProps<{
  origin: LatLng | null;
  destination: LatLng;
  companyName: string;
  overviewPolyline: string | null;
}>();

const config = useRuntimeConfig();
const mapElement = ref<HTMLElement | null>(null);
const isMapLoading = ref(true);
const mapError = ref<string | null>(null);

let googleMapInstance: google.maps.Map | null = null;
let originMarker: google.maps.Marker | null = null;
let destinationMarker: google.maps.Marker | null = null;
let routePolylineInstance: google.maps.Polyline | null = null;
let googleMapsObj: typeof google.maps | null = null;

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
    mapError.value = 'เกิดข้อผิดพลาดในการโหลด Google Maps API กรุณาตรวจสอบ API Key และการจำกัดโดเมน';
    isMapLoading.value = false;
  }
};

const renderMarkersAndRoute = () => {
  if (!googleMapInstance || !googleMapsObj) return;

  const bounds = new googleMapsObj.LatLngBounds();

  // ปลายทาง: บริษัท
  if (!destinationMarker) {
    destinationMarker = new googleMapsObj.Marker({
      position: { lat: props.destination.lat, lng: props.destination.lng },
      map: googleMapInstance,
      title: props.companyName,
      icon: {
        path: googleMapsObj.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    const infoWindow = new googleMapsObj.InfoWindow({
      content: `<div style="font-family: 'Prompt', sans-serif; padding: 4px;"><strong>${props.companyName}</strong><br><span style="font-size: 12px; color: #64748b;">จุดหมายปลายทาง</span></div>`,
    });

    destinationMarker.addListener('click', () => {
      infoWindow.open(googleMapInstance, destinationMarker);
    });
  } else {
    destinationMarker.setPosition({ lat: props.destination.lat, lng: props.destination.lng });
  }

  bounds.extend(new googleMapsObj.LatLng(props.destination.lat, props.destination.lng));

  // ต้นทาง: ผู้ใช้
  if (props.origin) {
    const originLatLng = new googleMapsObj.LatLng(props.origin.lat, props.origin.lng);

    if (!originMarker) {
      originMarker = new googleMapsObj.Marker({
        position: originLatLng,
        map: googleMapInstance,
        title: 'ตำแหน่งของคุณ',
        icon: {
          path: googleMapsObj.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    } else {
      originMarker.setPosition(originLatLng);
      originMarker.setMap(googleMapInstance);
    }

    bounds.extend(originLatLng);
  } else if (originMarker) {
    originMarker.setMap(null);
  }

  // วาด Polyline
  if (props.overviewPolyline && googleMapsObj.geometry?.encoding) {
    const decodedPath = googleMapsObj.geometry.encoding.decodePath(props.overviewPolyline);

    if (routePolylineInstance) {
      routePolylineInstance.setMap(null);
    }

    routePolylineInstance = new googleMapsObj.Polyline({
      path: decodedPath,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.85,
      strokeWeight: 5,
      map: googleMapInstance,
    });

    // ขยาย bounds ให้ครอบคลุมทุกจุดใน polyline
    decodedPath.forEach((pt) => bounds.extend(pt));
  } else if (routePolylineInstance) {
    routePolylineInstance.setMap(null);
  }

  // Fit Bounds อัตโนมัติให้เห็นทั้งต้นทางและปลายทาง
  if (props.origin) {
    googleMapInstance.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    });
  } else {
    googleMapInstance.setCenter({ lat: props.destination.lat, lng: props.destination.lng });
    googleMapInstance.setZoom(14);
  }
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
</script>

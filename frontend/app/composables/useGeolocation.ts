import { ref } from 'vue';
import type { LatLng, GeolocationStatus } from '~/types';

export function useGeolocation() {
  const status = ref<GeolocationStatus>('idle');
  const userCoords = ref<LatLng | null>(null);
  const errorMessage = ref<string>('');

  const requestLocation = (): Promise<LatLng | null> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        status.value = 'unsupported';
        errorMessage.value = 'เบราว์เซอร์หรืออุปกรณ์ของคุณไม่รองรับการระบุตำแหน่ง GPS';
        resolve(null);
        return;
      }

      status.value = 'prompting';
      errorMessage.value = '';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          userCoords.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          status.value = 'granted';
          errorMessage.value = '';
          resolve(userCoords.value);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              status.value = 'denied';
              errorMessage.value = 'คุณได้ปฏิเสธการเข้าถึงตำแหน่งที่ตั้ง กรุณากรอกที่อยู่หรือเลือกจุดเริ่มต้นด้วยตัวเอง';
              break;
            case error.POSITION_UNAVAILABLE:
              status.value = 'error';
              errorMessage.value = 'ไม่สามารถค้นหาตำแหน่งปัจจุบันของอุปกรณ์ได้ในขณะนี้';
              break;
            case error.TIMEOUT:
              status.value = 'timeout';
              errorMessage.value = 'การค้นหาตำแหน่งใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
              break;
            default:
              status.value = 'error';
              errorMessage.value = 'เกิดข้อผิดพลาดในการดึงตำแหน่งที่ตั้ง';
              break;
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const setManualCoords = (coords: LatLng) => {
    userCoords.value = coords;
    status.value = 'granted';
    errorMessage.value = '';
  };

  return {
    status,
    userCoords,
    errorMessage,
    requestLocation,
    setManualCoords,
  };
}

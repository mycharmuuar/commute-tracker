import { ref } from 'vue';
import type { LatLng, TravelMode, RouteResponse } from '~/types';

export function useRouteTracker() {
  const config = useRuntimeConfig();
  const backendUrl = config.public.backendUrl || 'http://localhost:3001';

  const routeData = ref<RouteResponse | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const activeMode = ref<TravelMode>('driving');

  const fetchRoute = async (
    origin: LatLng,
    destination: LatLng | string,
    mode: TravelMode = 'driving'
  ) => {
    isLoading.value = true;
    error.value = null;
    activeMode.value = mode;

    try {
      const response = await fetch(`${backendUrl}/api/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          mode,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'ไม่สามารถดึงข้อมูลเส้นทางได้');
      }

      routeData.value = result.data;
    } catch (err: any) {
      error.value = err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ Backend';
      routeData.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    routeData,
    isLoading,
    error,
    activeMode,
    fetchRoute,
  };
}

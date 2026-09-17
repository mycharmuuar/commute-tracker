import { defineEventHandler, readBody } from 'h3';

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteBody {
  origin: LatLng | string;
  destination: LatLng | string;
  mode?: 'driving' | 'transit' | 'walking' | 'bicycling';
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} กม.`;
  }
  return `${meters} ม.`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours} ชม. ${remainingMins} นาที` : `${hours} ชม.`;
  }
  return `${minutes} นาที`;
}

function parseDurationSeconds(durationStr?: string): number {
  if (!durationStr) return 0;
  const cleaned = durationStr.replace('s', '');
  const sec = parseInt(cleaned, 10);
  return isNaN(sec) ? 0 : sec;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RouteBody>(event);
  const config = useRuntimeConfig();

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    config.public.googleMapsApiKey ||
    '';

  if (!body || !body.origin || !body.destination) {
    return {
      success: false,
      message: 'กรุณาระบุตำแหน่งจุดเริ่มต้น (origin) และจุดหมายปลายทาง (destination)',
    };
  }

  const mode = body.mode || 'driving';

  // 1. ลองเรียก Google Routes API (v2)
  if (apiKey) {
    try {
      let routeTravelMode = 'DRIVE';
      let routingPreference: string | undefined = 'TRAFFIC_AWARE';

      if (mode === 'walking') {
        routeTravelMode = 'WALK';
        routingPreference = undefined;
      } else if (mode === 'bicycling') {
        routeTravelMode = 'BICYCLE';
        routingPreference = undefined;
      } else if (mode === 'transit') {
        routeTravelMode = 'TRANSIT';
        routingPreference = undefined;
      }

      const originPayload =
        typeof body.origin === 'string'
          ? { address: body.origin }
          : {
              location: {
                latLng: {
                  latitude: body.origin.lat,
                  longitude: body.origin.lng,
                },
              },
            };

      const destinationPayload =
        typeof body.destination === 'string'
          ? { address: body.destination }
          : {
              location: {
                latLng: {
                  latitude: body.destination.lat,
                  longitude: body.destination.lng,
                },
              },
            };

      const requestBody: any = {
        origin: originPayload,
        destination: destinationPayload,
        travelMode: routeTravelMode,
        languageCode: 'th',
      };

      if (routingPreference) {
        requestBody.routingPreference = routingPreference;
      }

      const fieldMask = [
        'routes.duration',
        'routes.staticDuration',
        'routes.distanceMeters',
        'routes.polyline.encodedPolyline',
        'routes.legs',
        'routes.description',
      ].join(',');

      const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (res.ok && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs?.[0] || {};

        const distanceMeters = route.distanceMeters || leg.distanceMeters || 0;
        const durationSeconds = parseDurationSeconds(route.duration || leg.duration);
        const staticDurationSeconds = parseDurationSeconds(route.staticDuration || leg.staticDuration || route.duration);
        const hasTrafficData = durationSeconds !== staticDurationSeconds && durationSeconds > 0;

        const startLoc = leg.startLocation?.latLng
          ? { lat: leg.startLocation.latLng.latitude, lng: leg.startLocation.latLng.longitude }
          : typeof body.origin === 'object'
          ? body.origin
          : { lat: 13.7563, lng: 100.5018 };

        const endLoc = leg.endLocation?.latLng
          ? { lat: leg.endLocation.latLng.latitude, lng: leg.endLocation.latLng.longitude }
          : typeof body.destination === 'object'
          ? body.destination
          : { lat: 13.7226, lng: 100.5284 };

        const steps = (leg.steps || []).map((s: any) => ({
          instructions: s.navigationInstruction?.instructions || s.description || 'เดินทางตามเส้นทาง',
          distance: s.distanceMeters ? formatDistance(s.distanceMeters) : '',
          duration: s.staticDuration ? formatDuration(parseDurationSeconds(s.staticDuration)) : '',
        }));

        return {
          success: true,
          data: {
            distance: {
              text: formatDistance(distanceMeters),
              value: distanceMeters,
            },
            duration: {
              text: formatDuration(staticDurationSeconds || durationSeconds),
              value: staticDurationSeconds || durationSeconds,
            },
            duration_in_traffic: {
              text: formatDuration(durationSeconds),
              value: durationSeconds,
            },
            hasTrafficData,
            startAddress: typeof body.origin === 'string' ? body.origin : `${startLoc.lat.toFixed(4)}, ${startLoc.lng.toFixed(4)}`,
            endAddress: typeof body.destination === 'string' ? body.destination : `${endLoc.lat.toFixed(4)}, ${endLoc.lng.toFixed(4)}`,
            startLocation: startLoc,
            endLocation: endLoc,
            overviewPolyline: route.polyline?.encodedPolyline || '',
            steps,
            travelMode: mode,
            departureTime: new Date().toISOString(),
          },
        };
      }
    } catch (e: any) {
      console.warn('Google Routes API serverless attempt error:', e.message);
    }
  }

  // หาก Google Routes API ล้มเหลว หรือไม่มี Key ฝั่ง Server ให้แจ้งเพื่อให้ Client-side DirectionsService ทำงานต่อ
  return {
    success: false,
    needsClientFallback: true,
    message: 'เซิร์ฟเวอร์ส่งต่อให้ Client-side Google Maps Directions บริหารการคำนวณเส้นทาง',
  };
});

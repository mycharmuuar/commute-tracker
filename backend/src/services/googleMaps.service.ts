import axios from 'axios';

export interface LocationPoint {
  lat: number;
  lng: number;
}

export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling';

export interface RouteRequest {
  origin: LocationPoint | string;
  destination: LocationPoint | string;
  mode?: TravelMode;
}

export interface RouteResponse {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  duration_in_traffic: {
    text: string;
    value: number; // in seconds
  };
  hasTrafficData: boolean;
  startAddress: string;
  endAddress: string;
  startLocation: LocationPoint;
  endLocation: LocationPoint;
  overviewPolyline: string;
  steps: Array<{
    instructions: string;
    distance: string;
    duration: string;
  }>;
  travelMode: TravelMode;
  departureTime: string;
}

export class GoogleMapsService {
  private static readonly ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  private static readonly LEGACY_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

  private formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} กม.`;
    }
    return `${meters} ม.`;
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return remainingMins > 0 ? `${hours} ชม. ${remainingMins} นาที` : `${hours} ชม.`;
    }
    return `${minutes} นาที`;
  }

  private parseDurationSeconds(durationStr?: string): number {
    if (!durationStr) return 0;
    // Format: "1234s"
    const cleaned = durationStr.replace('s', '');
    const sec = parseInt(cleaned, 10);
    return isNaN(sec) ? 0 : sec;
  }

  /**
   * เรียก Google Routes API (ตัวใหม่ล่าสุด สำหรับโปรเจกต์ Google Cloud ยุคใหม่)
   */
  public async getDirectionsWithRoutesApi(request: RouteRequest, apiKey: string): Promise<RouteResponse> {
    const mode: TravelMode = request.mode || 'driving';

    // แปลง TravelMode ไปเป็นรูปแบบของ Routes API
    let routeTravelMode = 'DRIVE';
    let routingPreference: string | undefined = 'TRAFFIC_AWARE';

    if (mode === 'walking') {
      routeTravelMode = 'WALK';
      routingPreference = undefined; // WALK ไม่รองรับ routingPreference
    } else if (mode === 'bicycling') {
      routeTravelMode = 'BICYCLE';
      routingPreference = undefined; // BICYCLE ไม่รองรับ routingPreference
    } else if (mode === 'transit') {
      routeTravelMode = 'TRANSIT';
      routingPreference = undefined; // TRANSIT ไม่รองรับ routingPreference
    }

    // เตรียม Origin Payload
    const originPayload =
      typeof request.origin === 'string'
        ? { address: request.origin }
        : {
            location: {
              latLng: {
                latitude: request.origin.lat,
                longitude: request.origin.lng,
              },
            },
          };

    // เตรียม Destination Payload
    const destinationPayload =
      typeof request.destination === 'string'
        ? { address: request.destination }
        : {
            location: {
              latLng: {
                latitude: request.destination.lat,
                longitude: request.destination.lng,
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

    const response = await axios.post(GoogleMapsService.ROUTES_API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      timeout: 10000,
    });

    const data = response.data;
    if (!data.routes || data.routes.length === 0) {
      throw new Error('ZERO_RESULTS: ไม่พบเส้นทางการเดินทางระหว่างจุดเริ่มต้นและปลายทางที่ระบุ กรุณาเปลี่ยนโหมดหรือตรวจสอบพิกัด');
    }

    const route = data.routes[0];
    const leg = route.legs?.[0] || {};

    const distanceMeters = route.distanceMeters || leg.distanceMeters || 0;
    const durationSeconds = this.parseDurationSeconds(route.duration || leg.duration);
    const staticDurationSeconds = this.parseDurationSeconds(route.staticDuration || leg.staticDuration || route.duration);

    const hasTrafficData = durationSeconds !== staticDurationSeconds && durationSeconds > 0;

    const startLoc: LocationPoint = leg.startLocation?.latLng
      ? { lat: leg.startLocation.latLng.latitude, lng: leg.startLocation.latLng.longitude }
      : typeof request.origin === 'object'
      ? request.origin
      : { lat: 0, lng: 0 };

    const endLoc: LocationPoint = leg.endLocation?.latLng
      ? { lat: leg.endLocation.latLng.latitude, lng: leg.endLocation.latLng.longitude }
      : typeof request.destination === 'object'
      ? request.destination
      : { lat: 0, lng: 0 };

    const steps = (leg.steps || []).map((s: any) => {
      const stepDist = s.distanceMeters ? this.formatDistance(s.distanceMeters) : '';
      const stepDur = s.staticDuration ? this.formatDuration(this.parseDurationSeconds(s.staticDuration)) : '';
      const instruction = s.navigationInstruction?.instructions || s.description || 'เดินทางตามเส้นทาง';
      return {
        instructions: instruction,
        distance: stepDist,
        duration: stepDur,
      };
    });

    return {
      distance: {
        text: this.formatDistance(distanceMeters),
        value: distanceMeters,
      },
      duration: {
        text: this.formatDuration(staticDurationSeconds || durationSeconds),
        value: staticDurationSeconds || durationSeconds,
      },
      duration_in_traffic: {
        text: this.formatDuration(durationSeconds),
        value: durationSeconds,
      },
      hasTrafficData,
      startAddress: typeof request.origin === 'string' ? request.origin : `${startLoc.lat.toFixed(4)}, ${startLoc.lng.toFixed(4)}`,
      endAddress: typeof request.destination === 'string' ? request.destination : `${endLoc.lat.toFixed(4)}, ${endLoc.lng.toFixed(4)}`,
      startLocation: startLoc,
      endLocation: endLoc,
      overviewPolyline: route.polyline?.encodedPolyline || '',
      steps,
      travelMode: mode,
      departureTime: new Date().toISOString(),
    };
  }

  /**
   * รองรับทั้ง Routes API (New) และสลับไป Legacy Directions API หากต้องการ
   */
  public async getDirections(request: RouteRequest): Promise<RouteResponse> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('CONFIG_ERROR: GOOGLE_MAPS_API_KEY is not defined on server environment');
    }

    try {
      // ลองเรียก Routes API (New) ตัวแรกเสมอ
      return await this.getDirectionsWithRoutesApi(request, apiKey);
    } catch (error: any) {
      // หากเกิดข้อผิดพลาด ให้ตรวจดูสาเหตุและคืนข้อความที่เป็นมิตร
      const responseData = error.response?.data;
      const status = error.response?.status;
      const errorMessage = responseData?.error?.message || error.message;

      if (status === 403 || errorMessage?.includes('not enabled') || errorMessage?.includes('LegacyApiNotActivatedMapError')) {
        throw new Error(`REQUEST_DENIED: คำขอถูกปฏิเสธโดย Google Maps API: ${errorMessage} (โปรดเปิดใช้งาน "Routes API" ใน Google Cloud Console)`);
      }

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('TIMEOUT: การเชื่อมต่อกับ Google Maps API หมดเวลา กรุณาลองใหม่อีกครั้ง');
      }

      if (errorMessage?.startsWith('ZERO_RESULTS')) {
        throw error;
      }

      throw new Error(`MAPS_ERROR: ${errorMessage || 'เกิดข้อผิดพลาดในการดึงข้อมูลเส้นทาง'}`);
    }
  }
}

export const googleMapsService = new GoogleMapsService();

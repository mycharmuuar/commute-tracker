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
  private static readonly GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

  private formatLocation(loc: LocationPoint | string): string {
    if (typeof loc === 'string') {
      return loc.trim();
    }
    return `${loc.lat},${loc.lng}`;
  }

  public async getDirections(request: RouteRequest): Promise<RouteResponse> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('CONFIG_ERROR: GOOGLE_MAPS_API_KEY is not defined on server environment');
    }

    const originStr = this.formatLocation(request.origin);
    const destinationStr = this.formatLocation(request.destination);
    const mode: TravelMode = request.mode || 'driving';

    try {
      const response = await axios.get(GoogleMapsService.GOOGLE_DIRECTIONS_URL, {
        params: {
          origin: originStr,
          destination: destinationStr,
          mode,
          departure_time: 'now', // เพื่อให้คำนวณ duration_in_traffic แบบ real-time
          language: 'th',
          key: apiKey,
        },
        timeout: 10000, // 10 วินาที timeout
      });

      const data = response.data;

      if (data.status !== 'OK') {
        this.handleGoogleApiError(data.status, data.error_message);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      const durationInTraffic = leg.duration_in_traffic || leg.duration;
      const hasTrafficData = Boolean(leg.duration_in_traffic);

      const steps = (leg.steps || []).map((s: any) => ({
        instructions: (s.html_instructions || '').replace(/<[^>]*>?/gm, ''), // strip HTML tags
        distance: s.distance?.text || '',
        duration: s.duration?.text || '',
      }));

      return {
        distance: {
          text: leg.distance.text,
          value: leg.distance.value,
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value,
        },
        duration_in_traffic: {
          text: durationInTraffic.text,
          value: durationInTraffic.value,
        },
        hasTrafficData,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        startLocation: {
          lat: leg.start_location.lat,
          lng: leg.start_location.lng,
        },
        endLocation: {
          lat: leg.end_location.lat,
          lng: leg.end_location.lng,
        },
        overviewPolyline: route.overview_polyline.points,
        steps,
        travelMode: mode,
        departureTime: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('TIMEOUT: การเชื่อมต่อกับ Google Maps API หมดเวลา กรุณาลองใหม่อีกครั้ง');
      }
      if (error.response) {
        throw new Error(`UPSTREAM_ERROR: Google Maps API ตอบกลับข้อผิดพลาด HTTP ${error.response.status}`);
      }
      throw error;
    }
  }

  private handleGoogleApiError(status: string, errorMessage?: string): never {
    switch (status) {
      case 'ZERO_RESULTS':
        throw new Error('ZERO_RESULTS: ไม่พบเส้นทางการเดินทางระหว่างจุดเริ่มต้นและปลายทางที่ระบุ กรุณาตรวจสอบจุดหมายหรือเปลี่ยนโหมดการเดินทาง');
      case 'NOT_FOUND':
        throw new Error('NOT_FOUND: ไม่พบสถานที่หรือพิกัดที่ระบุ กรุณาตรวจสอบความถูกต้องของที่อยู่อีกครั้ง');
      case 'OVER_QUERY_LIMIT':
        throw new Error('OVER_QUERY_LIMIT: โควตาการเรียกใช้งาน Google Maps API เกินกำหนด กรุณาลองใหม่อีกครั้งในภายหลัง');
      case 'REQUEST_DENIED':
        throw new Error(`REQUEST_DENIED: คำขอถูกปฏิเสธโดย Google Maps API (${errorMessage || 'โปรดตรวจสอบสิทธิ์และ Directions API ใน Google Cloud Console'})`);
      case 'INVALID_REQUEST':
        throw new Error(`INVALID_REQUEST: รูปแบบพิกัดหรือพารามิเตอร์ไม่ถูกต้อง (${errorMessage || ''})`);
      default:
        throw new Error(`MAPS_ERROR: ${status} - ${errorMessage || 'เกิดข้อผิดพลาดในการดึงข้อมูลเส้นทาง'}`);
    }
  }
}

export const googleMapsService = new GoogleMapsService();

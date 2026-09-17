export interface LatLng {
  lat: number;
  lng: number;
}

export type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling';

export type GeolocationStatus =
  | 'idle'
  | 'prompting'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'timeout'
  | 'error';

export interface RouteResponse {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  duration_in_traffic: {
    text: string;
    value: number; // seconds
  };
  hasTrafficData: boolean;
  startAddress: string;
  endAddress: string;
  startLocation: LatLng;
  endLocation: LatLng;
  overviewPolyline: string;
  steps: Array<{
    instructions: string;
    distance: string;
    duration: string;
  }>;
  travelMode: TravelMode;
  departureTime: string;
}

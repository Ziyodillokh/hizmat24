export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ClientAddress extends GeoPoint {
  label: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  comment?: string;
}

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
}

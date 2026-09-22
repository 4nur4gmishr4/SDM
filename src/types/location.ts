export interface DeliveryLocation {
  lat: number;
  lng: number;
  address: string;
  area: string;
  city: string;
  pincode: string;
  houseNo?: string;
  landmark?: string;
  formattedAddress: string;
  isCustom?: boolean;
}

export interface GeocodingSearchResult {
  label: string;
  lat: number;
  lng: number;
  area?: string;
  city?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Donor {
  id: string;
  location: Location;
  bloodType: string;
  lastDonation?: string;
  name: string;
  phoneNumber?: string;
  isAvailable: boolean;
}

export interface MatchDonorsRequest {
  centerLocation: Location;
  bloodType: string;
  radius?: number;
  limit?: number;
}

export interface MatchDonorsResponse {
  donors: (Donor & { distance: number })[];
  total: number;
}

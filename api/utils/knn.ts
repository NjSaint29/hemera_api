import { Location, Donor } from './types';

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isBloodTypeCompatible(recipientType: string, donorType: string): boolean {
  const compatibility: { [key: string]: string[] } = {
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    'AB-': ['A-', 'B-', 'AB-', 'O-'],
    'O+': ['O+', 'O-'],
    'O-': ['O-']
  };

  return compatibility[recipientType]?.includes(donorType) || false;
}

export function findNearestDonors(
  centerLocation: Location,
  donors: Donor[],
  bloodType: string,
  radius: number = 50,
  limit: number = 10
): (Donor & { distance: number })[] {
  return donors
    .map(donor => ({
      ...donor,
      distance: calculateDistance(centerLocation, donor.location)
    }))
    .filter(donor => 
      donor.isAvailable && 
      isBloodTypeCompatible(bloodType, donor.bloodType) &&
      donor.distance <= radius
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

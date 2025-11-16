export interface Amenity {
  id: string;
  name: string;
  icon: string;
}

export const AMENITIES_LIST: Amenity[] = [
  { id: '1', name: 'WiFi', icon: 'bi-wifi' },
  { id: '2', name: 'Kitchen', icon: 'bi-house-door' },
  { id: '3', name: 'Air Conditioning', icon: 'bi-snow' },
  { id: '4', name: 'Heating', icon: 'bi-thermometer-sun' },
  { id: '5', name: 'TV', icon: 'bi-tv' },
  { id: '6', name: 'Washing Machine', icon: 'bi-water' },
  { id: '7', name: 'Free Parking', icon: 'bi-p-square' },
  { id: '8', name: 'Pool', icon: 'bi-water' },
  { id: '9', name: 'Gym', icon: 'bi-heart-pulse' },
  { id: '10', name: 'Pet Friendly', icon: 'bi-heart' }
];

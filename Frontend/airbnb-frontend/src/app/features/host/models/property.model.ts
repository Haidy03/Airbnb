import { PropertyImage } from './image.model';
import { Amenity } from './amenity.model';

export enum PropertyType {
  Apartment = 1,
  House = 2,
  Villa = 3,
  Studio = 4,
  Guesthouse = 5,
  Hotel = 6
}

export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  propertyTypeName: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  images: PropertyImage[];
  amenities: Amenity[];
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  propertyType: PropertyType;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenityIds: string[];
}

export interface UpdatePropertyRequest {
  title: string;
  description: string;
  propertyType: PropertyType;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenityIds: string[];
}

export interface HostDashboardStats {
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  averageRating: number;
  topProperties: PropertyStats[];
}

export interface PropertyStats {
  propertyId: string;
  title: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  imageUrl: string;
}

// Property Type Helper
export function getPropertyTypeName(type: PropertyType): string {
  switch (type) {
    case PropertyType.Apartment:
      return 'Apartment';
    case PropertyType.House:
      return 'House';
    case PropertyType.Villa:
      return 'Villa';
    case PropertyType.Studio:
      return 'Studio';
    case PropertyType.Guesthouse:
      return 'Guesthouse';
    case PropertyType.Hotel:
      return 'Hotel';
    default:
      return 'Unknown';
  }
}

export const PROPERTY_TYPES = [
  { value: PropertyType.Apartment, label: 'Apartment' },
  { value: PropertyType.House, label: 'House' },
  { value: PropertyType.Villa, label: 'Villa' },
  { value: PropertyType.Studio, label: 'Studio' },
  { value: PropertyType.Guesthouse, label: 'Guesthouse' },
  { value: PropertyType.Hotel, label: 'Hotel' }
];
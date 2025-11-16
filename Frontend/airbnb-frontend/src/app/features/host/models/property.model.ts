export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  roomType: RoomType;
  
  // Location
  location: PropertyLocation;
  
  // Capacity
  capacity: PropertyCapacity;
  
  // Amenities
  amenities: string[]; // Array of amenity IDs
  
  // Images
  images: PropertyImage[];
  coverImage: string; // URL of main image
  
  // Pricing
  pricing: PropertyPricing;
  
  // Availability
  availability: PropertyAvailability;
  
  // Rules & Policies
  houseRules: HouseRules;
  
  // Status
  status: PropertyStatus;
  isInstantBook: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Stats
  stats: PropertyStats;
}

export interface PropertyLocation {
  address: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PropertyCapacity {
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  isMain: boolean;
}

export interface PropertyPricing {
  basePrice: number; // per night
  currency: string;
  weekendPrice?: number;
  weeklyDiscount?: number; // percentage
  monthlyDiscount?: number; // percentage
  cleaningFee?: number;
  serviceFee?: number;
  taxRate?: number;
  securityDeposit?: number;
}

export interface PropertyAvailability {
  minNights: number;
  maxNights: number;
  advanceNotice: number; // days
  preparationTime: number; // days
  availabilityWindow: number; // months
  blockedDates: Date[];
  customPricing: CustomPricingRule[];
}

export interface CustomPricingRule {
  id: string;
  startDate: Date;
  endDate: Date;
  price: number;
  reason?: string;
}

export interface HouseRules {
  checkInTime: string; // "15:00"
  checkOutTime: string; // "11:00"
  smokingAllowed: boolean;
  petsAllowed: boolean;
  eventsAllowed: boolean;
  childrenAllowed: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  additionalRules?: string[];
}

export interface PropertyStats {
  totalBookings: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  acceptanceRate: number;
  viewsLastMonth: number;
  occupancyRate: number;
}

// Enums
export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  CONDO = 'condo',
  VILLA = 'villa',
  CABIN = 'cabin',
  COTTAGE = 'cottage',
  TOWNHOUSE = 'townhouse',
  BUNGALOW = 'bungalow',
  LOFT = 'loft',
  GUESTHOUSE = 'guesthouse',
  HOTEL = 'hotel',
  RESORT = 'resort',
  BOAT = 'boat',
  CAMPER = 'camper',
  OTHER = 'other'
}

export enum RoomType {
  ENTIRE_PLACE = 'entire_place',
  PRIVATE_ROOM = 'private_room',
  SHARED_ROOM = 'shared_room',
  HOTEL_ROOM = 'hotel_room'
}

export enum PropertyStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UNLISTED = 'unlisted',
  UNDER_REVIEW = 'under_review',
  BLOCKED = 'blocked'
}

// DTOs for API
export interface CreatePropertyDto {
  title: string;
  description: string;
  propertyType: PropertyType;
  roomType: RoomType;
  location: PropertyLocation;
  capacity: PropertyCapacity;
  amenities: string[];
  pricing: PropertyPricing;
  houseRules: HouseRules;
}

export interface UpdatePropertyDto extends Partial<CreatePropertyDto> {
  id: string;
}

export interface PropertyFilters {
  status?: PropertyStatus;
  propertyType?: PropertyType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'earnings' | 'rating' | 'bookings';
  sortOrder?: 'asc' | 'desc';
}
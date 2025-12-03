export interface SafetyDetails {
  exteriorCamera: boolean;
  noiseMonitor: boolean;
  weapons: boolean;
}

// ==========================================
// MAIN PROPERTY INTERFACE (The Source of Truth)
// ==========================================
export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  rejectionReason?: string;
  maxGuests?: number;
  numberOfBedrooms?: number;
  numberOfBeds?: number; 
  numberOfBathrooms?: number;

  // Types
  propertyType: string;
  propertyTypeId?: number;
  roomType: string;
  
  // ✅ Hybrid Fields (Both Flat & Nested support to fix errors)
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  currentStep?: string;
  
  // Pricing Fields (Flat)
  pricePerNight?: number;
  cleaningFee?: number;

  // Location Object
  location: PropertyLocation;
  
  // Capacity Object
  capacity: PropertyCapacity;
  
  // Amenities
  amenities: number[]; 
  amenityIds?: number[]; // ✅ Alias for compatibility
  
  // Images
  images: PropertyImage[];
  coverImage: string; 
  
  // Pricing Object
  pricing: PropertyPricing;
  
  // Availability
  availability: PropertyAvailability;
  
  // Rules
  houseRules: HouseRules;

  // Safety
  safetyDetails?: SafetyDetails;
  
  // Status
  status: PropertyStatus | string | number;
  isInstantBook: boolean;

  isActive: boolean;     
  isApproved: boolean;   
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Stats
  stats: {
    totalBookings: number;
    totalEarnings: number;
    averageRating: number;
    totalReviews: number;
    responseRate?: number;
    acceptanceRate?: number;
    viewsLastMonth?: number;
    occupancyRate?: number;
  };
}

// ✅ Alias PropertyDraft to Property to avoid type conflicts
export type PropertyDraft = Property;

export interface PropertyLocation {
  address: string;
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
  // Optional fields for compatibility
  imageUrl?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface PropertyImageDraft {
  id: string;
  imageUrl?: string;
  preview?: string;
  displayOrder?: number;
  isPrimary?: boolean;
  uploaded?: boolean;
  error?: string;
}

export interface PropertyPricing {
  basePrice: number;
  currency: string;
  weekendPrice?: number;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  cleaningFee?: number;
  serviceFee?: number;
  taxRate?: number;
  securityDeposit?: number;
}

export interface PropertyAvailability {
  minNights: number;
  maxNights: number;
  advanceNotice: number;
  preparationTime: number;
  availabilityWindow: number;
  blockedDates: Date[];
  customPricing: any[];
}

export interface HouseRules {
  checkInTime: string;
  checkOutTime: string;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  eventsAllowed: boolean;
  childrenAllowed: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  additionalRules?: string;
}

// ==========================================
// ENUMS
// ==========================================

export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  VILLA = 'villa',
  CABIN = 'cabin',
  LOFT = 'loft',
  // ... add others as needed
}

export enum RoomType {
  ENTIRE_PLACE = 'entire_place',
  PRIVATE_ROOM = 'private_room',
  SHARED_ROOM = 'shared_room',
  HOTEL_ROOM = 'hotel_room'
}

export enum PropertyStatus {
  DRAFT = 0,              
  PENDING_APPROVAL = 1,    
  APPROVED = 2,           
  REJECTED = 3,           
  ACTIVE = 4,             
  INACTIVE = 5,           
  SUSPENDED = 6           
}

export const PROPERTY_STATUS_LABELS: { [key: number]: string } = {
  0: 'In Progress',
  1: 'Pending Review',
  2: 'Approved',
  3: 'Rejected',
  4: 'Active',
  5: 'Inactive',
  6: 'Suspended'
};
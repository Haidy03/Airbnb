// ==========================================
// MAIN PROPERTY INTERFACE
// ==========================================

export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  propertyTypeId?: number; // ✅ Backend compatibility
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

// ==========================================
// DRAFT PROPERTY INTERFACE (NEW)
// ==========================================

export interface PropertyDraft {
  id?: string;
  hostId?: string;
  title: string;
  description: string;
  propertyTypeId?: number;
  roomType?: string;
  
  // Location
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  
  // Capacity
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  maxGuests: number;
  
  // Pricing
  pricePerNight: number;
  cleaningFee?: number;
  
  // Rules
  checkInTime?: string;
  checkOutTime?: string;
  minimumStay: number;
  houseRules?: string;
  
  // Amenities
  amenityIds: number[];
  
  // Images
  images?: PropertyImageDraft[];
  
  // Draft specific fields
  currentStep?: 'intro' | 'property-type' | 'room-type' | 'location' | 'amenities' | 'photos' | 'pricing' | 'review';
  isActive?: boolean;
  isPublished?: boolean;
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

// ==========================================
// LOCATION INTERFACE
// ==========================================

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

// ==========================================
// CAPACITY INTERFACE
// ==========================================

export interface PropertyCapacity {
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

// ==========================================
// IMAGE INTERFACES
// ==========================================

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  isMain: boolean;
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

// ==========================================
// PRICING INTERFACE
// ==========================================

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

// ==========================================
// AVAILABILITY INTERFACE
// ==========================================

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

// ==========================================
// HOUSE RULES INTERFACE
// ==========================================

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

// ==========================================
// STATS INTERFACE
// ==========================================

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

// ==========================================
// AMENITY INTERFACE (NEW)
// ==========================================

export interface AmenityOption {
  id: number;
  name: string;
  category: string;
  icon: string;
  description?: string;
  isPremium?: boolean;
}

// ==========================================
// ENUMS
// ==========================================

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
  DRAFT = 'draft',                    // قيد الإنشاء
  PENDING_APPROVAL = 'pending_approval', // بانتظار الموافقة
  APPROVED = 'approved',              // معتمد من Admin
  REJECTED = 'rejected',              // مرفوض
  ACTIVE = 'active',                  // مفعل وظاهر للضيوف
  INACTIVE = 'inactive',              // غير مفعل
  SUSPENDED = 'suspended'             // معلق
}

// ==========================================
// DTO INTERFACES
// ==========================================

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

/**
 * DTO for updating draft at specific step
 * Only includes fields for that particular step
 */
export interface UpdateDraftStepDto {
  propertyTypeId?: number;
  roomType?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  maxGuests?: number;
  amenityIds?: number[];
  images?: PropertyImageDraft[];
  pricePerNight?: number;
  cleaningFee?: number;
  checkInTime?: string;
  checkOutTime?: string;
  minimumStay?: number;
  houseRules?: string;
  currentStep?: string;
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

// ==========================================
// HELPER TYPES
// ==========================================

/**
 * Union type for both published and draft properties
 * Useful for displaying them together
 */
export type PropertyOrDraft = Property | PropertyDraft;

/**
 * Step progress tracker
 */
export interface StepProgress {
  step: string;
  completed: boolean;
  data: Partial<PropertyDraft>;
}

/**
 * Property creation response from API
 */
export interface PropertyApiResponse {
  success: boolean;
  data: any;
  message?: string;
  errors?: string[];
}

// ==========================================
// VALIDATION INTERFACES
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Step validation result
 */
export interface StepValidationResult extends ValidationResult {
  step: string;
  completion: number; // 0-100
}

// ==========================================
// CONSTANTS
// ==========================================

export const PROPERTY_STEPS = [
  'intro',
  'property-type',
  'room-type',
  'location',
  'amenities',
  'photos',
  'pricing',
  'review'
] as const;

export const ROOM_TYPE_LABELS: { [key in RoomType]: string } = {
  [RoomType.ENTIRE_PLACE]: 'Entire place',
  [RoomType.PRIVATE_ROOM]: 'Private room',
  [RoomType.SHARED_ROOM]: 'Shared room',
  [RoomType.HOTEL_ROOM]: 'Hotel room'
};

export const PROPERTY_STATUS_LABELS: { [key in PropertyStatus]: string } = {
  [PropertyStatus.DRAFT]: 'In Progress',
  [PropertyStatus.PENDING_APPROVAL]: 'Pending Approval',
  [PropertyStatus.APPROVED]: 'Approved',
  [PropertyStatus.REJECTED]: 'Rejected',
  [PropertyStatus.ACTIVE]: 'Active',
  [PropertyStatus.INACTIVE]: 'Inactive',
  [PropertyStatus.SUSPENDED]: 'Suspended'
};

export const STEP_LABELS: { [key: string]: string } = {
  'intro': 'Getting Started',
  'property-type': 'Property Type',
  'room-type': 'Room Type',
  'location': 'Location',
  'amenities': 'Amenities',
  'photos': 'Photos',
  'pricing': 'Pricing',
  'review': 'Review'
};

// Minimum photos required to proceed
export const MIN_PHOTOS_REQUIRED = 5;

// Maximum photos allowed
export const MAX_PHOTOS_ALLOWED = 20;

// Maximum file size for images (5MB)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Allowed image types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
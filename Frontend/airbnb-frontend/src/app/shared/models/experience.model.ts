export interface Experience {
  id: number;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  isHostVerified: boolean;
  
  categoryName: string;
  categoryIcon: string;
  type: ExperienceType;
  
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  
  durationHours: number;
  durationMinutes?: number;
  formattedDuration: string;
  
  minGroupSize: number;
  maxGroupSize: number;
  
  pricePerPerson: number;
  pricingType: string;
  
  ageRequirement?: string;
  skillLevel?: string;
  whatToBring?: string;
  whatIsIncluded?: string;
  cancellationPolicy?: string;
  
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  
  images: ExperienceImage[];
  languages: Language[];
  
  status: ExperienceStatus;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt?: Date;
}

export interface ExperienceImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Language {
  languageCode: string;
  languageName: string;
}

export interface ExperienceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
}

export enum ExperienceType {
  InPerson = 'InPerson',
  Online = 'Online',
  Adventure = 'Adventure'
}

export enum ExperienceStatus {
  Draft = 'Draft',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended'
}

// DTOs for API calls
export interface CreateExperienceDto {
  title: string;
  description: string;
  categoryId: number;
  type: string;
  
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  
  durationHours: number;
  durationMinutes?: number;
  
  minGroupSize: number;
  maxGroupSize: number;
  
  pricePerPerson: number;
  pricingType?: string;
  
  ageRequirement?: string;
  skillLevel?: string;
  whatToBring?: string;
  whatIsIncluded?: string;
  cancellationPolicy?: string;
  
  languageCodes?: string[];
}

export interface UpdateExperienceDto {
  title?: string;
  description?: string;
  categoryId?: number;
  type?: string;
  
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  
  durationHours?: number;
  durationMinutes?: number;
  
  minGroupSize?: number;
  maxGroupSize?: number;
  
  pricePerPerson?: number;
  pricingType?: string;
  
  ageRequirement?: string;
  skillLevel?: string;
  whatToBring?: string;
  whatIsIncluded?: string;
  cancellationPolicy?: string;
  
  languageCodes?: string[];
}

export interface ExperienceSearchDto {
  location?: string;
  date?: string;
  guests?: number;
  
  categoryId?: number;
  type?: string;
  
  minPrice?: number;
  maxPrice?: number;
  
  language?: string;
  timeOfDay?: string;
  
  pageNumber?: number;
  pageSize?: number;
  
  sortBy?: string;
}

export interface ExperienceSearchResult {
  id: number;
  title: string;
  hostName: string;
  hostAvatar?: string;
  categoryName: string;
  type: string;
  city?: string;
  country?: string;
  durationHours: number;
  durationMinutes?: number;
  pricePerPerson: number;
  averageRating: number;
  totalReviews: number;
  isFavorite?: boolean;
  primaryImage?: string;
  isAvailable: boolean;
}

export interface ExperienceBooking {
  id: number;
  experienceId: number;
  experienceTitle: string;
  experienceImage?: string;
  
  guestId: string;
  guestName: string;
  
  date: Date;
  startTime: string;
  endTime: string;
  
  numberOfGuests: number;
  pricePerPerson: number;
  totalPrice: number;
  
  status: BookingStatus;
  specialRequests?: string;
  
  createdAt: Date;
  confirmedAt?: Date;
}

export interface BookExperienceDto {
  availabilityId: number;
  numberOfGuests: number;
  specialRequests?: string;
}

export enum BookingStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  Rejected = 'Rejected'
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}
export interface ExperienceAvailability {
  id: number;
  experienceId: number;
  date: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
  isAvailable: boolean;
  customPrice?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

export interface CreateReviewDto {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface ExperienceReview {
  id: number;
  reviewerName: string;
  reviewerProfileImage?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
export interface CreateAvailabilityDto {
  date: string;
  startTime: string; // صيغة "HH:mm:ss"
  endTime: string;   // صيغة "HH:mm:ss"
  availableSpots: number;
  customPrice?: number;
}
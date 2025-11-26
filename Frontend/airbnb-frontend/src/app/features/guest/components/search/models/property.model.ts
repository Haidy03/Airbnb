// الحفاظ على الـ Interfaces القديمة كما هي وإضافة الـ DTOs في النهاية

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  description: string;
  price: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  location: Location;
  images: PropertyImage[];
  amenities: Amenity[];
  host: Host;
  capacity: Capacity;
  isGuestFavorite: boolean;
  isFavorite: boolean;
  availableDates: DateRange[];
  instantBook: boolean;
  cancellationPolicy: CancellationPolicy;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  neighborhood?: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
  isMain: boolean;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: AmenityCategory;
}

export interface Host {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isSuperhost: boolean;
  joinedDate: Date;
  responseRate: number;
  responseTime: string;
}

export interface Capacity {
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SearchFilters {
  location?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  propertyTypes?: PropertyType[];
  amenities?: string[];
  instantBook?: boolean;
  rating?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
}

export interface SearchQuery {
  filters: SearchFilters;
  page: number;
  pageSize: number;
  sortBy: SortOption;
}

export interface SearchResponse {
  properties: Property[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export enum PropertyType {
  APARTMENT = 'Apartment',
  HOUSE = 'House',
  ROOM = 'Room',
  VILLA = 'Villa',
  STUDIO = 'Studio',
  CHALET = 'Chalet',
  CABIN = 'Cabin',
  HOTEL = 'Hotel'
}

export enum AmenityCategory {
  BASIC = 'Basic',
  ENTERTAINMENT = 'Entertainment',
  KITCHEN = 'Kitchen',
  BATHROOM = 'Bathroom',
  SAFETY = 'Safety',
  OUTDOOR = 'Outdoor'
}

export enum SortOption {
  PRICE_LOW_TO_HIGH = 'price_asc',
  PRICE_HIGH_TO_LOW = 'price_desc',
  RATING = 'rating',
  POPULAR = 'popular',
  NEWEST = 'newest'
}

export enum CancellationPolicy {
  FLEXIBLE = 'Flexible',
  MODERATE = 'Moderate',
  STRICT = 'Strict',
  SUPER_STRICT = 'Super Strict'
}

// ==========================================
//  BACKEND DTOs (لربط C# مع Angular)
// ==========================================

export interface PropertySearchResultDto {
  id: number;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  rating: number;
  totalReviews: number;
  imageUrl: string;
  isGuestFavorite: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchRequestDto {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  pageIndex: number;
  pageSize: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalHosts: number;
  totalGuests: number;
  activeUsers: number;
  blockedUsers: number;
  pendingVerifications: number;
  
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;

  totalServices: number;
  activeServices: number;
  pendingServices: number;
  
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  
  totalRevenue: number;
  monthlyRevenue: number;
  platformFees: number;
  
  totalReviews: number;
  averageRating: number;
  
  openDisputes: number;
  resolvedDisputes: number;
  
  revenueByMonth: MonthlyRevenue[];
  propertyTypeStats: PropertyTypeStats[];
  bookingStatusStats: BookingStatusStats[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookingsCount: number;
}

export interface PropertyTypeStats {
  propertyType: string;
  count: number;
  totalRevenue: number;
}

export interface BookingStatusStats {
  status: string;
  count: number;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: Date;
  verifiedAt?: Date;
  lastLoginAt?: Date;
  totalExperiences: number;
  totalBookings: number;
  totalProperties: number;
  totalSpent: number;
  totalEarned: number;
  reviewsCount: number;
  averageRating?: number;
}

export interface VerificationRequest {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  idType: string;
  idNumber: string;
  idImageUrl: string;
  status: string;
  submittedAt: Date;
  adminNotes?: string;
}

export interface AdminProperty {
  id: number;
  title: string;
  hostId: string;
  hostName: string;
  imageUrl: string;
  images?: { imageUrl: string, isPrimary: boolean }[];
  status: string;
  pricePerNight: number;
  location: string;
  totalBookings: number;
  totalRevenue: number;
  averageRating?: number;
  reviewsCount: number;
  createdAt: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface AdminBooking {
  id: number;
  type: 'Property' | 'Experience' | 'Service';
  propertyId?: number;
  propertyTitle: string;
  guestId: string;
  guestName: string;
  hostName: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalPrice: number;
  status: string;
  createdAt: Date;
}

export interface AdminDispute {
  id: number;
  bookingId: number;
  propertyTitle: string;
  reportedById: string;
  reportedByName: string;
  reportedAgainstId: string;
  reportedAgainstName: string;
  type: string;
  description: string;
  status: string;
  createdAt: Date;
  adminResponse?: string;
  resolution?: string;
  refundAmount?: number;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  platformFees: number;
  hostPayouts: number;
  totalBookings: number;
  averageBookingValue: number;
  revenueByLocation: RevenueByLocation[];
}

export interface RevenueByLocation {
  location: string;
  revenue: number;
  bookingsCount: number;
}

export interface UserActivityReport {
  newUsers: number;
  activeUsers: number;
  newHosts: number;
  newGuests: number;
  dailyActivity: DailyActivity[];
}

export interface DailyActivity {
  date: Date;
  newUsers: number;
  activeUsers: number;
  bookings: number;
}

export interface OccupancyReport {
  overallOccupancyRate: number;
  topProperties: PropertyOccupancy[];
  lowPerformingProperties: PropertyOccupancy[];
}

export interface PropertyOccupancy {
  propertyId: number;
  propertyTitle: string;
  occupancyRate: number;
  totalBookings: number;
  revenue: number;
}

export interface AdminServiceItem {
  id: number;
  title: string;
  categoryName: string;
  pricePerUnit: number;
  pricingUnit: string;
  hostName: string;
  status: string;
  imageUrl?: string;
  totalBookings?: number;
  totalRevenue?: number;
  averageRating?: number;
  reviewsCount?: number;
  createdAt: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}
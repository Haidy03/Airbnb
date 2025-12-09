export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  
  // Guest Information
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestProfileImage?: string;
  guestJoinedDate: Date;
  numberOfGuests: number;
  
  // Dates
  checkInDate: Date;
  checkOutDate: Date;
  numberOfNights: number;
  bookedAt: Date;
  
  // Pricing
  pricing: BookingPricing;
  
  // Status
  status: BookingStatus;
  
  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  
  // Communication
  hasUnreadMessages: boolean;
  lastMessageAt?: Date;
  
  // Special requests
  specialRequests?: string;
  
  // Check-in/out info
  checkInTime?: string;
  checkOutTime?: string;
  actualCheckInTime?: Date;
  actualCheckOutTime?: Date;
  
  // Cancellation
  cancellationPolicy?: string;
  cancelledAt?: Date;
  cancelledBy?: 'host' | 'guest';
  cancellationReason?: string;
  refundAmount?: number;
  
  // Review
  isReviewed: boolean;
  reviewId?: string;
  guestRating?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingPricing {
  basePrice: number; // per night
  numberOfNights: number;
  subtotal: number; // basePrice * numberOfNights
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  discount?: number;
  discountReason?: string;
  total: number;
  hostEarnings: number; // after platform fees
  currency: string;
}

export enum BookingStatus {
  PENDING = 'pending', // Waiting for host approval
  CONFIRMED = 'confirmed', // Confirmed by host
  CHECKED_IN = 'checked_in', // Guest has checked in
  CHECKED_OUT = 'checked_out', // Guest has checked out
  CANCELLED = 'cancelled', // Booking cancelled
  DECLINED = 'declined', // Host declined
  COMPLETED = 'completed' // Finished and reviewed
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_REFUNDED = 'partially_refunded',
  FULLY_REFUNDED = 'fully_refunded',
  FAILED = 'failed'
}

// For calendar view
export interface CalendarBooking {
  id: string;
  propertyId: string;
  guestName: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: BookingStatus;
  pricing: {
    total: number;
    currency: string;
  };
}

// Dashboard stats
export interface BookingStats {
  todayCheckIns: number;
  todayCheckOuts: number;
  currentGuests: number;
  upcomingBookings: number;
  pendingApprovals: number;
  thisMonthBookings: number;
  thisMonthEarnings: number;
  nextMonthBookings: number;
  occupancyRate: number;
}

// Filters for booking list
export interface BookingFilters {
  status?: BookingStatus[];
  propertyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  guestName?: string;
  sortBy?: 'checkInDate' | 'bookedAt' | 'total';
  sortOrder?: 'asc' | 'desc';
}

// Request/Response DTOs
export interface BookingActionDto {
  bookingId: string;
  action: 'approve' | 'decline' | 'cancel';
  reason?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booking?: Booking;
}
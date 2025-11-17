export interface HostDashboardStats {
  overview: OverviewStats;
  earnings: EarningsStats;
  performance: PerformanceStats;
  recentActivity: RecentActivity;
  upcomingEvents: UpcomingEvents;
}

export interface OverviewStats {
  activeListings: number;
  totalBookings: number;
  currentGuests: number;
  totalEarnings: number;
  currency: string;
}

export interface EarningsStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  currency: string;
  monthlyTrend: MonthlyEarning[];
  topEarningProperty: {
    id: string;
    title: string;
    earnings: number;
  };
}

export interface MonthlyEarning {
  month: string; // "Jan", "Feb", etc.
  earnings: number;
  bookings: number;
}

export interface PerformanceStats {
  averageRating: number;
  totalReviews: number;
  responseRate: number; // percentage
  responseTime: number; // in hours
  acceptanceRate: number; // percentage
  occupancyRate: number; // percentage
  repeatGuestRate: number; // percentage
  
  // Trends (compared to last period)
  ratingTrend: 'up' | 'down' | 'stable';
  responseRateTrend: 'up' | 'down' | 'stable';
  occupancyTrend: 'up' | 'down' | 'stable';
}

export interface RecentActivity {
  newBookings: ActivityItem[];
  recentMessages: ActivityItem[];
  recentReviews: ActivityItem[];
  pendingActions: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'booking' | 'message' | 'review' | 'payment' | 'inquiry';
  title: string;
  description: string;
  timestamp: Date;
  isUnread: boolean;
  actionRequired?: boolean;
  relatedId?: string; // booking ID, property ID, etc.
  metadata?: any;
}

export interface UpcomingEvents {
  checkIns: CheckInOutEvent[];
  checkOuts: CheckInOutEvent[];
  blockedDates: BlockedDateEvent[];
}

export interface CheckInOutEvent {
  bookingId: string;
  propertyId: string;
  propertyTitle: string;
  guestName: string;
  guestImage?: string;
  date: Date;
  time: string;
  numberOfGuests: number;
}

export interface BlockedDateEvent {
  propertyId: string;
  propertyTitle: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

// Analytics
export interface PropertyAnalytics {
  propertyId: string;
  propertyTitle: string;
  period: 'week' | 'month' | 'year';
  
  views: number;
  viewsTrend: number; // percentage change
  
  inquiries: number;
  inquiriesTrend: number;
  
  bookings: number;
  bookingsTrend: number;
  
  earnings: number;
  earningsTrend: number;
  
  averageNightlyRate: number;
  occupancyRate: number;
  
  conversionRate: number; // inquiries to bookings
  
  popularDates: DateRange[];
  peakSeason: DateRange;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  bookings: number;
  earnings: number;
}

// Notifications
export interface HostNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  relatedEntityId?: string;
}

export enum NotificationType {
  NEW_BOOKING = 'new_booking',
  BOOKING_CANCELLED = 'booking_cancelled',
  NEW_MESSAGE = 'new_message',
  NEW_REVIEW = 'new_review',
  PAYMENT_RECEIVED = 'payment_received',
  CHECK_IN_REMINDER = 'check_in_reminder',
  CHECK_OUT_REMINDER = 'check_out_reminder',
  CALENDAR_UPDATE = 'calendar_update',
  PROPERTY_APPROVED = 'property_approved',
  PROPERTY_SUSPENDED = 'property_suspended',
  SYSTEM_ALERT = 'system_alert'
}

// Quick Actions
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  route: string;
  count?: number; // e.g., unread messages
  color?: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'messages',
    label: 'Messages',
    icon: 'message-circle',
    route: '/host/messages',
    color: '#FF385C'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: 'calendar',
    route: '/host/calendar',
    color: '#00A699'
  },
  {
    id: 'listings',
    label: 'Listings',
    icon: 'home',
    route: '/host/properties',
    color: '#767676'
  },
  {
    id: 'add-listing',
    label: 'Add Listing',
    icon: 'plus-circle',
    route: '/host/properties/add',
    color: '#008489'
  }
];
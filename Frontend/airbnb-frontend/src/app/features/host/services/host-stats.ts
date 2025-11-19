import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  HostDashboardStats,
  OverviewStats,
  EarningsStats,
  PerformanceStats,
  RecentActivity,
  UpcomingEvents,
  PropertyAnalytics,
  HostNotification,
  NotificationType
} from '../models/host-stats.model';
import { MOCK_DASHBOARD_STATS } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class HostStatsService {
  // Reactive state
  private statsSignal = signal<HostDashboardStats>(MOCK_DASHBOARD_STATS);
  private notificationsSignal = signal<HostNotification[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Public readonly signals
  readonly stats = this.statsSignal.asReadonly();
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    this.loadDashboardStats();
    this.loadNotifications();
  }

  /**
   * Load complete dashboard statistics
   */
  loadDashboardStats(): void {
    this.loadingSignal.set(true);
    
    setTimeout(() => {
      this.statsSignal.set(MOCK_DASHBOARD_STATS);
      this.loadingSignal.set(false);
    }, 500);
  }

  /**
   * Get complete dashboard stats
   */
  getDashboardStats(): Observable<HostDashboardStats> {
    this.loadingSignal.set(true);
    
    return of(MOCK_DASHBOARD_STATS).pipe(
      delay(300),
      map(stats => {
        this.loadingSignal.set(false);
        return stats;
      })
    );
  }

  /**
   * Get overview statistics
   */
  getOverviewStats(): Observable<OverviewStats> {
    return of(MOCK_DASHBOARD_STATS.overview).pipe(delay(200));
  }

  /**
   * Get earnings statistics
   */
  getEarningsStats(period?: 'today' | 'week' | 'month' | 'year'): Observable<EarningsStats> {
    return of(MOCK_DASHBOARD_STATS.earnings).pipe(delay(200));
  }

  /**
   * Get performance metrics
   */
  getPerformanceStats(): Observable<PerformanceStats> {
    return of(MOCK_DASHBOARD_STATS.performance).pipe(delay(200));
  }

  /**
   * Get recent activity
   */
  getRecentActivity(): Observable<RecentActivity> {
    return of(MOCK_DASHBOARD_STATS.recentActivity).pipe(delay(200));
  }

  /**
   * Get upcoming events (check-ins, check-outs)
   */
  getUpcomingEvents(): Observable<UpcomingEvents> {
    return of(MOCK_DASHBOARD_STATS.upcomingEvents).pipe(delay(200));
  }

  /**
   * Get property-specific analytics
   */
  getPropertyAnalytics(
    propertyId: string,
    period: 'week' | 'month' | 'year' = 'month'
  ): Observable<PropertyAnalytics> {
    // Mock property analytics
    const analytics: PropertyAnalytics = {
      propertyId,
      propertyTitle: 'Luxury Beachfront Villa',
      period,
      views: 456,
      viewsTrend: 12.5,
      inquiries: 45,
      inquiriesTrend: 8.2,
      bookings: 12,
      bookingsTrend: 15.3,
      earnings: 8500,
      earningsTrend: 22.1,
      averageNightlyRate: 450,
      occupancyRate: 78,
      conversionRate: 26.7,
      popularDates: [
        {
          startDate: new Date('2024-12-20'),
          endDate: new Date('2024-12-27'),
          bookings: 8,
          earnings: 3600
        }
      ],
      peakSeason: {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        bookings: 45,
        earnings: 25000
      }
    };

    return of(analytics).pipe(delay(400));
  }

  /**
   * Get earnings trend data for charts
   */
  getEarningsTrend(months: number = 6): Observable<{
    labels: string[];
    data: number[];
  }> {
    const trend = MOCK_DASHBOARD_STATS.earnings.monthlyTrend.slice(-months);
    
    return of({
      labels: trend.map(t => t.month),
      data: trend.map(t => t.earnings)
    }).pipe(delay(300));
  }

  /**
   * Get bookings trend data
   */
  getBookingsTrend(months: number = 6): Observable<{
    labels: string[];
    data: number[];
  }> {
    const trend = MOCK_DASHBOARD_STATS.earnings.monthlyTrend.slice(-months);
    
    return of({
      labels: trend.map(t => t.month),
      data: trend.map(t => t.bookings)
    }).pipe(delay(300));
  }

  /**
   * Get occupancy rate by month
   */
  getOccupancyTrend(months: number = 12): Observable<{
    labels: string[];
    data: number[];
  }> {
    // Mock data - in production, calculate from actual bookings
    const mockData = Array.from({ length: months }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      rate: Math.floor(Math.random() * 30) + 60 // 60-90%
    }));

    return of({
      labels: mockData.map(d => d.month),
      data: mockData.map(d => d.rate)
    }).pipe(delay(300));
  }

  /**
   * Load notifications
   */
  loadNotifications(): void {
    const mockNotifications: HostNotification[] = [
      {
        id: 'notif-001',
        type: NotificationType.NEW_BOOKING,
        title: 'New Booking Request',
        message: 'Emily Rodriguez requested to book your Luxury Beachfront Villa',
        timestamp: new Date('2024-11-16T10:30:00'),
        isRead: false,
        actionUrl: '/host/bookings/book-003',
        priority: 'high',
        relatedEntityId: 'book-003'
      },
      {
        id: 'notif-002',
        type: NotificationType.NEW_MESSAGE,
        title: 'New Message',
        message: 'Michael Chen sent you a message',
        timestamp: new Date('2024-11-16T14:20:00'),
        isRead: false,
        actionUrl: '/host/messages',
        priority: 'medium'
      },
      {
        id: 'notif-003',
        type: NotificationType.CHECK_IN_REMINDER,
        title: 'Check-in Tomorrow',
        message: 'Sarah Johnson checks in tomorrow at 15:00',
        timestamp: new Date('2024-11-19T09:00:00'),
        isRead: true,
        actionUrl: '/host/bookings/book-001',
        priority: 'medium',
        relatedEntityId: 'book-001'
      },
      {
        id: 'notif-004',
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Payment Received',
        message: 'You received $960 for booking #book-002',
        timestamp: new Date('2024-11-18T16:30:00'),
        isRead: true,
        actionUrl: '/host/earnings',
        priority: 'low'
      }
    ];

    this.notificationsSignal.set(mockNotifications);
  }

  /**
   * Get all notifications
   */
  getNotifications(): Observable<HostNotification[]> {
    return of(this.notificationsSignal()).pipe(delay(200));
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Observable<HostNotification[]> {
    const unread = this.notificationsSignal().filter(n => !n.isRead);
    return of(unread).pipe(delay(200));
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<number> {
    const count = this.notificationsSignal().filter(n => !n.isRead).length;
    return of(count).pipe(delay(100));
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string): Observable<boolean> {
    const current = this.notificationsSignal();
    const updated = current.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    
    this.notificationsSignal.set(updated);
    return of(true).pipe(delay(200));
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead(): Observable<boolean> {
    const current = this.notificationsSignal();
    const updated = current.map(n => ({ ...n, isRead: true }));
    
    this.notificationsSignal.set(updated);
    return of(true).pipe(delay(300));
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Observable<boolean> {
    const current = this.notificationsSignal();
    const filtered = current.filter(n => n.id !== notificationId);
    
    this.notificationsSignal.set(filtered);
    return of(true).pipe(delay(200));
  }

  /**
   * Get performance comparison (vs previous period)
   */
  getPerformanceComparison(): Observable<{
    earnings: { current: number; previous: number; change: number };
    bookings: { current: number; previous: number; change: number };
    rating: { current: number; previous: number; change: number };
    occupancy: { current: number; previous: number; change: number };
  }> {
    const comparison = {
      earnings: { current: 6500, previous: 5800, change: 12.1 },
      bookings: { current: 10, previous: 8, change: 25 },
      rating: { current: 4.87, previous: 4.82, change: 1.0 },
      occupancy: { current: 76, previous: 68, change: 11.8 }
    };

    return of(comparison).pipe(delay(300));
  }

  /**
   * Get top performing properties
   */
  getTopProperties(limit: number = 3): Observable<Array<{
    propertyId: string;
    title: string;
    earnings: number;
    bookings: number;
    rating: number;
  }>> {
    const topProperties = [
      {
        propertyId: 'prop-001',
        title: 'Luxury Beachfront Villa',
        earnings: 35000,
        bookings: 45,
        rating: 4.9
      },
      {
        propertyId: 'prop-002',
        title: 'Modern Downtown Loft',
        earnings: 28000,
        bookings: 62,
        rating: 4.8
      },
      {
        propertyId: 'prop-003',
        title: 'Cozy Mountain Cabin',
        earnings: 12000,
        bookings: 28,
        rating: 4.95
      }
    ].slice(0, limit);

    return of(topProperties).pipe(delay(300));
  }

  /**
   * Refresh all stats
   */
  refreshStats(): Observable<boolean> {
    this.loadingSignal.set(true);
    
    return of(true).pipe(
      delay(1000),
      map(() => {
        this.loadDashboardStats();
        this.loadNotifications();
        this.loadingSignal.set(false);
        return true;
      })
    );
  }

  /**
   * Export stats data (for reports)
   */
  exportStats(format: 'csv' | 'pdf' | 'json' = 'csv'): Observable<Blob> {
    // Mock export - in production, generate actual file
    const data = JSON.stringify(MOCK_DASHBOARD_STATS, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    
    return of(blob).pipe(delay(1000));
  }
}
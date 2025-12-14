import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { RevenueReport, UserActivityReport, OccupancyReport } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AdminAnalyticsComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Reports
  revenueReport = signal<RevenueReport | null>(null);
  userActivityReport = signal<UserActivityReport | null>(null);
  occupancyReport = signal<OccupancyReport | null>(null);

  // Date filters
  startDate = signal<string>('');
  endDate = signal<string>('');
  selectedReport = signal<string>('revenue');

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadReports();
  }

  setDefaultDates(): void {
    const start = new Date();
    const end = new Date();
    start.setMonth(0);
    start.setDate(1);
    end.setFullYear(end.getFullYear() + 1);

    this.startDate.set(start.toISOString().split('T')[0]);
    this.endDate.set(end.toISOString().split('T')[0]);
  }

  loadReports(): void {
    this.loading.set(true);
    this.error.set(null);

    const start = this.startDate();
    const end = this.endDate();

    this.loadRevenueReport(start, end);
    this.loadUserActivityReport(start, end);
    this.loadOccupancyReport();
  }

  loadRevenueReport(start: string, end: string): void {
    this.adminService.getRevenueReport(start, end).subscribe({
      next: (data) => {
        this.revenueReport.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading revenue report:', err);
        this.notificationService.showToast('error', 'Failed to load revenue report');
        this.loading.set(false);
      }
    });
  }

  loadUserActivityReport(start: string, end: string): void {
    this.adminService.getUserActivityReport(start, end).subscribe({
      next: (data) => {
        this.userActivityReport.set(data);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  loadOccupancyReport(): void {
    this.adminService.getOccupancyReport().subscribe({
      next: (data) => {
        this.occupancyReport.set(data);
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showToast('error', 'Failed to load occupancy report');
      }
    });
  }

  selectReport(report: string): void {
    this.selectedReport.set(report);
  }

  applyDateFilter(): void {
    this.loadReports();
    this.notificationService.showToast('info', 'Filters applied');
  }

  formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getMaxRevenue(locations: any[]): number {
    if (!locations || locations.length === 0) return 1;
    return Math.max(...locations.map(l => l.revenue));
  }

  exportToCSV(): void {
    // Implement CSV export functionality
    this.notificationService.showToast('info', 'Export functionality coming soon');
  }

  printReport(): void {
    window.print();
  }
}
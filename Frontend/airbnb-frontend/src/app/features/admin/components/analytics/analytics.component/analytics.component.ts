import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';
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

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadReports();
  }

  setDefaultDates(): void {
    const start = new Date();
    const end = new Date();

    // اجعل البداية من أول السنة الحالية (عشان نجيب كل اللي فات)
    start.setMonth(0); // شهر يناير
    start.setDate(1);  // يوم 1
    
    // اجعل النهاية بعد سنة من الآن (عشان نجيب الحجوزات المستقبلية المؤكدة Confirmed)
    end.setFullYear(end.getFullYear() + 1);

    // تنسيق التاريخ YYYY-MM-DD للـ Input
    this.startDate.set(start.toISOString().split('T')[0]);
    this.endDate.set(end.toISOString().split('T')[0]);
  }

  loadReports(): void {
    this.loading.set(true);
    this.error.set(null);

    const start = new Date(this.startDate());
    const end = new Date(this.endDate());

    // Load all reports
    this.loadRevenueReport(start, end);
    this.loadUserActivityReport(start, end);
    this.loadOccupancyReport();
  }

  loadRevenueReport(start: Date, end: Date): void {
    this.adminService.getRevenueReport(start, end).subscribe({
      next: (data) => {
        this.revenueReport.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading revenue report:', err);
        this.loading.set(false);
      }
    });
  }

  loadUserActivityReport(start: Date, end: Date): void {
    this.adminService.getUserActivityReport(start, end).subscribe({
      next: (data) => {
        this.userActivityReport.set(data);
      },
      error: (err) => {
        console.error('Error loading user activity report:', err);
      }
    });
  }

  loadOccupancyReport(): void {
    this.adminService.getOccupancyReport().subscribe({
      next: (data) => {
        this.occupancyReport.set(data);
      },
      error: (err) => {
        console.error('Error loading occupancy report:', err);
      }
    });
  }

  selectReport(report: string): void {
    this.selectedReport.set(report);
  }

  applyDateFilter(): void {
    this.loadReports();
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
    console.log('Exporting to CSV...');
    this.showNotification('Export functionality coming soon');
  }

  printReport(): void {
    window.print();
  }

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`${type}: ${message}`);
  }
}
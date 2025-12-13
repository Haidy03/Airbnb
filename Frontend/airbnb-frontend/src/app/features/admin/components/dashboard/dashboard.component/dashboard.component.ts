import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../serevices/admin.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { DashboardStats } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard statistics';
        this.loading = false;
        console.error('Error loading dashboard stats:', err);
        // إظهار توست للمستخدم بالإضافة لرسالة الخطأ في الواجهة
        this.notificationService.showToast('error', 'Failed to load dashboard data');
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([`/admin/${route}`]);
  }

  get revenueGrowth(): number {
    if (!this.stats) return 0;
    const totalRevenue = this.stats.totalRevenue;
    const monthlyRevenue = this.stats.monthlyRevenue;
    if (totalRevenue === 0) return 0;
    return ((monthlyRevenue / totalRevenue) * 100);
  }

  get bookingCompletionRate(): number {
    if (!this.stats || this.stats.totalBookings === 0) return 0;
    return (this.stats.completedBookings / this.stats.totalBookings) * 100;
  }

  getMaxRevenue(): number {
    if (!this.stats || !this.stats.revenueByMonth.length) return 1;
    return Math.max(...this.stats.revenueByMonth.map(m => m.revenue));
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property';
import { HostDashboardStats } from '../../models/property.model';

@Component({
  selector: 'app-host-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './host-dashboard.html',
  styleUrl: './host-dashboard.css',
})
export class HostDashboard implements OnInit {
  stats!: HostDashboardStats;
  isLoading = true;
  currentDate = new Date();
  
  // Tab Selection
  activeTab: 'today' | 'upcoming' = 'today';

  // For greeting message
  greetingMessage = '';
  hostName = 'Host'; // لما Authentication يخلص هناخده من الـ Token

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.setGreetingMessage();
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.isLoading = true;
    this.propertyService.getHostDashboardStats('host-1').subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }

  setGreetingMessage(): void {
    const hour = this.currentDate.getHours();
    if (hour < 12) {
      this.greetingMessage = 'Good morning';
    } else if (hour < 18) {
      this.greetingMessage = 'Good afternoon';
    } else {
      this.greetingMessage = 'Good evening';
    }
  }

  getMonthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'long' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getImageUrl(url: string): string {
    return url || 'https://via.placeholder.com/400x300?text=No+Image';
  }
}
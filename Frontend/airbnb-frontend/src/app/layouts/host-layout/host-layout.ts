import { Component, signal,inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet,RouterLinkActive  } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HostStatsService } from '../../features/host/services/host-stats';
import { MessageService } from '../../features/messages/Services/message';
interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-host-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet,RouterLinkActive],
  templateUrl: './host-layout.html',
  styleUrls: ['./host-layout.css']
})
export class HostLayoutComponent implements OnInit{
  // Sidebar state
  sidebarOpen = signal<boolean>(true);
  mobileMenuOpen = signal<boolean>(false);
  public messageService = inject(MessageService);
  
  // User notifications
  //unreadNotifications = signal<number>(0);

  // Navigation items
  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/host/dashboard', icon: '📊' },
    { label: 'Calendar', route: '/host/calendar', icon: '📅' },
    { label: 'My Listings', route: '/host/properties', icon: '🏠' },
    { label: 'Bookings', route: '/host/bookings', icon: '📝' },
    { label: 'Messages', route: '/host/messages', icon: '💬', badge: 2 },
    { label: 'Earnings', route: '/host/earnings', icon: '💰' },
    { label: 'Reviews', route: '/host/reviews', icon: '⭐' },
    { label: 'Performance', route: '/host/performance', icon: '📈' },
  ];

  // Mock user data (replace with actual auth service)
  user = {
    name: 'Host Name',
    email: 'host@example.com',
    avatar: 'https://i.pravatar.cc/150?img=33',
    isSuperhost: true
  };

  constructor(
    private router: Router,
   // private hostStatsService: HostStatsService
  ) {
   // this.loadNotificationCount();
  }

   ngOnInit() {
    // ✅ تحديث العداد عند تحميل الصفحة لأول مرة
    this.messageService.refreshUnreadCount();
  }
  /**
   * Load unread notification count
   */
  // loadNotificationCount(): void {
  //   this.hostStatsService.getUnreadCount().subscribe(count => {
  //     this.unreadNotifications.set(count);
  //   });
  // }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  /**
   * Check if route is active
   */
  isActiveRoute(route: string): boolean {
    return this.router.url.includes(route);
  }

  /**
   * Navigate to route and close mobile menu
   */
  navigateAndClose(route: string): void {
    this.router.navigate([route]);
    this.mobileMenuOpen.set(false);
  }

  /**
   * Logout (implement with your auth service)
   */
  logout(): void {
    // Implement logout logic
    console.log('Logging out...');
    this.router.navigate(['/']);
  }
}
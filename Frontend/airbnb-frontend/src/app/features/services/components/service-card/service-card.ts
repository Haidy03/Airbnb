import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // ✅ Router added
import { ServiceCard } from '../../models/service.model';
import { environment } from '../../../../../environments/environment';
import { ServicesService } from '../../services/service'; 
import { AuthService } from '../../../auth/services/auth.service'; // ✅ Auth added

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-card.html',
  styleUrls: ['./service-card.css']
})
export class ServiceCardComponent implements OnInit {
  @Input() service!: ServiceCard;
  
  // ✅ State for Wishlist
  @Input() set wishlisted(value: boolean) {
    this.isWishlisted.set(value);
  }
  isWishlisted = signal(false);
  private baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
  private servicesService = inject(ServicesService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // لو المستخدم مسجل دخول، نتأكد هل الخدمة دي في الـ Wishlist ولا لأ
    if (this.authService.isAuthenticated) {
      this.servicesService.checkIsWishlisted(this.service.id).subscribe({
        next: (status) => this.isWishlisted.set(status),
        error: () => this.isWishlisted.set(false)
      });
    }
  }

  toggleWishlist(event: Event) {
    event.stopPropagation(); // ⛔ منع فتح صفحة التفاصيل عند الضغط على القلب
    event.preventDefault();

    // لو مش مسجل دخول، نوديه للوجين
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    // 1. Optimistic UI Update (نغير اللون فوراً عشان السرعة)
    const previousState = this.isWishlisted();
    this.isWishlisted.update(v => !v);

    // 2. Call API
    this.servicesService.toggleWishlist(this.service.id).subscribe({
      next: (res) => {
        console.log(res.message); // 'Added' or 'Removed'
      },
      error: (err) => {
        console.error(err);
        this.isWishlisted.set(previousState); // نرجع الحالة القديمة لو حصل خطأ
      }
    });
  }

  getImageUrl(url: string | undefined | null): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http') || url.startsWith('https')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanPath}`;
  }
}
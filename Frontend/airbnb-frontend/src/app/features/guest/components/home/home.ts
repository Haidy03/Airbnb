import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { SearchService } from '../search/services/search-service';
import { Property } from '../search/models/property.model';
import { WishlistService } from '../../services/wishlist.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Router } from '@angular/router';


interface CityGroup {
  city: string;
  properties: Property[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit {

  cityGroups: CityGroup[] = [];
  isLoading = true;

  constructor(
    private searchService: SearchService,
    private wishlistService: WishlistService,
    // 2. حقن السيرفس
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  private loadProperties(): void {
    this.isLoading = true;
    this.searchService.getFeaturedProperties().subscribe({
      next: (data) => {
        this.groupPropertiesByCity(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Connection Error:', err);
        this.isLoading = false;
      }
    });
  }

  private groupPropertiesByCity(allProperties: Property[]) {
    const groups: { [key: string]: Property[] } = {};
    allProperties.forEach(property => {
      const city = property.location.city || 'Other Locations';
      if (!groups[city]) groups[city] = [];
      groups[city].push(property);
    });
    this.cityGroups = Object.keys(groups).map(city => ({
      city: city,
      properties: groups[city]
    }));
  }

  isPropertyInWishlist(propertyId: string): boolean {
    return this.wishlistService.isInWishlist(Number(propertyId));
  }

  // 3. تعديل دالة القلب لإظهار الإشعار
  onToggleWishlist(property: Property): void {
    if (this.isPropertyInWishlist(property.id)) {
      this.wishlistService.removeFromWishlist(Number(property.id));
      // إشعار الحذف (اختياري)
      this.toastService.show('Removed from Wishlists', 'success');
    } else {
      this.wishlistService.addToWishlist(property as any);
      // إشعار الإضافة
      this.toastService.show('Saved to Wishlists', 'success');
    }
  }

  onPropertyClick(property: Property): void {
    // الانتقال لصفحة /listing/1 مثلاً
    this.router.navigate(['/listing', property.id]);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { SearchService } from '../search/services/search-service';
import { Property } from '../search/models/property.model';
import { WishlistService } from '../../services/wishlist.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { ListingService } from '../../services/Lisiting-Services'; 



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
  wishlistIds: Set<string> = new Set();

  constructor(
    private searchService: SearchService,
    private wishlistService: WishlistService,
    private listingService: ListingService,
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
        data.forEach(p => {
            this.listingService.checkIsWishlisted(p.id).subscribe(isListed => {
                if(isListed) this.wishlistIds.add(p.id);
            });
            });
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
    return this.wishlistIds.has(propertyId);
  }

  // ✅ UPDATE: دالة القلب الجديدة (مع الباك اند)
  onToggleWishlist(property: Property, event: Event): void {
    event.stopPropagation(); // منع فتح الصفحة عند الضغط على القلب
    
    // 1. تحديث فوري للشكل (Optimistic UI)
    if (this.wishlistIds.has(property.id)) {
      this.wishlistIds.delete(property.id);
    } else {
      this.wishlistIds.add(property.id);
    }

    // 2. إرسال الطلب للباك اند
    this.listingService.toggleWishlist(property.id).subscribe({
      next: (res: any) => {
        // لو نجح، خلاص (إحنا حدثنا الشكل فوق)
        console.log(res.message);
      },
      error: (err) => {
        // لو فشل، نرجع الشكل زي ما كان
        console.error(err);
        if (this.wishlistIds.has(property.id)) {
            this.wishlistIds.delete(property.id);
        } else {
            this.wishlistIds.add(property.id);
        }
      }
    });
  }
  
  onPropertyClick(property: Property): void {
    // الانتقال لصفحة /listing/1 مثلاً
    this.router.navigate(['/listing', property.id]);
  }
}

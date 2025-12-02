/* import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// شلنا HeaderComponent من الـ imports لأنه بقى Global
import { WishlistService } from '../../services/wishlist.service';
import { Property } from '../search/models/property.model';
import { ToastService } from '../../../../core/services/toast.service'; // لو عايز إشعار عند الحذف


@Component({
  selector: 'app-wishlists',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlists.html',
  styleUrls: ['./wishlists.css']
})
export class WishlistsComponent implements OnInit {

  wishlistItems: Property[] = [];

  constructor(
    public wishlistService: WishlistService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistItems = items;
    });

    // تحديث القائمة عند فتح الصفحة
    this.wishlistService.loadWishlist();
  }

  removeFromWishlist(id: string) {
    this.wishlistService.toggleWishlist(Number(id)).subscribe(() => {
        this.toastService.show('Removed from wishlist', 'success');
    });
  }
}
 */


import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { ExperienceCardComponent } from '../../../experience/components/experience-card/experience-card.component/experience-card.component';
import { ExperienceService } from '../../../../shared/Services/experience.service';
import { ListingService } from '../../services/Lisiting-Services';
import { environment } from '../../../../../environments/environment.development';
import { ServiceCardComponent } from '../../../services/components/service-card/service-card';

@Component({
  selector: 'app-wishlists',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ExperienceCardComponent, ServiceCardComponent],
  templateUrl: './wishlists.html',
  styleUrls: ['./wishlists.css']
})
export class WishlistsComponent implements OnInit {
  
  // ✅ استخدام Signal (زي ما عملنا في الـ Trips)
  wishlistItems = signal<any[]>([]);
  isLoading = signal(true);

  constructor(
    private experienceService: ExperienceService,
    private listingService: ListingService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    // ✅ المناداة على الـ Endpoint الموحدة اللي بتجيب تجارب + شقق
    this.experienceService.getWishlist().subscribe({
      next: (res: any) => {
        if (res.success) {
          // تحويل البيانات لتناسب شكل الكارت الموحد
          const mappedItems = res.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            type: item.type, // "Experience", "Home", "Service"
            imageUrl: this.getImageUrl(item.image || item.primaryImage), 
            primaryImage: this.getImageUrl(item.image || item.primaryImage),
            rating: item.rating || 0,
            city: item.city || '',
            country: item.country || '',
            
            // ✅ بيانات خاصة بالـ Experience/Home Card
            pricePerPerson: item.price, 
            totalReviews: 0,

            // ✅ بيانات خاصة بالـ Service Card (عشان الكارت ميديناش ايرور)
            pricePerUnit: item.price, 
            pricingUnit: 'guest', // قيمة افتراضية للعرض في الويش ليست
            hostName: 'Host',     // قيمة افتراضية لو الباك اند مبعتهاش
            categoryName: item.type ,
             isWishlisted: true 
          }));
          
          this.wishlistItems.set(mappedItems);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading wishlist:', err);
        this.isLoading.set(false);
      }
    });
  }
  getImageUrl(imageUrl?: string): string {
    if (!imageUrl) return 'assets/images/placeholder.jpg';
    if (imageUrl.startsWith('http')) return imageUrl;

    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    let cleanPath = imageUrl;
    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }
    return `${baseUrl}${cleanPath}`;
  }
}
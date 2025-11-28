import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Property, PropertyType, CancellationPolicy } from '../components/search/models/property.model';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private apiUrl = `${environment.apiUrl}/Wishlist`;

  private wishlistSubject = new BehaviorSubject<Property[]>([]);
  wishlist$ = this.wishlistSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    if (this.authService.isAuthenticated) {
      this.loadWishlist();
    }
  }

  loadWishlist() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (dtos) => {
        // هنا بيتم تحويل الداتا وإصلاح روابط الصور
        const properties = dtos.map(dto => this.mapToFrontendProperty(dto));
        this.wishlistSubject.next(properties);
      },
      error: (err) => console.error('Failed to load wishlist', err)
    });
  }

  toggleWishlist(propertyId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/toggle/${propertyId}`, {}).pipe(
      tap(() => {
        this.loadWishlist(); // إعادة تحميل القائمة لتحديث العرض
      })
    );
  }

  removeFromWishlist(propertyId: number) {
    // دالة مساعدة للحذف السريع من الواجهة (Optimistic update)
    this.toggleWishlist(propertyId).subscribe();

    // تحديث اللوكال فورا عشان اليوزر ميحسش ببطء
    const current = this.wishlistSubject.value.filter(p => Number(p.id) !== propertyId);
    this.wishlistSubject.next(current);
  }

  isInWishlist(propertyId: number): boolean {
    return this.wishlistSubject.value.some(p => Number(p.id) === propertyId);
  }

  private mapToFrontendProperty(dto: any): Property {
    return {
      id: (dto.id || dto.Id).toString(),
      title: dto.title || dto.Title,
      price: dto.pricePerNight || dto.PricePerNight,
      currency: 'EGP',
      rating: dto.rating || dto.Rating || 0,
      reviewsCount: dto.totalReviews || dto.TotalReviews || 0,
      isGuestFavorite: dto.isGuestFavorite || dto.IsGuestFavorite,
      isFavorite: true,

      type: PropertyType.APARTMENT,
      description: '',
      location: {
        city: dto.city || dto.City,
        country: dto.country || dto.Country,
        address: '', state: '', zipCode: '', latitude: 0, longitude: 0
      },
      images: [{
        id: '1',
        // هنا التعديل المهم: استخدام دالة الإصلاح
        url: this.fixImageUrl(dto.imageUrl || dto.ImageUrl),
        order: 1, isMain: true
      }],
      host: { id: '0', firstName: 'Host', lastName: '', avatar: '', isSuperhost: false, joinedDate: new Date(), responseRate: 0, responseTime: '' },
      amenities: [],
      capacity: { guests: 0, bedrooms: 0, beds: 0, bathrooms: 0 },
      availableDates: [],
      instantBook: false,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // دالة إصلاح الرابط (نفس اللي في SearchService)
  private fixImageUrl(url: string): string {
    if (!url) return 'assets/images/placeholder-property.jpg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${environment.imageBaseUrl}/${cleanUrl}`;
  }
}

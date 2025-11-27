import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, BehaviorSubject, of, tap, Subject  } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  Property,
  PropertySearchResultDto,
  PagedResult,
  SearchRequestDto,
  SearchQuery,
  SearchResponse,
  PropertyType,
  CancellationPolicy
} from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  private apiUrl = `${environment.apiUrl}/Search`;


  private openFiltersSource = new Subject<void>();
  openFilters$ = this.openFiltersSource.asObservable();

  // مخزن للأماكن المتاحة (عشان الاقتراحات)
  private locationsSubject = new BehaviorSubject<string[]>([]);
  locations$ = this.locationsSubject.asObservable();

  private favoritesSubject = new BehaviorSubject<Set<string>>(new Set());
  favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {
    // أول ما السيرفس تقوم، هات الأماكن المتاحة (ممكن تحسنها تجيبها من API مخصوص)
    this.loadInitialLocations();
  }

  triggerOpenFilters() {
    this.openFiltersSource.next();
  }


  private loadInitialLocations() {
    // بنجيب الـ Featured عشان نطلع منها المدن المتاحة حالياً
    this.getFeaturedProperties().subscribe(properties => {
      const cities = [...new Set(properties.map(p => p.location.city))];
      this.locationsSubject.next(cities);
    });
  }

  getFeaturedProperties(): Observable<Property[]> {
    return this.http.get<any[]>(`${this.apiUrl}/featured`).pipe(
      map(dtos => dtos.map(dto => this.mapToFrontendProperty(dto))),
      tap(properties => {
        // تحديث قائمة المدن المتاحة بناءً على الداتا اللي رجعت
        const cities = [...new Set(properties.map(p => p.location.city))];
        this.locationsSubject.next(cities);
      })
    );
  }

  searchProperties(query: SearchQuery): Observable<SearchResponse> {
    const request: SearchRequestDto = {
      location: query.filters.location,
      checkIn: query.filters.checkIn ? new Date(query.filters.checkIn).toISOString() : undefined,
      checkOut: query.filters.checkOut ? new Date(query.filters.checkOut).toISOString() : undefined,
      guests: query.filters.guests,
      pageIndex: query.page,
      pageSize: query.pageSize
    };

    return this.http.post<PagedResult<any>>(`${this.apiUrl}/properties`, request).pipe(
      map(response => ({
        properties: response.items.map(item => this.mapToFrontendProperty(item)),
        total: response.totalCount,
        page: response.pageIndex,
        pageSize: response.pageSize,
        totalPages: response.totalPages
      }))
    );
  }

  private mapToFrontendProperty(dto: any): Property {
    return {
      id: (dto.id || dto.Id).toString(),
      title: dto.title || dto.Title || 'Unknown Title',
      price: dto.pricePerNight || dto.PricePerNight || 0,
      currency: 'EGP',
      rating: dto.rating || dto.Rating || 0,
      reviewsCount: dto.totalReviews || dto.TotalReviews || 0,
      isGuestFavorite: dto.isGuestFavorite || dto.IsGuestFavorite || false,
      isFavorite: this.isFavorite((dto.id || dto.Id).toString()),

      type: PropertyType.APARTMENT,
      description: '',
      location: {
        city: dto.city || dto.City || 'Cairo',
        country: dto.country || dto.Country || 'Egypt',
        address: '', state: '', zipCode: '', latitude: 0, longitude: 0
      },
      images: [
        {
          id: '1',
          url: this.fixImageUrl(dto.imageUrl || dto.ImageUrl),
          order: 1, isMain: true
        }
      ],
      host: {
        id: '0', firstName: 'Host', lastName: '', avatar: 'assets/default-avatar.png',
        isSuperhost: false, joinedDate: new Date(), responseRate: 100, responseTime: '1 hour'
      },
      amenities: [],
      capacity: { guests: 0, bedrooms: 0, beds: 0, bathrooms: 0 },
      availableDates: [],
      instantBook: false,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private fixImageUrl(url: string): string {
    if (!url) return 'assets/images/placeholder-property.jpg';
    if (url.startsWith('http')) return url;
    return `${environment.imageBaseUrl}/${url}`;
  }

  toggleFavorite(propertyId: string): void {
    const favorites = this.favoritesSubject.value;
    if (favorites.has(propertyId)) favorites.delete(propertyId);
    else favorites.add(propertyId);
    this.favoritesSubject.next(new Set(favorites));
  }

  isFavorite(propertyId: string): boolean {
    return this.favoritesSubject.value.has(propertyId);
  }
}

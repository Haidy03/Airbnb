import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, BehaviorSubject, of } from 'rxjs';
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

  // الرابط أصبح: https://localhost:5202/api/Search
  private apiUrl = `${environment.apiUrl}/Search`;

  private favoritesSubject = new BehaviorSubject<Set<string>>(new Set());
  favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 1. جلب العقارات المميزة (للصفحة الرئيسية)
  getFeaturedProperties(): Observable<Property[]> {
    return this.http.get<PropertySearchResultDto[]>(`${this.apiUrl}/featured`).pipe(
      map(dtos => dtos.map(dto => this.mapToFrontendProperty(dto)))
    );
  }

  // 2. البحث (لصفحة البحث)
  searchProperties(query: SearchQuery): Observable<SearchResponse> {
    const request: SearchRequestDto = {
      location: query.filters.location,
      checkIn: query.filters.checkIn ? new Date(query.filters.checkIn).toISOString() : undefined,
      checkOut: query.filters.checkOut ? new Date(query.filters.checkOut).toISOString() : undefined,
      guests: query.filters.guests,
      pageIndex: query.page,
      pageSize: query.pageSize
    };

    return this.http.post<PagedResult<PropertySearchResultDto>>(`${this.apiUrl}/properties`, request).pipe(
      map(response => ({
        properties: response.items.map(item => this.mapToFrontendProperty(item)),
        total: response.totalCount,
        page: response.pageIndex,
        pageSize: response.pageSize,
        totalPages: response.totalPages
      }))
    );
  }

  // 3. تحويل (Mapping) من الباك للفرونت
  private mapToFrontendProperty(dto: PropertySearchResultDto): Property {
    return {
      id: dto.id.toString(),
      title: dto.title,
      price: dto.pricePerNight,
      currency: 'EGP',
      rating: dto.rating,
      reviewsCount: dto.totalReviews,
      isGuestFavorite: dto.isGuestFavorite,
      isFavorite: this.isFavorite(dto.id.toString()), // Check local favorites

      // Default values for UI compatibility
      type: PropertyType.APARTMENT,
      description: '',
      location: {
        city: dto.city,
        country: dto.country,
        address: `${dto.city}, ${dto.country}`,
        state: '',
        zipCode: '',
        latitude: 0,
        longitude: 0
      },
      images: [
        {
          id: '1',
          url: this.fixImageUrl(dto.imageUrl),
          order: 1,
          isMain: true
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

  // إصلاح رابط الصورة
  private fixImageUrl(url: string): string {
    if (!url) return 'assets/placeholder.jpg'; // صورة احتياطية
    if (url.startsWith('http')) return url;
    // لو الصورة جاية "uploads/properties/image.jpg" بنزود عليها الدومين
    return `${environment.imageBaseUrl}/${url}`;
  }

  // --- Wishlist Logic ---
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

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, BehaviorSubject, Subject, tap } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  Property, PagedResult, SearchRequestDto, SearchQuery, SearchResponse, PropertyType, CancellationPolicy
} from '../models/property.model';

@Injectable({ providedIn: 'root' })
export class SearchService {

  private apiUrl = `${environment.apiUrl}/Search`;
  private openFiltersSource = new Subject<void>();
  openFilters$ = this.openFiltersSource.asObservable();
  private locationsSubject = new BehaviorSubject<string[]>([]);
  locations$ = this.locationsSubject.asObservable();
  private favoritesSubject = new BehaviorSubject<Set<string>>(new Set());
  favorites$ = this.favoritesSubject.asObservable();
  

  constructor(private http: HttpClient) { this.loadInitialLocations(); }

  triggerOpenFilters() { this.openFiltersSource.next(); }

  private loadInitialLocations() {
    this.getFeaturedProperties().subscribe(properties => {
      const cities = [...new Set(properties.map(p => p.location.city))].filter(c => c);
      this.locationsSubject.next(cities);
    });
  }

  getFeaturedProperties(): Observable<Property[]> {
    return this.http.get<any[]>(`${this.apiUrl}/featured`).pipe(
      map(dtos => dtos.map(dto => this.mapToFrontendProperty(dto))),
      tap(properties => {
        const cities = [...new Set(properties.map(p => p.location.city))].filter(c => c);
        this.locationsSubject.next(cities);
      })
    );
  }

  searchProperties(query: SearchQuery): Observable<SearchResponse> {

    // 1. Property Type (String)
    let selectedType: string | null = null;
    if (query.filters.propertyTypes && query.filters.propertyTypes.length > 0) {
      selectedType = query.filters.propertyTypes[0].toString();
    }

    // 2. Amenities (Convert Array of Strings -> Array of Numbers)
    let selectedAmenityIds: number[] | undefined = undefined;
    if (query.filters.amenities && query.filters.amenities.length > 0) {
      selectedAmenityIds = query.filters.amenities
        .map(id => Number(id)) 
        .filter(n => !isNaN(n));
    }

    // 3. Request Body
    const requestBody = {
      pageIndex: query.page,
      pageSize: query.pageSize,
      
      location: query.filters.location || null,
      checkInDate: query.filters.checkIn ? new Date(query.filters.checkIn).toISOString() : null,
      checkOutDate: query.filters.checkOut ? new Date(query.filters.checkOut).toISOString() : null,
      guestCount: (query.filters.guests && query.filters.guests > 0) ? query.filters.guests : null,

      minPrice: query.filters.priceMin || null,
      maxPrice: (query.filters.priceMax && query.filters.priceMax < 50000) ? query.filters.priceMax : null,

      propertyType: selectedType || null,
      amenityIds: (selectedAmenityIds && selectedAmenityIds.length > 0) ? selectedAmenityIds : null,

      // Rooms
      bedrooms: query.filters.bedrooms || null,
      beds: query.filters.beds || null,
      bathrooms: query.filters.bathrooms || null,
      isInstantBook: query.filters.instantBook !== undefined ? query.filters.instantBook : null,
      rating: query.filters.rating || null,
      sortBy: query.sortBy || "popular"
    };

    console.log('🚀 SENDING FILTERS:', requestBody);

    return this.http.post<PagedResult<any>>(`${this.apiUrl}/properties`, requestBody).pipe(
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
      title: dto.title || dto.Title,
      price: dto.pricePerNight || dto.PricePerNight,
      currency: 'EGP',
      rating: dto.rating || dto.Rating || 0,
      reviewsCount: dto.totalReviews || dto.TotalReviews || 0,
      isGuestFavorite: dto.isGuestFavorite || dto.IsGuestFavorite,
      isFavorite: this.isFavorite((dto.id || dto.Id).toString()),
      type: PropertyType.APARTMENT,
      description: '',
      location: {
        city: dto.city || dto.City,
        country: dto.country || dto.Country,
        address: '', state: '', zipCode: '',
         latitude: dto.latitude || dto.Latitude || 0, 
        longitude: dto.longitude || dto.Longitude || 0
      },
      images: [{
        id: '1',
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

  private fixImageUrl(url: string): string {
    if (!url) return 'assets/images/placeholder-property.jpg';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return `${environment.imageBaseUrl}/${cleanUrl}`;
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

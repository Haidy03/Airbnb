
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, delay } from 'rxjs';
import { Property, SearchQuery, SearchResponse, SearchFilters, PropertyType, AmenityCategory, CancellationPolicy } from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private favoritesSubject = new BehaviorSubject<Set<string>>(new Set());
  favorites$ = this.favoritesSubject.asObservable();

  private dummyProperties: Property[] = [
    {
      id: '1',
      title: 'Room in Khayerat',
      type: PropertyType.ROOM,
      description: 'Cozy room with traditional Egyptian decor',
      price: 1826,
      currency: 'EGP',
      rating: 4.98,
      reviewsCount: 124,
      location: {
        address: '123 Main Street',
        city: 'Khayerat',
        state: 'Cairo',
        country: 'Egypt',
        zipCode: '12345',
        latitude: 30.0444,
        longitude: 31.2357,
        neighborhood: 'Downtown'
      },
      images: [
        { id: '1', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', caption: 'Living room', order: 1, isMain: true },
        { id: '2', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', caption: 'Bedroom', order: 2, isMain: false }
      ],
      amenities: [
        { id: '1', name: 'WiFi', icon: 'bi-wifi', category: AmenityCategory.BASIC },
        { id: '2', name: 'Kitchen', icon: 'bi-house', category: AmenityCategory.KITCHEN }
      ],
      host: {
        id: 'host1',
        firstName: 'Ahmed',
        lastName: 'Hassan',
        avatar: 'https://i.pravatar.cc/150?img=1',
        isSuperhost: true,
        joinedDate: new Date('2020-01-15'),
        responseRate: 98,
        responseTime: 'Within an hour'
      },
      capacity: {
        guests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1
      },
      isGuestFavorite: true,
      isFavorite: false,
      availableDates: [],
      instantBook: true,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-11-15')
    },
    {
      id: '2',
      title: 'Apartment in El Sabaien',
      type: PropertyType.APARTMENT,
      description: 'Modern apartment with city views',
      price: 4725,
      currency: 'EGP',
      rating: 4.97,
      reviewsCount: 89,
      location: {
        address: '456 Second Street',
        city: 'El Sabaien',
        state: 'Cairo',
        country: 'Egypt',
        zipCode: '12346',
        latitude: 30.0626,
        longitude: 31.2497,
        neighborhood: 'Zamalek'
      },
      images: [
        { id: '3', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', caption: 'Living space', order: 1, isMain: true },
        { id: '4', url: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800', caption: 'Kitchen', order: 2, isMain: false }
      ],
      amenities: [
        { id: '1', name: 'WiFi', icon: 'bi-wifi', category: AmenityCategory.BASIC },
        { id: '3', name: 'Pool', icon: 'bi-water', category: AmenityCategory.OUTDOOR }
      ],
      host: {
        id: 'host2',
        firstName: 'Sara',
        lastName: 'Mohamed',
        avatar: 'https://i.pravatar.cc/150?img=5',
        isSuperhost: false,
        joinedDate: new Date('2021-03-10'),
        responseRate: 95,
        responseTime: 'Within a few hours'
      },
      capacity: {
        guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2
      },
      isGuestFavorite: true,
      isFavorite: false,
      availableDates: [],
      instantBook: false,
      cancellationPolicy: CancellationPolicy.MODERATE,
      createdAt: new Date('2023-03-20'),
      updatedAt: new Date('2024-11-10')
    },
    {
      id: '3',
      title: 'Apartment in مشيك',
      type: PropertyType.APARTMENT,
      description: 'Stylish apartment perfect for families',
      price: 10202,
      currency: 'EGP',
      rating: 4.99,
      reviewsCount: 156,
      location: {
        address: '789 Third Avenue',
        city: 'مشيك',
        state: 'Cairo',
        country: 'Egypt',
        zipCode: '12347',
        latitude: 30.0500,
        longitude: 31.2333,
        neighborhood: 'Heliopolis'
      },
      images: [
        { id: '5', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', caption: 'Living room', order: 1, isMain: true },
        { id: '6', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', caption: 'Balcony view', order: 2, isMain: false }
      ],
      amenities: [
        { id: '1', name: 'WiFi', icon: 'bi-wifi', category: AmenityCategory.BASIC },
        { id: '4', name: 'TV', icon: 'bi-tv', category: AmenityCategory.ENTERTAINMENT }
      ],
      host: {
        id: 'host3',
        firstName: 'Omar',
        lastName: 'Ibrahim',
        avatar: 'https://i.pravatar.cc/150?img=12',
        isSuperhost: true,
        joinedDate: new Date('2019-06-20'),
        responseRate: 100,
        responseTime: 'Within an hour'
      },
      capacity: {
        guests: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2
      },
      isGuestFavorite: true,
      isFavorite: false,
      availableDates: [],
      instantBook: true,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      createdAt: new Date('2023-02-10'),
      updatedAt: new Date('2024-11-12')
    },
    {
      id: '4',
      title: 'Apartment in Bab El Louk',
      type: PropertyType.APARTMENT,
      description: 'Central location with great amenities',
      price: 2801,
      currency: 'EGP',
      rating: 4.88,
      reviewsCount: 67,
      location: {
        address: '321 Fourth Road',
        city: 'Bab El Louk',
        state: 'Cairo',
        country: 'Egypt',
        zipCode: '12348',
        latitude: 30.0400,
        longitude: 31.2400,
        neighborhood: 'Downtown'
      },
      images: [
        { id: '7', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', caption: 'Bedroom', order: 1, isMain: true },
        { id: '8', url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', caption: 'Bathroom', order: 2, isMain: false }
      ],
      amenities: [
        { id: '1', name: 'WiFi', icon: 'bi-wifi', category: AmenityCategory.BASIC },
        { id: '5', name: 'AC', icon: 'bi-snow', category: AmenityCategory.BASIC }
      ],
      host: {
        id: 'host4',
        firstName: 'Layla',
        lastName: 'Ali',
        avatar: 'https://i.pravatar.cc/150?img=9',
        isSuperhost: false,
        joinedDate: new Date('2022-01-05'),
        responseRate: 92,
        responseTime: 'Within a day'
      },
      capacity: {
        guests: 3,
        bedrooms: 1,
        beds: 2,
        bathrooms: 1
      },
      isGuestFavorite: true,
      isFavorite: false,
      availableDates: [],
      instantBook: false,
      cancellationPolicy: CancellationPolicy.MODERATE,
      createdAt: new Date('2023-04-18'),
      updatedAt: new Date('2024-11-08')
    },
    {
      id: '5',
      title: 'Apartment in El Balaqsa',
      type: PropertyType.APARTMENT,
      description: 'Quiet neighborhood with modern facilities',
      price: 2970,
      currency: 'EGP',
      rating: 4.81,
      reviewsCount: 43,
      location: {
        address: '555 Fifth Lane',
        city: 'El Balaqsa',
        state: 'Cairo',
        country: 'Egypt',
        zipCode: '12349',
        latitude: 30.0700,
        longitude: 31.2200,
        neighborhood: 'Mohandessin'
      },
      images: [
        { id: '9', url: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800', caption: 'Entrance', order: 1, isMain: true },
        { id: '10', url: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800', caption: 'Living area', order: 2, isMain: false }
      ],
      amenities: [
        { id: '1', name: 'WiFi', icon: 'bi-wifi', category: AmenityCategory.BASIC },
        { id: '6', name: 'Parking', icon: 'bi-car-front', category: AmenityCategory.OUTDOOR }
      ],
      host: {
        id: 'host5',
        firstName: 'Youssef',
        lastName: 'Khaled',
        avatar: 'https://i.pravatar.cc/150?img=7',
        isSuperhost: true,
        joinedDate: new Date('2020-08-12'),
        responseRate: 97,
        responseTime: 'Within an hour'
      },
      capacity: {
        guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1
      },
      isGuestFavorite: true,
      isFavorite: false,
      availableDates: [],
      instantBook: true,
      cancellationPolicy: CancellationPolicy.STRICT,
      createdAt: new Date('2023-05-22'),
      updatedAt: new Date('2024-11-14')
    },
    {
      id: '6',
      title: 'Room in El Ismailia',
      type: PropertyType.ROOM,
      description: 'Comfortable room with private entrance',
      price: 2953,
      currency: 'EGP',
      rating: 4.99,
      reviewsCount: 201,
      location: {
        address: '777 Sixth Street',
        city: 'El Ismailia',
        state: 'Cairo',
        country: 'Egypt',
        zipCode: '12350',
        latitude: 30.0550,
        longitude: 31.2450,
        neighborhood: 'Nasr City'
      },
      images: [
        { id: '11', url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', caption: 'Room view', order: 1, isMain: true },
        { id: '12', url: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800', caption: 'Work space', order: 2, isMain: false }
      ],
      amenities: [
        { id: '1', name: 'WiFi', icon: 'bi-wifi', category: AmenityCategory.BASIC },
        { id: '7', name: 'Workspace', icon: 'bi-laptop', category: AmenityCategory.BASIC }
      ],
      host: {
        id: 'host6',
        firstName: 'Nour',
        lastName: 'Mahmoud',
        avatar: 'https://i.pravatar.cc/150?img=10',
        isSuperhost: true,
        joinedDate: new Date('2019-11-30'),
        responseRate: 99,
        responseTime: 'Within an hour'
      },
      capacity: {
        guests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1
      },
      isGuestFavorite: true,
      isFavorite: false,
      availableDates: [],
      instantBook: true,
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      createdAt: new Date('2023-06-05'),
      updatedAt: new Date('2024-11-16')
    }
  ];

  searchProperties(query: SearchQuery): Observable<SearchResponse> {
    let filtered = [...this.dummyProperties];

    // Apply filters
    if (query.filters.location) {
      const loc = query.filters.location.toLowerCase();
      filtered = filtered.filter(p =>
        p.location.city.toLowerCase().includes(loc) ||
        p.location.state.toLowerCase().includes(loc) ||
        p.location.country.toLowerCase().includes(loc) ||
        p.title.toLowerCase().includes(loc)
      );
    }

    if (query.filters.priceMin !== undefined) {
      filtered = filtered.filter(p => p.price >= query.filters.priceMin!);
    }

    if (query.filters.priceMax !== undefined) {
      filtered = filtered.filter(p => p.price <= query.filters.priceMax!);
    }

    if (query.filters.propertyTypes && query.filters.propertyTypes.length > 0) {
      filtered = filtered.filter(p => query.filters.propertyTypes!.includes(p.type));
    }

    if (query.filters.guests) {
      filtered = filtered.filter(p => p.capacity.guests >= query.filters.guests!);
    }

    if (query.filters.bedrooms) {
      filtered = filtered.filter(p => p.capacity.bedrooms >= query.filters.bedrooms!);
    }

    if (query.filters.beds) {
      filtered = filtered.filter(p => p.capacity.beds >= query.filters.beds!);
    }

    if (query.filters.bathrooms) {
      filtered = filtered.filter(p => p.capacity.bathrooms >= query.filters.bathrooms!);
    }

    if (query.filters.instantBook) {
      filtered = filtered.filter(p => p.instantBook);
    }

    if (query.filters.rating) {
      filtered = filtered.filter(p => p.rating >= query.filters.rating!);
    }

    // Apply sorting
    switch (query.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / query.pageSize);
    const start = (query.page - 1) * query.pageSize;
    const end = start + query.pageSize;
    const properties = filtered.slice(start, end);

    const response: SearchResponse = {
      properties,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages
    };

    return of(response).pipe(delay(500));
  }

  getPropertyById(id: string): Observable<Property | undefined> {
    const property = this.dummyProperties.find(p => p.id === id);
    return of(property).pipe(delay(300));
  }

  toggleFavorite(propertyId: string): void {
    const favorites = this.favoritesSubject.value;
    if (favorites.has(propertyId)) {
      favorites.delete(propertyId);
    } else {
      favorites.add(propertyId);
    }
    this.favoritesSubject.next(new Set(favorites));
  }

  isFavorite(propertyId: string): boolean {
    return this.favoritesSubject.value.has(propertyId);
  }

  getFavorites(): Observable<Property[]> {
    const favoriteIds = Array.from(this.favoritesSubject.value);
    const favorites = this.dummyProperties.filter(p => favoriteIds.includes(p.id));
    return of(favorites).pipe(delay(300));
  }
}

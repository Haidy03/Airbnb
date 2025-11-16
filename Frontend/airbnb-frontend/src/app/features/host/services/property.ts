import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Property, 
  CreatePropertyDto, 
  UpdatePropertyDto,
  PropertyFilters,
  PropertyStatus 
} from '../models/property.model';
import { MOCK_PROPERTIES, MOCK_HOST_ID } from '../models/mock-data';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  // Using signals for reactive state management
  private propertiesSignal = signal<Property[]>([...MOCK_PROPERTIES]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly properties = this.propertiesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.loadProperties();
  }

  /**
   * Load all properties for the current host
   */
  loadProperties(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Simulate API call delay
    setTimeout(() => {
      this.propertiesSignal.set([...MOCK_PROPERTIES]);
      this.loadingSignal.set(false);
    }, 500);
  }

  /**
   * Get all properties (returns Observable for async pipe)
   */
  getAllProperties(): Observable<Property[]> {
    this.loadingSignal.set(true);
    
    return of([...MOCK_PROPERTIES]).pipe(
      delay(300), // Simulate network delay
      map(properties => {
        this.loadingSignal.set(false);
        return properties;
      })
    );
  }

  /**
   * Get property by ID
   */
  getPropertyById(id: string): Observable<Property | undefined> {
    this.loadingSignal.set(true);
    
    return of(MOCK_PROPERTIES.find(p => p.id === id)).pipe(
      delay(300),
      map(property => {
        this.loadingSignal.set(false);
        if (!property) {
          this.errorSignal.set('Property not found');
        }
        return property;
      })
    );
  }

  /**
   * Get properties with filters
   */
  getFilteredProperties(filters: PropertyFilters): Observable<Property[]> {
    this.loadingSignal.set(true);
    
    let filtered = [...MOCK_PROPERTIES];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === filters.propertyType);
    }
    if (filters.city) {
      filtered = filtered.filter(p => 
        p.location.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters.minPrice) {
      filtered = filtered.filter(p => p.pricing.basePrice >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.pricing.basePrice <= filters.maxPrice!);
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'createdAt':
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          case 'earnings':
            aValue = a.stats.totalEarnings;
            bValue = b.stats.totalEarnings;
            break;
          case 'rating':
            aValue = a.stats.averageRating;
            bValue = b.stats.averageRating;
            break;
          case 'bookings':
            aValue = a.stats.totalBookings;
            bValue = b.stats.totalBookings;
            break;
          default:
            return 0;
        }

        const order = filters.sortOrder === 'desc' ? -1 : 1;
        return (aValue - bValue) * order;
      });
    }

    return of(filtered).pipe(
      delay(300),
      map(properties => {
        this.loadingSignal.set(false);
        return properties;
      })
    );
  }

  /**
   * Create new property
   */
  createProperty(propertyDto: CreatePropertyDto): Observable<Property> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      hostId: MOCK_HOST_ID,
      ...propertyDto,
      images: [],
      coverImage: '',
      availability: {
        minNights: 1,
        maxNights: 30,
        advanceNotice: 1,
        preparationTime: 1,
        availabilityWindow: 12,
        blockedDates: [],
        customPricing: [],
        ...propertyDto.pricing
      },
      status: PropertyStatus.DRAFT,
      isInstantBook: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalBookings: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        responseRate: 0,
        acceptanceRate: 0,
        viewsLastMonth: 0,
        occupancyRate: 0
      }
    };

    return of(newProperty).pipe(
      delay(500),
      map(property => {
        const current = this.propertiesSignal();
        this.propertiesSignal.set([...current, property]);
        this.loadingSignal.set(false);
        return property;
      })
    );
  }

  /**
   * Update existing property
   */
  updateProperty(propertyDto: UpdatePropertyDto): Observable<Property> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const current = this.propertiesSignal();
    const index = current.findIndex(p => p.id === propertyDto.id);

    if (index === -1) {
      this.loadingSignal.set(false);
      return throwError(() => new Error('Property not found'));
    }

    const updatedProperty: Property = {
      ...current[index],
      ...propertyDto,
      updatedAt: new Date()
    };

    return of(updatedProperty).pipe(
      delay(500),
      map(property => {
        const updated = [...current];
        updated[index] = property;
        this.propertiesSignal.set(updated);
        this.loadingSignal.set(false);
        return property;
      })
    );
  }

  /**
   * Delete property
   */
  deleteProperty(id: string): Observable<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return of(true).pipe(
      delay(500),
      map(() => {
        const current = this.propertiesSignal();
        const filtered = current.filter(p => p.id !== id);
        this.propertiesSignal.set(filtered);
        this.loadingSignal.set(false);
        return true;
      })
    );
  }

  /**
   * Update property status
   */
  updatePropertyStatus(id: string, status: PropertyStatus): Observable<Property> {
    const current = this.propertiesSignal();
    const property = current.find(p => p.id === id);

    if (!property) {
      return throwError(() => new Error('Property not found'));
    }

    const updatedProperty: Property = {
      ...property,
      status,
      updatedAt: new Date(),
      publishedAt: status === PropertyStatus.PUBLISHED ? new Date() : property.publishedAt
    };

    return of(updatedProperty).pipe(
      delay(300),
      map(prop => {
        const index = current.findIndex(p => p.id === id);
        const updated = [...current];
        updated[index] = prop;
        this.propertiesSignal.set(updated);
        return prop;
      })
    );
  }

  /**
   * Toggle instant book
   */
  toggleInstantBook(id: string): Observable<Property> {
    const current = this.propertiesSignal();
    const property = current.find(p => p.id === id);

    if (!property) {
      return throwError(() => new Error('Property not found'));
    }

    const updatedProperty: Property = {
      ...property,
      isInstantBook: !property.isInstantBook,
      updatedAt: new Date()
    };

    return of(updatedProperty).pipe(
      delay(300),
      map(prop => {
        const index = current.findIndex(p => p.id === id);
        const updated = [...current];
        updated[index] = prop;
        this.propertiesSignal.set(updated);
        return prop;
      })
    );
  }

  /**
   * Get property statistics summary
   */
  getPropertiesStats(): Observable<{
    total: number;
    published: number;
    draft: number;
    unlisted: number;
    totalEarnings: number;
    averageRating: number;
  }> {
    const properties = this.propertiesSignal();
    
    const stats = {
      total: properties.length,
      published: properties.filter(p => p.status === PropertyStatus.PUBLISHED).length,
      draft: properties.filter(p => p.status === PropertyStatus.DRAFT).length,
      unlisted: properties.filter(p => p.status === PropertyStatus.UNLISTED).length,
      totalEarnings: properties.reduce((sum, p) => sum + p.stats.totalEarnings, 0),
      averageRating: properties.reduce((sum, p) => sum + p.stats.averageRating, 0) / properties.length || 0
    };

    return of(stats).pipe(delay(200));
  }

  /**
   * Search properties by title or location
   */
  searchProperties(query: string): Observable<Property[]> {
    const lowerQuery = query.toLowerCase();
    const filtered = MOCK_PROPERTIES.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) ||
      p.location.city.toLowerCase().includes(lowerQuery) ||
      p.location.state.toLowerCase().includes(lowerQuery) ||
      p.location.country.toLowerCase().includes(lowerQuery)
    );

    return of(filtered).pipe(delay(300));
  }

  /**
   * Duplicate property
   */
  duplicateProperty(id: string): Observable<Property> {
    const property = MOCK_PROPERTIES.find(p => p.id === id);
    
    if (!property) {
      return throwError(() => new Error('Property not found'));
    }

    const duplicated: Property = {
      ...property,
      id: `prop-${Date.now()}`,
      title: `${property.title} (Copy)`,
      status: PropertyStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: undefined,
      stats: {
        totalBookings: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalReviews: 0,
        responseRate: 0,
        acceptanceRate: 0,
        viewsLastMonth: 0,
        occupancyRate: 0
      }
    };

    return of(duplicated).pipe(
      delay(500),
      map(prop => {
        const current = this.propertiesSignal();
        this.propertiesSignal.set([...current, prop]);
        return prop;
      })
    );
  }
}
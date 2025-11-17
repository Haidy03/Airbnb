import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Import your existing Property model
import { 
  Property, 
  CreatePropertyDto, 
  UpdatePropertyDto,
  PropertyFilters,
  PropertyStatus 
} from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = `${environment.apiUrl}/host/property`;
  
  // Using signals for reactive state management
  private propertiesSignal = signal<Property[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly properties = this.propertiesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Store token after login
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Load all properties for the current host
   */
  loadProperties(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.getAllProperties().subscribe({
      next: (properties) => {
        this.propertiesSignal.set(properties);
        this.loadingSignal.set(false);
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.errorSignal.set(error.message);
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Get all properties from API
   */
  getAllProperties(): Observable<Property[]> {
    this.loadingSignal.set(true);
    
    return this.http.get<{ success: boolean; data: any[] }>(
      this.apiUrl, 
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        // Map API response to Property model
        return response.data.map(item => this.mapApiToProperty(item));
      }),
      tap(() => this.loadingSignal.set(false)),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Get property by ID
   */
  getPropertyById(id: string): Observable<Property | undefined> {
    this.loadingSignal.set(true);
    
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return this.mapApiToProperty(response.data);
        }
        return undefined;
      }),
      tap(() => this.loadingSignal.set(false)),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Create new property
   */
  createProperty(propertyDto: CreatePropertyDto): Observable<Property> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<{ success: boolean; data: any }>(
      this.apiUrl,
      propertyDto,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapApiToProperty(response.data)),
      tap(property => {
        const current = this.propertiesSignal();
        this.propertiesSignal.set([...current, property]);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Update existing property
   */
  updateProperty(propertyDto: UpdatePropertyDto): Observable<Property> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/${propertyDto.id}`,
      propertyDto,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapApiToProperty(response.data)),
      tap(property => {
        const current = this.propertiesSignal();
        const index = current.findIndex(p => p.id === propertyDto.id);
        if (index !== -1) {
          const updated = [...current];
          updated[index] = property;
          this.propertiesSignal.set(updated);
        }
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Delete property
   */
  deleteProperty(id: string): Observable<boolean> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.success),
      tap(() => {
        const current = this.propertiesSignal();
        const filtered = current.filter(p => p.id !== id);
        this.propertiesSignal.set(filtered);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Toggle property status (list/unlist)
   */
  togglePropertyStatus(id: string): Observable<Property> {
    return this.http.patch<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}/toggle-status`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => this.mapApiToProperty(response.data)),
      tap(property => {
        const current = this.propertiesSignal();
        const index = current.findIndex(p => p.id === id);
        if (index !== -1) {
          const updated = [...current];
          updated[index] = property;
          this.propertiesSignal.set(updated);
        }
      }),
      catchError(error => {
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  /**
   * Upload property images
   */
  uploadPropertyImages(propertyId: string, files: File[]): Observable<any[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
    });

    // Don't set Content-Type header - browser will set it with boundary
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    });

    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/${propertyId}/images`,
      formData,
      { headers }
    ).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error uploading images:', error);
        throw error;
      })
    );
  }

  /**
   * Map API response to Property model
   */
  private mapApiToProperty(apiData: any): Property {
    return {
      id: apiData.id.toString(),
      hostId: apiData.hostId,
      title: apiData.title,
      description: apiData.description,
      propertyType: apiData.propertyType,
      roomType: ('entire_place' as unknown) as Property['roomType'], // Default - adjust based on your API
      location: {
        address: apiData.address,
        city: apiData.city,
        state: apiData.country, // Adjust if you have separate state field
        country: apiData.country,
        zipCode: apiData.postalCode || '',
        coordinates: {
          lat: apiData.latitude,
          lng: apiData.longitude
        }
      },
      capacity: {
        guests: apiData.maxGuests,
        bedrooms: apiData.numberOfBedrooms,
        beds: apiData.numberOfBedrooms, // Adjust if you track beds separately
        bathrooms: apiData.numberOfBathrooms
      },
      amenities: apiData.amenities?.map((a: any) => a.id) || [],
      images: apiData.images?.map((img: any) => ({
        id: img.id.toString(),
        url: `http://localhost:5202${img.imageUrl}`,
        caption: '',
        order: img.displayOrder,
        isMain: img.isPrimary
      })) || [],
      coverImage: apiData.images?.find((img: any) => img.isPrimary)?.imageUrl 
        ? `http://localhost:5202${apiData.images.find((img: any) => img.isPrimary).imageUrl}`
        : '',
      pricing: {
        basePrice: apiData.pricePerNight,
        currency: 'USD',
        cleaningFee: apiData.cleaningFee || 0
      },
      availability: {
        minNights: apiData.minimumStay,
        maxNights: 30,
        advanceNotice: 1,
        preparationTime: 1,
        availabilityWindow: 12,
        blockedDates: [],
        customPricing: []
      },
      houseRules: {
        checkInTime: apiData.checkInTime || '15:00',
        checkOutTime: apiData.checkOutTime || '11:00',
        smokingAllowed: false,
        petsAllowed: false,
        eventsAllowed: false,
        childrenAllowed: true,
        additionalRules: apiData.houseRules ? [apiData.houseRules] : []
      },
      status: apiData.isActive ? ('published' as PropertyStatus) : ('unlisted' as PropertyStatus),
      isInstantBook: false,
      createdAt: new Date(apiData.createdAt),
      updatedAt: new Date(apiData.updatedAt ?? apiData.createdAt),
      publishedAt: apiData.isActive ? new Date(apiData.createdAt) : undefined,
      stats: {
        totalBookings: apiData.totalBookings || 0,
        totalEarnings: 0,
        averageRating: apiData.averageRating || 0,
        totalReviews: apiData.totalReviews || 0,
        responseRate: 0,
        acceptanceRate: 0,
        viewsLastMonth: 0,
        occupancyRate: 0
      }
    };
  }

  /**
   * Search properties by title or location
   */
  searchProperties(query: string): Observable<Property[]> {
    return this.getAllProperties().pipe(
      map(properties => {
        const lowerQuery = query.toLowerCase();
        return properties.filter(p => 
          p.title.toLowerCase().includes(lowerQuery) ||
          p.location.city.toLowerCase().includes(lowerQuery) ||
          p.location.country.toLowerCase().includes(lowerQuery)
        );
      })
    );
  }
}
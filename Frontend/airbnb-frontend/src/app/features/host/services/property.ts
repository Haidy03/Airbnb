import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders ,HttpEventType } from '@angular/common/http';
import { Observable, catchError, filter, map, tap ,of,forkJoin} from 'rxjs';
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
getPropertyById(id: string): Observable<Property | null> { // ✅ Changed to Property | null
  this.loadingSignal.set(true);
  
  return this.http.get<{ success: boolean; data: any }>(
    `${this.apiUrl}/${id}`,
    { headers: this.getHeaders() }
  ).pipe(
    map(response => {
      if (response.success && response.data) {
        return this.mapApiToProperty(response.data);
      }
      return null; // ✅ Return null instead of undefined
    }),
    tap(() => this.loadingSignal.set(false)),
    catchError(error => {
      this.loadingSignal.set(false);
      this.errorSignal.set(error.message);
      return of(null); // ✅ Return null on error
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

  // Add these methods to your existing PropertyService in property.ts

/**
 * Delete property image
 */
deletePropertyImage(imageId: number): Observable<boolean> {
  return this.http.delete<{ success: boolean }>(
    `${this.apiUrl}/images/${imageId}`,
    { headers: this.getHeaders() }
  ).pipe(
    map(response => response.success),
    catchError(error => {
      this.errorSignal.set(error.message);
      throw error;
    })
  );
}

/**
 * Set primary image for property
 */
setPrimaryImage(imageId: number): Observable<boolean> {
  return this.http.patch<{ success: boolean }>(
    `${this.apiUrl}/images/${imageId}/set-primary`,
    {},
    { headers: this.getHeaders() }
  ).pipe(
    map(response => response.success),
    catchError(error => {
      this.errorSignal.set(error.message);
      throw error;
    })
  );
}

/**
 * Reorder property images
 */
reorderImages(propertyId: string, imageIds: number[]): Observable<boolean> {
  return this.http.patch<{ success: boolean }>(
    `${this.apiUrl}/${propertyId}/images/reorder`,
    { imageIds },
    { headers: this.getHeaders() }
  ).pipe(
    map(response => response.success),
    catchError(error => {
      this.errorSignal.set(error.message);
      throw error;
    })
  );
}
/**
 * Upload property images - FIXED VERSION
 */
uploadPropertyImages(propertyId: string, files: File[]): Observable<any[]> {
  console.log('📤 Uploading images for property:', propertyId);
  console.log('📤 Number of files:', files.length);

  // ✅ Create an array of observables for each file upload
  const uploadObservables = files.map(file => this.uploadSingleImage(propertyId, file));

  // ✅ Use forkJoin to upload all images in parallel
  return forkJoin(uploadObservables).pipe(
    tap(results => {
      console.log('✅ All images uploaded successfully:', results);
    }),
    catchError(error => {
      console.error('❌ Error uploading images:', error);
      this.errorSignal.set(error.message || 'Failed to upload images');
      throw error;
    })
  );
}
/**
 * Upload a single image - NEW METHOD
 */
private uploadSingleImage(propertyId: string, file: File): Observable<any> {
  console.log('📤 Uploading single image:', file.name);

  // ✅ Create FormData with correct field name
  const formData = new FormData();
  formData.append('file', file, file.name); // Backend expects 'file'

  // ✅ Get token for authorization
  const token = localStorage.getItem('token');
  
  // ✅ Create headers - DON'T set Content-Type, browser will set it with boundary
  const headers = new HttpHeaders({
    'Authorization': token ? `Bearer ${token}` : ''
  });

  // ✅ Make the upload request
  return this.http.post<{ success: boolean; data: any; message?: string }>(
    `${this.apiUrl}/${propertyId}/images`,
    formData,
    { 
      headers,
      reportProgress: true, // Enable progress tracking
      observe: 'events' as any // Get progress events
    }
  ).pipe(
    // ✅ Filter for the final response
    filter((event: any) => event.type === HttpEventType.Response),
    map((event: any) => {
      const response = event.body;
      console.log('✅ Upload response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }
      
      return response.data;
    }),
    catchError(error => {
      console.error('❌ Upload error for file:', file.name, error);
      
      // Handle specific error cases
      if (error.status === 400) {
        throw new Error('Invalid file. Please check file size and type.');
      } else if (error.status === 401) {
        throw new Error('Authentication required. Please login again.');
      } else if (error.status === 413) {
        throw new Error('File too large. Maximum size is 5MB.');
      }
      
      throw new Error(error.message || 'Failed to upload image');
    })
  );
}
/**
 * Upload property images with progress tracking - ALTERNATIVE METHOD
 */
uploadPropertyImagesWithProgress(
  propertyId: string, 
  files: File[],
  onProgress?: (progress: number) => void
): Observable<any[]> {
  console.log('📤 Uploading images with progress tracking');

  const uploadObservables = files.map((file, index) => {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.post(
      `${this.apiUrl}/${propertyId}/images`,
      formData,
      {
        headers,
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
      tap((event: any) => {
        if (event.type === HttpEventType.UploadProgress && onProgress) {
          const progress = Math.round((100 * event.loaded) / event.total);
          onProgress((progress / files.length) + (index * (100 / files.length)));
        }
      }),
      filter((event: any) => event.type === HttpEventType.Response),
      map((event: any) => event.body.data)
    );
  });

  return forkJoin(uploadObservables);
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
      url: `${environment.imageBaseUrl}${img.imageUrl}`, // ✅ Use environment
      caption: '',
      order: img.displayOrder,
      isMain: img.isPrimary
    })) || [],
    
    coverImage: apiData.images?.find((img: any) => img.isPrimary)?.imageUrl 
      ? `${environment.imageBaseUrl}${apiData.images.find((img: any) => img.isPrimary).imageUrl}` // ✅ Use environment
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

  // Add these methods to PropertyService (Frontend - property.ts)

/**
 * Publish a property listing
 */
publishProperty(propertyId: string): Observable<Property> {
  this.loadingSignal.set(true);
  this.errorSignal.set(null);

  return this.http.post<{ success: boolean; data: any; message?: string; errors?: string[] }>(
    `${this.apiUrl}/${propertyId}/publish`,
    {},
    { headers: this.getHeaders() }
  ).pipe(
    map(response => {
      if (!response.success) {
        throw new Error(response.message || 'Failed to publish property');
      }
      const property = this.mapApiToProperty(response.data);
      
      // Update local state
      const current = this.propertiesSignal();
      const index = current.findIndex(p => p.id === propertyId);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = property;
        this.propertiesSignal.set(updated);
      }
      
      this.loadingSignal.set(false);
      return property;
    }),
    catchError(error => {
      this.loadingSignal.set(false);
      
      // Handle validation errors
      if (error.error?.errors) {
        const errorMsg = 'Property is not ready to publish:\n' + error.error.errors.join('\n');
        this.errorSignal.set(errorMsg);
        throw new Error(errorMsg);
      }
      
      this.errorSignal.set(error.message);
      throw error;
    })
  );
}

/**
 * Unpublish a property listing
 */
unpublishProperty(propertyId: string): Observable<Property> {
  this.loadingSignal.set(true);
  this.errorSignal.set(null);

  return this.http.post<{ success: boolean; data: any }>(
    `${this.apiUrl}/${propertyId}/unpublish`,
    {},
    { headers: this.getHeaders() }
  ).pipe(
    map(response => {
      const property = this.mapApiToProperty(response.data);
      
      // Update local state
      const current = this.propertiesSignal();
      const index = current.findIndex(p => p.id === propertyId);
      if (index !== -1) {
        const updated = [...current];
        updated[index] = property;
        this.propertiesSignal.set(updated);
      }
      
      this.loadingSignal.set(false);
      return property;
    }),
    catchError(error => {
      this.loadingSignal.set(false);
      this.errorSignal.set(error.message);
      throw error;
    })
  );
}

/**
 * Check if property is ready to publish
 */
validatePropertyForPublishing(property: Property): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!property.title || property.title.length < 10) {
    errors.push('Title must be at least 10 characters');
  }

  if (!property.description || property.description.length < 50) {
    errors.push('Description must be at least 50 characters');
  }

  if (!property.images || property.images.length === 0) {
    errors.push('At least one photo is required');
  }

  if (property.pricing.basePrice <= 0) {
    errors.push('Valid price per night is required');
  }

  if (property.capacity.guests <= 0) {
    errors.push('Maximum guests must be specified');
  }

  if (property.capacity.bedrooms <= 0) {
    errors.push('Number of bedrooms must be specified');
  }

  if (property.capacity.bathrooms <= 0) {
    errors.push('Number of bathrooms must be specified');
  }

  if (!property.location.address) {
    errors.push('Property address is required');
  }

  if (!property.location.city) {
    errors.push('City is required');
  }

  if (!property.location.country) {
    errors.push('Country is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a draft property
 */
createDraftProperty(): Observable<Property> {
  this.loadingSignal.set(true);
  this.errorSignal.set(null);

  // Minimal property data for draft
  const draftProperty = {
    title: 'Untitled Property',
    description: 'Property listing in progress',
    propertyType: 'HOUSE',
    address: 'Not specified',
    city: 'Not specified',
    country: 'Not specified',
    postalCode: null,
    latitude: 0,
    longitude: 0,
    numberOfBedrooms: 1,
    numberOfBathrooms: 1,
    maxGuests: 1,
    pricePerNight: 0,
    cleaningFee: null,
    houseRules: null,
    checkInTime: null,
    checkOutTime: null,
    minimumStay: 1,
    amenityIds: []
  };

  return this.http.post<{ success: boolean; data: any }>(
    this.apiUrl,
    draftProperty,
    { headers: this.getHeaders() }
  ).pipe(
    map(response => {
      const property = this.mapApiToProperty(response.data);
      
      // Store draft ID in localStorage
      localStorage.setItem('property_draft_id', property.id);
      
      // Add to local state
      const current = this.propertiesSignal();
      this.propertiesSignal.set([...current, property]);
      
      this.loadingSignal.set(false);
      return property;
    }),
    catchError(error => {
      this.loadingSignal.set(false);
      this.errorSignal.set(error.message);
      throw error;
    })
  );
}

/**
 * Get draft property
 */
getDraftProperty(): Observable<Property | null> {
  const draftId = localStorage.getItem('property_draft_id');
  
  if (!draftId) {
    return of(null);
  }

  return this.getPropertyById(draftId);
}

/**
 * Clear draft
 */
clearDraft(): void {
  localStorage.removeItem('property_draft_id');
}

/**
 * Check if property is a draft (incomplete)
 */
isDraft(property: Property): boolean {
  return (
    property.title === 'Untitled Property' ||
    property.status === PropertyStatus.DRAFT ||
    !property.images || 
    property.images.length === 0 ||
    property.pricing.basePrice === 0
  );
}

/**
 * Update draft property (partial update)
 */
updateDraftProperty(draftId: string, updates: Partial<UpdatePropertyDto>): Observable<Property> {
  return this.updateProperty({
    id: draftId,
    ...updates
  });
}

}
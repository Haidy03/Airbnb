import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, catchError, filter, map, tap, of, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Import your existing Property model
import { 
  Property, 
  PropertyStatus 
} from '../models/property.model';

export interface PropertyDraft {
  id?: string;
  title: string;
  description: string;
  propertyTypeId?: number;
  roomType?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  cleaningFee?: number;
  checkInTime?: string;
  checkOutTime?: string;
  minimumStay: number;
  houseRules?: string;
  amenityIds: number[];
  images?: any[];
  createdAt?: Date;
  updatedAt?: Date;
  currentStep?: string;
  isActive?: boolean;
  status?: PropertyStatus;
  bookingMode?: 'instant' | 'approval'; // Default: 'approval'
  safetyDetails?: {
    exteriorCamera: boolean;
    noiseMonitor: boolean;
    weapons: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = `${environment.apiUrl}/host/property`;
  
  // Using signals for reactive state management
  private propertiesSignal = signal<Property[]>([]);
  private draftsSignal = signal<PropertyDraft[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly properties = this.propertiesSignal.asReadonly();
  readonly drafts = this.draftsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ============================================
  // DRAFT MANAGEMENT
  // ============================================

  /**
   * ✅ FIXED: Create a new property draft
   * Calls the specific 'draft' endpoint on the backend
   */
  createPropertyDraft(): Observable<PropertyDraft> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // We send an empty object {} because the Backend now handles 
    // setting the defaults (Title="Untitled", defaults, etc.)
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/draft`, // <--- UPDATED URL
      {}, // <--- Empty Body
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const draft = this.mapApiToDraft(response.data);
        this.loadingSignal.set(false);
        console.log('✅ Draft created:', draft.id);
        return draft;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message || 'Failed to create draft');
        console.error('Error creating draft:', error);
        throw error;
      })
    );
  }

  /**
   * Get draft by ID
   */
  getDraftById(draftId: string): Observable<PropertyDraft> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/${draftId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const draft = this.mapApiToDraft(response.data);
        this.loadingSignal.set(false);
        console.log('✅ Draft loaded:', draft.id);
        return draft;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message || 'Failed to load draft');
        console.error('Error loading draft:', error);
        throw error;
      })
    );
  }

  /**
   * Get all drafts/properties for current host
   */
  getAllDrafts(): Observable<PropertyDraft[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.get<{ success: boolean; data: any[] }>(
      this.apiUrl,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const drafts = response.data.map(item => this.mapApiToDraft(item));
        this.draftsSignal.set(drafts);
        this.loadingSignal.set(false);
        console.log('✅ Drafts loaded:', drafts.length);
        return drafts;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message || 'Failed to load drafts');
        console.error('Error loading drafts:', error);
        return of([]);
      })
    );
  }

  /**
   * Update draft at specific step
   */
  updateDraftAtStep(
    draftId: string,
    stepData: Partial<PropertyDraft>,
    stepName: string
  ): Observable<PropertyDraft> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    const updateData = {
      ...stepData,
      currentStep: stepName
    };
    console.log('📝 Updating draft at step:', stepName, updateData);

    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/${draftId}`,
      updateData,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const draft = this.mapApiToDraft(response.data);
        this.loadingSignal.set(false);
        console.log(`✅ Draft saved at step: ${stepName}`,draft);
        return draft;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message || 'Failed to save draft');
        console.error('Error saving draft:', error);
        throw error;
      })
    );
  }

  /**
   * Delete draft
   */
  deleteDraft(draftId: string): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/${draftId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          const updated = this.draftsSignal().filter(d => d.id !== draftId);
          this.draftsSignal.set(updated);
          console.log('✅ Draft deleted');
        }
        return response.success;
      }),
      catchError(error => {
        console.error('Error deleting draft:', error);
        return of(false);
      })
    );
  }

  // ============================================
  // IMAGE UPLOAD
  // ============================================

  /**
   * Upload property images - FIXED VERSION
   */
  uploadPropertyImages(propertyId: string, files: File[]): Observable<any[]> {
    console.log('📤 Uploading images for property:', propertyId);
    console.log('📤 Number of files:', files.length);

    const uploadObservables = files.map(file => 
      this.uploadSingleImage(propertyId, file)
    );

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
   * Upload a single image
   */
  private uploadSingleImage(propertyId: string, file: File): Observable<any> {
    console.log('📤 Uploading single image:', file.name);

    const formData = new FormData();
    formData.append('file', file, file.name);

    const token = localStorage.getItem('authToken');
    
    // Create headers WITHOUT Content-Type - let browser set it
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.post<{ success: boolean; data: any; message?: string }>(
      `${this.apiUrl}/${propertyId}/images`,
      formData,
      { 
        headers,
        reportProgress: true,
        observe: 'events'
      }
    ).pipe(
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
   * Upload property images with progress tracking
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

      const token = localStorage.getItem('authToken');
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
          if (event.type === HttpEventType.UploadProgress && event.total && onProgress) {
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
   * Delete property image
   */
  deletePropertyImage(imageId: number | string): Observable<boolean> {
  console.log('🗑️ Deleting image:', imageId);

  return this.http.delete<{ success: boolean; message?: string }>(
    `${this.apiUrl}/images/${imageId}`,
    { headers: this.getHeaders() }
  ).pipe(
    map(response => {
      if (response.success) {
        console.log('✅ Image deleted successfully');
        return true;
      }
      throw new Error(response.message || 'Failed to delete image');
    }),
    catchError(error => {
      console.error('❌ Error deleting image:', error);
      this.errorSignal.set(error.error?.message || error.message || 'Failed to delete image');
      throw error;
    })
  );
}

  /**
   * Set primary image for property
   */
  setPrimaryImage(imageId: number | string): Observable<boolean> {
  console.log('🔧 API Call - Setting primary image:', { imageId });

  return this.http.patch<{ success: boolean; data?: any; message?: string }>(
    `${this.apiUrl}/images/${imageId}/set-primary`,
    {},
    { headers: this.getHeaders() }
  ).pipe(
    tap(response => {
      console.log('✅ API Response:', response);
    }),
    map(response => {
      if (response.success) {
        console.log('✅ Primary image set successfully');
        return true;
      }
      throw new Error(response.message || 'Failed to set primary image');
    }),
    catchError(error => {
      console.error('❌ Error setting primary image:', error);
      
      // Log more details for debugging
      if (error.error?.message) {
        console.error('Server message:', error.error.message);
      }
      if (error.statusText) {
        console.error('Status:', error.statusText);
      }
      
      this.errorSignal.set(error.error?.message || error.message || 'Failed to set primary image');
      throw error;
    })
  );
}

  /**
   * Reorder property images
   */
  reorderImages(propertyId: string, imageIds: (number | string)[]): Observable<boolean> {
  console.log('🔄 Reordering images:', { propertyId, imageIds });

  return this.http.patch<{ success: boolean; message?: string }>(
    `${this.apiUrl}/${propertyId}/images/reorder`,
    { imageIds },
    { headers: this.getHeaders() }
  ).pipe(
    map(response => {
      if (response.success) {
        console.log('✅ Images reordered successfully');
        return true;
      }
      throw new Error(response.message || 'Failed to reorder images');
    }),
    catchError(error => {
      console.error('❌ Error reordering images:', error);
      this.errorSignal.set(error.error?.message || error.message || 'Failed to reorder images');
      throw error;
    })
  );
}

  // ============================================
  // PUBLISH/UNPUBLISH
  // ============================================

  /**
   * Publish a property listing
   */
  publishProperty(propertyId: string): Observable<PropertyDraft> {
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
        const draft = this.mapApiToDraft(response.data);
        this.loadingSignal.set(false);
        console.log('✅ Property published');
        return draft;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        
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
  unpublishProperty(propertyId: string): Observable<PropertyDraft> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/${propertyId}/unpublish`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const draft = this.mapApiToDraft(response.data);
        this.loadingSignal.set(false);
        console.log('✅ Property unpublished');
        return draft;
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        this.errorSignal.set(error.message);
        throw error;
      })
    );
  }

  // ============================================
  // MAPPING
  // ============================================

  /**
   * Map API response to draft model
   */
  private mapApiToDraft(apiData: any): PropertyDraft {
    return {
      id: apiData.id?.toString() || apiData.id,
      title: apiData.title || 'Untitled Property',
      description: apiData.description || '',
      propertyTypeId: apiData.propertyTypeId,
      roomType: apiData.roomType || '',
      address: apiData.address || '',
      city: apiData.city || '',
      state: apiData.state || '',
      country: apiData.country || '',
      postalCode: apiData.postalCode,
      latitude: apiData.latitude || 0,
      longitude: apiData.longitude || 0,
      numberOfBedrooms: apiData.numberOfBedrooms || 1,
      numberOfBathrooms: apiData.numberOfBathrooms || 1,
      maxGuests: apiData.maxGuests || 1,
      pricePerNight: apiData.pricePerNight || 0,
      cleaningFee: apiData.cleaningFee,
      checkInTime: apiData.checkInTime,
      checkOutTime: apiData.checkOutTime,
      minimumStay: apiData.minimumStay || 1,
      houseRules: apiData.houseRules,
      amenityIds: apiData.amenities?.map((a: any) => a.id) || [],
      images: apiData.images || [],
      createdAt: new Date(apiData.createdAt),
      updatedAt: new Date(apiData.updatedAt),
      currentStep: apiData.currentStep || 'intro',
      isActive: apiData.isActive || false,
      status: apiData.status || PropertyStatus.DRAFT ,// ✅ Map status
      safetyDetails: {
      exteriorCamera: apiData.hasExteriorCamera || false,
      noiseMonitor: apiData.hasNoiseMonitor || false,
      weapons: apiData.hasWeapons || false
    }
    };
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
      propertyType: apiData.propertyType || 'HOUSE',
      propertyTypeId: apiData.propertyTypeId,
      roomType: ('entire_place' as unknown) as Property['roomType'],
      location: {
        address: apiData.address,
        city: apiData.city,
        state: apiData.country,
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
        beds: apiData.numberOfBedrooms,
        bathrooms: apiData.numberOfBathrooms
      },
      amenities: apiData.amenities?.map((a: any) => a.id) || [],
      images: apiData.images?.map((img: any) => ({
        id: img.id.toString(),
        url: `${environment.imageBaseUrl}${img.imageUrl}`,
        caption: '',
        order: img.displayOrder,
        isMain: img.isPrimary
      })) || [],
      coverImage: apiData.images?.find((img: any) => img.isPrimary)?.imageUrl 
        ? `${environment.imageBaseUrl}${apiData.images.find((img: any) => img.isPrimary).imageUrl}`
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
    return this.getAllDrafts().pipe(
      map(properties => {
        const lowerQuery = query.toLowerCase();
        return properties.filter(p => 
          p.title.toLowerCase().includes(lowerQuery) ||
          p.city.toLowerCase().includes(lowerQuery) ||
          p.country.toLowerCase().includes(lowerQuery)
        ) as any;
      })
    );
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(step: string): number {
    const steps = ['intro', 'property-type', 'room-type', 'location', 'amenities', 'photos', 'pricing', 'review'];
    const currentIndex = steps.indexOf(step);
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  }
}
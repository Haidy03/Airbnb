import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, catchError, filter, map, tap, of, forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';

import { 
  Property, 
  PropertyStatus 
} from '../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = `${environment.apiUrl}/host/property`;
  
  private loadingSignal = signal<boolean>(false);
  readonly loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ==========================================
  // GET REQUESTS
  // ==========================================
  getAllDrafts(): Observable<Property[]> { 
    this.loadingSignal.set(true);
    return this.http.get<{ success: boolean; data: any[] }>(
      this.apiUrl, { headers: this.getHeaders() }
    ).pipe(
      map(res => res.data.map(item => this.mapApiToProperty(item))),
      tap(() => this.loadingSignal.set(false)),
      catchError(() => { this.loadingSignal.set(false); return of([]); })
    );
  }

  getAllProperties(): Observable<Property[]> {
    return this.getAllDrafts(); // Same logic basically
  }

  getDraftById(id: string): Observable<Property> {
    this.loadingSignal.set(true);
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}`, { headers: this.getHeaders() }
    ).pipe(
      map(res => this.mapApiToProperty(res.data)),
      tap(() => this.loadingSignal.set(false))
    );
  }

  getAmenities(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${this.apiUrl}/amenities`, 
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.data)
    );
  }
  
  getPropertyById(id: string): Observable<Property> {
    return this.getDraftById(id);
  }

  // ==========================================
  // ACTIONS
  // ==========================================
  createPropertyDraft(): Observable<Property> {
    this.loadingSignal.set(true);
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/draft`, {}, { headers: this.getHeaders() }
    ).pipe(
      map(res => this.mapApiToProperty(res.data)),
      tap(() => this.loadingSignal.set(false))
    );
  }

  updateDraftAtStep(id: string, data: any, step: string): Observable<Property> {
    const payload = { ...data, currentStep: step };
    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() }
    ).pipe(map(res => this.mapApiToProperty(res.data)));
  }

  updateProperty(id: string, data: any): Observable<Property> {
    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}`, data, { headers: this.getHeaders() }
    ).pipe(map(res => this.mapApiToProperty(res.data)));
  }

  activateProperty(id: string): Observable<Property> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}/activate`, {}, { headers: this.getHeaders() }
    ).pipe(map(r => this.mapApiToProperty(r.data)));
  }

  deactivateProperty(id: string): Observable<Property> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}/deactivate`, {}, { headers: this.getHeaders() }
    ).pipe(map(r => this.mapApiToProperty(r.data)));
  }

  submitForApproval(id: string): Observable<Property> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}/submit-for-approval`, {}, { headers: this.getHeaders() }
    ).pipe(map(r => this.mapApiToProperty(r.data)));
  }

  publishProperty(id: string): Observable<Property> {
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/${id}/publish`, {}, { headers: this.getHeaders() }
    ).pipe(map(r => this.mapApiToProperty(r.data)));
  }

  deleteDraft(draftId: string): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/${draftId}`, { headers: this.getHeaders() }
    ).pipe(map(r => r.success));
  }

  // ==========================================
  // IMAGE HANDLING
  // ==========================================
  uploadPropertyImages(propertyId: string, files: File[]): Observable<any[]> {
    const uploadObservables = files.map(file => this.uploadSingleImage(propertyId, file));
    return forkJoin(uploadObservables);
  }

  private uploadSingleImage(propertyId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    // No Content-Type header for FormData
    const headers = new HttpHeaders({
      'Authorization': localStorage.getItem('authToken') ? `Bearer ${localStorage.getItem('authToken')}` : ''
    });
    return this.http.post<{ success: boolean; data: any }>(
      `${this.apiUrl}/${propertyId}/images`, formData, 
      { headers, reportProgress: true, observe: 'events' }
    ).pipe(
      filter((event: any) => event.type === HttpEventType.Response),
      map((event: any) => event.body.data)
    );
  }

  deletePropertyImage(imageId: string | number): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/images/${imageId}`, { headers: this.getHeaders() }
    ).pipe(map(r => r.success));
  }

  setPrimaryImage(imageId: string | number): Observable<boolean> {
    return this.http.patch<{ success: boolean }>(
      `${this.apiUrl}/images/${imageId}/set-primary`, {}, { headers: this.getHeaders() }
    ).pipe(map(r => r.success));
  }

  // ==========================================
  // 🔄 THE MAPPER (FIXED)
  // ==========================================
  private mapApiToProperty(apiData: any): Property {
    // console.log('Raw API Data:', apiData); 
    
    // 1. Handle Status
    let computedStatus = apiData.status;
    const hasCurrentStep = !!apiData.currentStep;
    const isActive = apiData.isActive === true;
    // const isApproved = apiData.isApproved === true;

    if (typeof computedStatus === 'string') {
        const lower = computedStatus.toLowerCase();
        if (lower === 'draft') computedStatus = PropertyStatus.DRAFT;
        else if (lower === 'active') computedStatus = PropertyStatus.ACTIVE;
        else if (lower === 'approved') computedStatus = PropertyStatus.APPROVED;
        else if (lower === 'rejected') computedStatus = PropertyStatus.REJECTED;
        else computedStatus = PropertyStatus.PENDING_APPROVAL;
    } else if (typeof computedStatus === 'undefined') {
       if (hasCurrentStep) computedStatus = PropertyStatus.DRAFT;
       else if (isActive) computedStatus = PropertyStatus.ACTIVE;
       else computedStatus = PropertyStatus.PENDING_APPROVAL;
    }

    const rawImages = apiData.images || [];
    

    let primaryIndex = rawImages.findIndex((img: any) => img.isPrimary);
    

    if (primaryIndex === -1 && rawImages.length > 0) {
        primaryIndex = 0;
    }

    const mappedImages = rawImages.map((img: any, index: number) => ({
        id: img.id.toString(),
        url: img.imageUrl?.startsWith('http') ? img.imageUrl : `${environment.apiUrl.replace('/api', '')}${img.imageUrl}`,
        imageUrl: img.imageUrl,
        
  
        isPrimary: index === primaryIndex, 
        isMain: index === primaryIndex,
        
        order: img.displayOrder,
        displayOrder: img.displayOrder
    }));

    const cover = mappedImages.find((i: any) => i.isPrimary)?.url || '/assets/images/placeholder-property.jpg';


    const amenityIds = Array.isArray(apiData.amenityIds) 
        ? apiData.amenityIds 
        : (apiData.amenities?.map((a: any) => typeof a === 'object' ? a.id : a) || []);

    return {
      id: apiData.id?.toString(),
      hostId: apiData.hostId,
      title: apiData.title || 'Untitled Property',
      description: apiData.description,
      propertyType: apiData.propertyType || 'House',
      propertyTypeId: apiData.propertyTypeId,
      roomType: apiData.roomType,
      
      // Flat Fields
      address: apiData.address,
      city: apiData.city,
      state: apiData.state,
      country: apiData.country,
      postalCode: apiData.postalCode,
      latitude: apiData.latitude,
      longitude: apiData.longitude,
      currentStep: apiData.currentStep,
      pricePerNight: apiData.pricePerNight,
      
      // Nested Objects
      location: {
         address: apiData.address || '',
         city: apiData.city || '',
         state: apiData.state || '',
         country: apiData.country || '',
         zipCode: apiData.postalCode || '',
         coordinates: { lat: apiData.latitude || 0, lng: apiData.longitude || 0 }
      },
      
      capacity: {
         guests: apiData.maxGuests || 1,
         bedrooms: apiData.numberOfBedrooms || 1,
         beds: apiData.numberOfBedrooms || 1,
         bathrooms: apiData.numberOfBathrooms || 1
      },
      
      pricing: {
         basePrice: apiData.pricePerNight || 0,
         currency: 'USD',
         cleaningFee: apiData.cleaningFee
      },
      
      availability: {
          minNights: apiData.minimumStay || 1,
          maxNights: 365,
          advanceNotice: 0,
          preparationTime: 0,
          availabilityWindow: 12,
          blockedDates: [],
          customPricing: []
      },
      
      houseRules: {
            checkInTime: apiData.checkInTime,
            checkOutTime: apiData.checkOutTime,
            smokingAllowed: false,
            petsAllowed: false,
            eventsAllowed: false,
            childrenAllowed: true
      },
      
      safetyDetails: {
        exteriorCamera: apiData.hasExteriorCamera || false,
        noiseMonitor: apiData.hasNoiseMonitor || false,
        weapons: apiData.hasWeapons || false
      },

      status: computedStatus,
      isInstantBook: apiData.isInstantBook ?? apiData.IsInstantBook ?? false,
      isActive: apiData.isActive === true,
      isApproved: apiData.isApproved === true,
      
      amenities: amenityIds,
      amenityIds: amenityIds,
      
      images: mappedImages,
      coverImage: cover,
      
      createdAt: new Date(apiData.createdAt || Date.now()),
      updatedAt: new Date(apiData.updatedAt || Date.now()),
      rejectionReason : apiData.rejectionReason,
      
      stats: {
         totalBookings: 0,
         totalEarnings: 0,
         averageRating: 0,
         totalReviews: 0,
         responseRate: 100
      }
    };
  }
}
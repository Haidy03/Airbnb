import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

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
  currentStep?: 'intro' | 'property-type' | 'room-type' | 'location' | 'amenities' | 'photos' | 'pricing' | 'review';
  isPublished?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyDraftService {
  private apiUrl = `${environment.apiUrl}/host/property`;
  private currentDraft = signal<PropertyDraft | null>(null);
  private draftList = signal<PropertyDraft[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);

  readonly draft = this.currentDraft.asReadonly();
  readonly draftsList = this.draftList.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorSignal = this.error.asReadonly();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Create a new draft property
   */
  createDraft(): Observable<PropertyDraft> {
    this.loading.set(true);
    this.error.set(null);

    const draftProperty: PropertyDraft = {
      title: 'Untitled Property',
      description: '',
      propertyTypeId: undefined,
      roomType: '',
      address: '',
      city: '',
      country: '',
      latitude: 0,
      longitude: 0,
      numberOfBedrooms: 1,
      numberOfBathrooms: 1,
      maxGuests: 1,
      pricePerNight: 0,
      minimumStay: 1,
      amenityIds: [],
      currentStep: 'intro',
      isPublished: false
    };

    return this.http.post<{ success: boolean; data: any }>(
      this.apiUrl,
      draftProperty,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const draft = this.mapApiToDraft(response.data);
        this.currentDraft.set(draft);
        this.loading.set(false);
        
        // Store draft ID locally
        if (draft.id) {
          localStorage.setItem('currentDraftId', draft.id);
        }
        
        return draft;
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to create draft');
        console.error('Error creating draft:', error);
        throw error;
      })
    );
  }

  /**
   * Get or load existing draft
   */
  loadDraft(draftId: string): Observable<PropertyDraft> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/${draftId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const draft = this.mapApiToDraft(response.data);
        this.currentDraft.set(draft);
        this.loading.set(false);
        
        if (draft.id) {
          localStorage.setItem('currentDraftId', draft.id);
        }
        
        return draft;
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to load draft');
        console.error('Error loading draft:', error);
        throw error;
      })
    );
  }

  /**
   * Save draft progress to a specific step
   */
  saveDraftAtStep(draftId: string, stepData: Partial<PropertyDraft>, stepName: string): Observable<PropertyDraft> {
    this.loading.set(true);
    this.error.set(null);

    const updateData = {
      ...stepData,
      currentStep: stepName
    };

    return this.http.put<{ success: boolean; data: any }>(
      `${this.apiUrl}/${draftId}`,
      updateData,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const draft = this.mapApiToDraft(response.data);
        this.currentDraft.set(draft);
        this.loading.set(false);
        
        console.log(`✅ Draft saved at step: ${stepName}`);
        return draft;
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to save draft');
        console.error('Error saving draft:', error);
        throw error;
      })
    );
  }

  /**
   * Get all drafts for current host
   */
  getAllDrafts(): Observable<PropertyDraft[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<{ success: boolean; data: any[] }>(
      this.apiUrl,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => {
        const drafts = response.data.map(item => this.mapApiToDraft(item));
        this.draftList.set(drafts);
        this.loading.set(false);
        return drafts;
      }),
      catchError(error => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to load drafts');
        console.error('Error loading drafts:', error);
        return of([]);
      })
    );
  }

  /**
   * Get current draft from localStorage or signal
   */
  getCurrentDraft(): PropertyDraft | null {
    return this.currentDraft();
  }

  /**
   * Get draft ID from localStorage
   */
  getDraftIdFromStorage(): string | null {
    return localStorage.getItem('currentDraftId');
  }

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
      isPublished: apiData.isActive || false
    };
  }

  /**
   * Clear current draft from storage
   */
  clearDraft(): void {
    localStorage.removeItem('currentDraftId');
    this.currentDraft.set(null);
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
          const updated = this.draftList().filter(d => d.id !== draftId);
          this.draftList.set(updated);
          
          if (this.currentDraft()?.id === draftId) {
            this.clearDraft();
          }
        }
        return response.success;
      }),
      catchError(error => {
        console.error('Error deleting draft:', error);
        return of(false);
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
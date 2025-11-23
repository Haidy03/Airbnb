import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property';
import { Property, PropertyStatus, RoomType } from '../../models/property.model';
import { PropertyDraft } from '../../services/property';
import { environment } from '../../../../../environments/environment'; // ✅ Import environment

@Component({
  selector: 'app-my-properties',
  imports: [CommonModule, RouterLink],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.css',
})
export class MyProperties implements OnInit {
  properties = signal<(Property | PropertyDraft)[]>([]);
  isLoading = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllDrafts();
  }

  /**
   * ✅ Load all drafts and properties
   */
  loadAllDrafts(): void {
    this.isLoading.set(true);
    
    this.propertyService.getAllDrafts().subscribe({
      next: (drafts) => {
        this.properties.set(drafts);
        this.isLoading.set(false);
        console.log('✅ Drafts and properties loaded:', drafts.length);
      },
      error: (error) => {
        console.error('Error loading drafts:', error);
        this.isLoading.set(false);
      }
    });
  }

  toggleViewMode(): void {
    const current = this.viewMode();
    this.viewMode.set(current === 'grid' ? 'list' : 'grid');
  }

  /**
   * ✅ Check for incomplete drafts before creating new one
   */
  addNewProperty(): void {
    this.isLoading.set(true);

    const incompleteDraft = this.properties().find(p => {
      if ('currentStep' in p && p.currentStep) {
        const progress = this.getProgressPercentage(p);
        return progress < 100;
      }
      return false;
    });

    if (incompleteDraft) {
      const continueExisting = confirm(
        'You have an incomplete listing in progress. Do you want to continue it?\n\n' +
        'Click OK to continue, or Cancel to start a new listing.'
      );

      this.isLoading.set(false);

      if (continueExisting) {
        this.editProperty(incompleteDraft);
      } else {
        this.createNewDraft();
      }
    } else {
      this.createNewDraft();
    }
  }

  /**
   * ✅ Create a new draft
   */
  private createNewDraft(): void {
    this.isLoading.set(true);

    // ✅ Clear localStorage before creating new draft
    this.clearAllLocalStorage();

    this.propertyService.createPropertyDraft().subscribe({
      next: (draft) => {
        if (draft.id) {
          localStorage.setItem('currentDraftId', draft.id);
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/intro']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        alert('Failed to create property: ' + error.message);
      }
    });
  }

  /**
   * ✅ Clear all localStorage related to property creation
   */
  private clearAllLocalStorage(): void {
    const keysToRemove = [
      'property_photos',
      'selected_amenities',
      'property_type_id',
      'property_room_type',
      'property_location',
      'property_floor_plan',
      'property_pricing',
      'property_title',
      'property_description'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('✅ LocalStorage cleared for new draft');
  }

  /**
   * ✅ Edit/Continue draft or edit property
   */
  editProperty(property: Property | PropertyDraft, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const propertyId = property.id?.toString();
    
    if (!propertyId) {
      alert('Property ID not found');
      return;
    }

    localStorage.setItem('currentDraftId', propertyId);

    const isDraft = 'currentStep' in property && property.currentStep;

    if (isDraft) {
      const draft = property as PropertyDraft;
      const step = draft.currentStep || 'intro';
      
      console.log(`📍 Resuming draft at step: ${step}`);
      
      const stepRoutes: { [key: string]: string } = {
        'intro': 'intro',
        'property-type': 'property-type',
        'room-type': 'room-type',
        'location': 'location',
        'floor-plan': 'floor-plan',
        'amenities': 'amenities',
        'photos': 'photos',
        'title': 'title',
        'description': 'description',
        'pricing': 'pricing',
        'booking-settings': 'instant-book',
        'legal-and-create': 'legal-and-create'
      };

      const route = stepRoutes[step] || 'intro';
      this.router.navigate([`/host/properties/${route}`]);
    } else {
      this.router.navigate(['/host/properties/edit', propertyId]);
    }
  }

  /**
   * ✅ Delete draft
   */
  deleteDraft(property: Property | PropertyDraft, event: Event): void {
    event.stopPropagation();

    const propertyId = property.id?.toString();
    if (!propertyId) return;

    const propertyTitle = this.getPropertyTitle(property);
    
    if (confirm(`Are you sure you want to delete "${propertyTitle}"? This action cannot be undone.`)) {
      this.propertyService.deleteDraft(propertyId).subscribe({
        next: (success) => {
          if (success) {
            console.log('✅ Draft deleted');
            
            const currentDraftId = localStorage.getItem('currentDraftId');
            if (currentDraftId === propertyId) {
              this.clearAllLocalStorage();
              localStorage.removeItem('currentDraftId');
            }
            
            this.loadAllDrafts();
          }
        },
        error: (error) => {
          alert('Error deleting draft: ' + error.message);
        }
      });
    }
  }

  /**
   * ✅ Quick publish/unpublish toggle
   */
  togglePublishStatus(property: Property | PropertyDraft, event: Event): void {
    event.stopPropagation();

    const propertyId = property.id?.toString();
    if (!propertyId) return;

    const isDraft = 'currentStep' in property && property.currentStep;
    const progress = this.getProgressPercentage(property);

    if (isDraft && progress < 100) {
      alert('Please complete all steps before publishing this property.');
      this.editProperty(property);
      return;
    }

    const isActive = (property as any).isActive || false;
    const willPublish = !isActive;
    
    const confirmMsg = willPublish 
      ? 'Publish this listing? It will be visible to guests.'
      : 'Unpublish this listing? It will be hidden from guests.';
    
    if (!confirm(confirmMsg)) return;
    
    const action$ = willPublish 
      ? this.propertyService.publishProperty(propertyId)
      : this.propertyService.unpublishProperty(propertyId);
    
    action$.subscribe({
      next: () => {
        const msg = willPublish ? '✅ Published successfully!' : '✅ Unpublished successfully!';
        alert(msg);
        
        // ✅ Clear localStorage after successful publish
        if (willPublish) {
          this.clearAllLocalStorage();
          localStorage.removeItem('currentDraftId');
        }
        
        this.loadAllDrafts();
      },
      error: (error) => {
        alert(error.message || 'Failed to update status');
      }
    });
  }

  /**
   * ✅ Get progress percentage - FIXED for published properties
   */
  getProgressPercentage(property: Property | PropertyDraft): number {
    // ✅ If property is published (no currentStep or isActive), return 100%
    const isActive = (property as any).isActive;
    const hasCurrentStep = 'currentStep' in property && property.currentStep;
    
    // Debug logs
    console.log('Property Progress Check:', {
      id: property.id,
      title: property.title,
      isActive,
      hasCurrentStep,
      currentStep: (property as any).currentStep
    });
    
    if (isActive || !hasCurrentStep) {
      return 100;
    }
    
    // ✅ For drafts, calculate progress based on current step
    const progress = this.propertyService.getProgressPercentage(property.currentStep!);
    console.log('Calculated Progress:', progress);
    return progress;
  }

  getStatusBadgeClass(property: Property | PropertyDraft): string {
    const isDraft = 'currentStep' in property && property.currentStep;
    const isActive = (property as any).isActive;
    
    // ✅ Check if published first
    if (isActive) {
      return 'status-published';
    }
    
    if (isDraft) {
      const progress = this.getProgressPercentage(property);
      
      if (progress === 100) {
        return 'status-ready';
      } else if (progress >= 50) {
        return 'status-in-progress';
      } else {
        return 'status-draft';
      }
    }

    const prop = property as Property;
    switch (prop.status) {
      case PropertyStatus.PUBLISHED:
        return 'status-published';
      case PropertyStatus.DRAFT:
        return 'status-draft';
      case PropertyStatus.UNLISTED:
        return 'status-unlisted';
      case PropertyStatus.UNDER_REVIEW:
        return 'status-review';
      case PropertyStatus.BLOCKED:
        return 'status-blocked';
      default:
        return '';
    }
  }

  getStatusLabel(property: Property | PropertyDraft): string {
    const isActive = (property as any).isActive;
    const isDraft = 'currentStep' in property && property.currentStep;
    
    // ✅ Check if published first
    if (isActive) {
      return 'Published';
    }
    
    if (isDraft) {
      const progress = this.getProgressPercentage(property);
      
      if (progress === 100) {
        return 'Ready to publish';
      } else if (progress >= 50) {
        return `In progress (${progress}%)`;
      } else {
        return `Started (${progress}%)`;
      }
    }

    const prop = property as Property;
    switch (prop.status) {
      case PropertyStatus.PUBLISHED:
        return 'Published';
      case PropertyStatus.DRAFT:
        return 'In progress';
      case PropertyStatus.UNLISTED:
        return 'Unlisted';
      case PropertyStatus.UNDER_REVIEW:
        return 'Under review';
      case PropertyStatus.BLOCKED:
        return 'Action required';
      default:
        return 'Draft';
    }
  }

  getStepName(step?: string): string {
    const stepNames: { [key: string]: string } = {
      'intro': 'Getting Started',
      'property-type': 'Property Type',
      'room-type': 'Room Type',
      'location': 'Location',
      'floor-plan': 'Floor Plan',
      'amenities': 'Amenities',
      'photos': 'Photos',
      'title': 'Title',
      'description': 'Description',
      'pricing': 'Pricing',
      'booking-settings': 'Booking Settings',
      'legal-and-create': 'Legal & Create'
    };
    return stepNames[step || 'intro'] || 'In Progress';
  }

  getCurrentStep(property: Property | PropertyDraft): string {
    if ('currentStep' in property && property.currentStep) {
      return this.getStepName(property.currentStep);
    }
    return 'Published';
  }

  getPropertyTitle(property: Property | PropertyDraft): string {
    const title = property.title || 'Untitled Property';
    return title === 'Untitled Listing' ? 'New Draft' : title;
  }

  /**
   * ✅ FIXED: Get property image with full URL
   */
  getPropertyImage(property: Property | PropertyDraft): string {
    if ('images' in property && property.images && property.images.length > 0) {
      const primaryImage = property.images.find((img: any) => img.isPrimary);
      const imageToUse = primaryImage || property.images[0];
      
      if (imageToUse?.imageUrl) {
        const imageUrl = imageToUse.imageUrl;
        
        // ✅ If URL starts with /, prepend the base URL
        if (imageUrl.startsWith('/')) {
          return `${environment.apiUrl.replace('/api', '')}${imageUrl}`;
        }
        
        // ✅ If it's already a full URL, return as is
        if (imageUrl.startsWith('http')) {
          return imageUrl;
        }
        
        // ✅ Otherwise, construct the full URL
        return `${environment.imageBaseUrl}${imageUrl}`;
      }
    }
    return '';
  }

  /**
   * ✅ Check if property is a draft
   */
  isDraft(property: Property | PropertyDraft): boolean {
    // ✅ Property is draft if it has currentStep AND is not active
    const hasCurrentStep = 'currentStep' in property && !!property.currentStep;
    const isActive = (property as any).isActive;
    
    return hasCurrentStep && !isActive;
  }

  /**
   * ✅ Check if property is published
   */
  isPublished(property: Property | PropertyDraft): boolean {
    const isActive = (property as any).isActive;
    return isActive === true;
  }

  getLocationString(property: Property | PropertyDraft): string {
    const parts = [];
    
    if ('roomType' in property && property.roomType) {
      parts.push(this.getRoomTypeLabel(property.roomType as string));
    }
    
    if ('city' in property && property.city && property.city !== 'Draft City') {
      parts.push(property.city);
    }
    
    if ('state' in property && property.state) {
      parts.push(property.state);
    }
    
    if ('country' in property && property.country && property.country !== 'Draft Country') {
      parts.push(property.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Location not set';
  }

  getRoomTypeLabel(roomType: string): string {
    const labels: { [key: string]: string } = {
      'entire_place': 'Entire place',
      'private_room': 'Private room',
      'shared_room': 'Shared room',
      'hotel_room': 'Hotel room'
    };
    return labels[roomType] || 'Place';
  }

  needsAction(property: Property | PropertyDraft): boolean {
    const isDraft = this.isDraft(property);
    
    if (isDraft) {
      const progress = this.getProgressPercentage(property);
      return progress < 100;
    }

    const prop = property as Property;
    return prop.status === PropertyStatus.DRAFT || 
           prop.status === PropertyStatus.BLOCKED ||
           prop.status === PropertyStatus.UNDER_REVIEW;
  }

  /**
   * ✅ Get number of images
   */
  getImageCount(property: Property | PropertyDraft): number {
    if ('images' in property && property.images) {
      return property.images.length;
    }
    return 0;
  }

  /**
   * ✅ FIXED: Get amenities count
   */
  getAmenitiesCount(property: Property | PropertyDraft): number {
    // ✅ Check amenityIds first (for drafts)
    if ('amenityIds' in property && property.amenityIds) {
      return property.amenityIds.length;
    }
    
    // ✅ Then check amenities array (for published properties)
    if ('amenities' in property && property.amenities) {
      return Array.isArray(property.amenities) ? property.amenities.length : 0;
    }
    
    return 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  getPricePerNight(property: Property | PropertyDraft): string {
    if ('pricing' in property && property.pricing) {
      return this.formatPrice(property.pricing.basePrice);
    }
    
    if ('pricePerNight' in property && property.pricePerNight && property.pricePerNight > 0) {
      return this.formatPrice(property.pricePerNight);
    }

    return 'Not set';
  }

  getAverageRating(property: Property | PropertyDraft): string {
    if ('stats' in property && property.stats && property.stats.averageRating) {
      return property.stats.averageRating.toFixed(1);
    }
    return 'N/A';
  }

  getTotalReviews(property: Property | PropertyDraft): number {
    if ('stats' in property && property.stats && property.stats.totalReviews) {
      return property.stats.totalReviews;
    }
    return 0;
  }

  getPropertyStat(property: Property | PropertyDraft, key: 'averageRating' | 'totalReviews'): number | string {
    if (this.isPublished(property)) {
      const publishedProperty = property as Property;
      const statValue = (publishedProperty as any).stats?.[key]; 
      
      if (key === 'averageRating') {
        return statValue != null ? statValue.toFixed(1) : 'N/A';
      }
      
      return statValue != null ? statValue : 0;
    }
    return key === 'averageRating' ? 'N/A' : 0;
  }
}
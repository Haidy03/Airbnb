import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property';
import { Property, PropertyStatus, RoomType } from '../../models/property.model';

// Import the PropertyDraft interface from PropertyService
import { PropertyDraft } from '../../services/property';

@Component({
  selector: 'app-my-properties',
  imports: [CommonModule, RouterLink],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.css',
})
export class MyProperties implements OnInit {
  // Properties data - now includes both published and drafts
  properties = signal<(Property | PropertyDraft)[]>([]);
  isLoading = signal(false);
  
  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('grid');

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllDrafts();
  }

  /**
   * Load all drafts and properties
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

  /**
   * Toggle view mode
   */
  toggleViewMode(): void {
    const current = this.viewMode();
    this.viewMode.set(current === 'grid' ? 'list' : 'grid');
  }

  /**
   * Navigate to add new property
   */
  addNewProperty(): void {
    this.propertyService.createPropertyDraft().subscribe({
      next: (draft) => {
        if (draft.id) {
          // Store draft ID in localStorage
          localStorage.setItem('currentDraftId', draft.id);
          // Navigate to first step
          this.router.navigate(['/host/properties/intro']);
        }
      },
      error: (error) => {
        alert('Failed to create property: ' + error.message);
      }
    });
  }

  /**
   * Edit/Continue draft or edit property
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

    // Check if it's a draft (incomplete) or published property
    const isDraft = 'currentStep' in property;

    if (isDraft) {
      // For drafts, load and navigate to the current step
      const draft = property as PropertyDraft;
      localStorage.setItem('currentDraftId', propertyId);
      
      const step = draft.currentStep || 'property-type';
      console.log(`📍 Resuming draft at step: ${step}`);
      this.router.navigate([`/host/properties/${step}`]);
    } else {
      // For published properties, navigate to edit
      localStorage.setItem('currentDraftId', propertyId);
      this.router.navigate(['/host/properties/edit', propertyId]);
    }
  }

  /**
   * Delete draft
   */
  deleteDraft(property: Property | PropertyDraft, event: Event): void {
    event.stopPropagation();

    const propertyId = property.id?.toString();
    if (!propertyId) return;

    if (confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      this.propertyService.deleteDraft(propertyId).subscribe({
        next: (success) => {
          if (success) {
            console.log('✅ Draft deleted');
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
   * Quick publish/unpublish toggle
   */
  togglePublishStatus(property: Property | PropertyDraft, event: Event): void {
    event.stopPropagation();

    const propertyId = property.id?.toString();
    if (!propertyId) return;

    // Check if property is a draft - cannot publish incomplete drafts
    const isDraft = 'currentStep' in property;
    const isActive = (property as any).isActive || false;

    if (!isActive && !isDraft) {
      // For published properties
      const willPublish = (property as Property).status !== PropertyStatus.PUBLISHED;
      
      const confirmMsg = willPublish 
        ? 'Publish this listing? It will be visible to guests.'
        : 'Unpublish this listing? It will be hidden from guests.';
      
      if (!confirm(confirmMsg)) return;
      
      const action$ = willPublish 
        ? this.propertyService.publishProperty(propertyId)
        : this.propertyService.unpublishProperty(propertyId);
      
      action$.subscribe({
        next: () => {
          const msg = willPublish ? 'Published successfully!' : 'Unpublished successfully!';
          alert(msg);
          this.loadAllDrafts();
        },
        error: (error) => {
          alert(error.message || 'Failed to update status');
        }
      });
    } else if (isDraft) {
      // Drafts must be completed before publishing
      alert('Please complete all steps before publishing this property.');
      this.editProperty(property);
    }
  }

  /**
   * Get progress percentage based on current step
   */
  getProgressPercentage(property: Property | PropertyDraft): number {
    if (!('currentStep' in property)) {
      return 100; // Published property
    }
    return this.propertyService.getProgressPercentage(
      (property as PropertyDraft).currentStep || 'intro'
    );
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(property: Property | PropertyDraft): string {
    const isDraft = 'currentStep' in property;
    
    if (isDraft) {
      const draft = property as PropertyDraft;
      const progress = this.getProgressPercentage(draft);
      
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

  /**
   * Get status label
   */
  getStatusLabel(property: Property | PropertyDraft): string {
    const isDraft = 'currentStep' in property;
    
    if (isDraft) {
      const draft = property as PropertyDraft;
      const progress = this.getProgressPercentage(draft);
      
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
        return prop.status;
    }
  }

  /**
   * Get step name
   */
  getStepName(step?: string): string {
    const stepNames: { [key: string]: string } = {
      'intro': 'Getting Started',
      'property-type': 'Property Type',
      'room-type': 'Room Type',
      'location': 'Location',
      'amenities': 'Amenities',
      'photos': 'Photos',
      'pricing': 'Pricing',
      'review': 'Review'
    };
    return stepNames[step || 'intro'] || 'In Progress';
  }

  /**
   * Get current step for draft
   */
  getCurrentStep(property: Property | PropertyDraft): string {
    if ('currentStep' in property) {
      const draft = property as PropertyDraft;
      return this.getStepName(draft.currentStep);
    }
    return 'Published';
  }

  /**
   * Get property title or default
   */
  getPropertyTitle(property: Property | PropertyDraft): string {
    return property.title || 'Untitled Property';
  }

  /**
   * Get property images
   */
  getPropertyImage(property: Property | PropertyDraft): string {
    if ('images' in property && property.images && property.images.length > 0) {
      const primaryImage = property.images.find((img: any) => img.isPrimary);
      return primaryImage?.imageUrl || property.images[0]?.imageUrl || '';
    }
    return '/assets/placeholder.jpg';
  }

  /**
   * Check if property is a draft
   */
  isDraft(property: Property | PropertyDraft): boolean {
    return 'currentStep' in property;
  }

  /**
   * Check if property is published
   */
  isPublished(property: Property | PropertyDraft): boolean {
    if (this.isDraft(property)) {
      return false;
    }
    return (property as Property).status === PropertyStatus.PUBLISHED;
  }

  /**
   * Get property location string
   */
  getLocationString(property: Property | PropertyDraft): string {
    const parts = [];
    
    if ('roomType' in property && property.roomType) {
      parts.push(this.getRoomTypeLabel(property.roomType as string));
    }
    
    if ('city' in property && property.city) {
      parts.push(property.city);
    }
    
    if ('state' in property && property.state) {
      parts.push(property.state);
    }
    
    if ('country' in property && property.country) {
      parts.push(property.country);
    }
    
    return parts.join(', ') || 'Property';
  }

  /**
   * Get room type label
   */
  getRoomTypeLabel(roomType: string): string {
    const labels: { [key: string]: string } = {
      'entire_place': 'Entire place',
      'private_room': 'Private room',
      'shared_room': 'Shared room',
      'hotel_room': 'Hotel room'
    };
    return labels[roomType] || 'Place';
  }

  /**
   * Check if property needs action
   */
  needsAction(property: Property | PropertyDraft): boolean {
    const isDraft = this.isDraft(property);
    
    if (isDraft) {
      const progress = this.getProgressPercentage(property);
      return progress < 100; // Incomplete drafts need action
    }

    const prop = property as Property;
    return prop.status === PropertyStatus.DRAFT || 
           prop.status === PropertyStatus.BLOCKED ||
           prop.status === PropertyStatus.UNDER_REVIEW;
  }

  /**
   * Get number of images
   */
  getImageCount(property: Property | PropertyDraft): number {
    if ('images' in property && property.images) {
      return property.images.length;
    }
    return 0;
  }

  /**
   * Get amenities count
   */
  getAmenitiesCount(property: Property | PropertyDraft): number {
    if ('amenityIds' in property && property.amenityIds) {
      return property.amenityIds.length;
    } else if ('amenities' in property && property.amenities) {
      return (property as any).amenities.length;
    }
    return 0;
  }

  /**
   * Format price
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

    /*
      Get the price per night for published property
    */

 
  getPricePerNight(property: Property | PropertyDraft): string {
    // 1. If it is a Published Property, look inside 'pricing.basePrice'
    if ('pricing' in property && property.pricing) {
      return this.formatPrice(property.pricing.basePrice);
    }
    
    // 2. If it is a Draft, look at 'pricePerNight'
    if ('pricePerNight' in property && property.pricePerNight) {
      return this.formatPrice(property.pricePerNight);
    }

    // 3. Fallback
    return 'N/A';
  }
  /**
   * Safe getter for Average Rating
   */
  getAverageRating(property: Property | PropertyDraft): string {
    // Check if 'stats' property exists (it only exists on Published Property)
    if ('stats' in property && property.stats && property.stats.averageRating) {
      return property.stats.averageRating.toFixed(1);
    }
    return 'N/A';
  }

  /**
   * Safe getter for Total Reviews
   */
  getTotalReviews(property: Property | PropertyDraft): number {
    // Check if 'stats' property exists
    if ('stats' in property && property.stats && property.stats.totalReviews) {
      return property.stats.totalReviews;
    }
    return 0;
  }

/**
 * Get a specific statistic property safely.
 */
getPropertyStat(property: Property | PropertyDraft, key: 'averageRating' | 'totalReviews'): number | string {
  if (this.isPublished(property)) {
    const publishedProperty = property as Property;
    // Use optional chaining in TS file for safety
    const statValue = (publishedProperty as any).stats?.[key]; 
    
    if (key === 'averageRating') {
      return statValue != null ? statValue.toFixed(1) : 'N/A';
    }
    
    return statValue != null ? statValue : 0;
  }
  return key === 'averageRating' ? 'N/A' : 0;
}
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property';
import { Property, PropertyStatus, RoomType } from '../../models/property.model';
import { PropertyDraft } from '../../services/property';
import { environment } from '../../../../../environments/environment';

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
   * ✅ Toggle publish/activate/deactivate status
   */
  togglePublishStatus(property: Property | PropertyDraft, event: Event): void {
    event.stopPropagation();

    const propertyId = property.id?.toString();
    if (!propertyId) return;

    const isDraft = 'currentStep' in property && property.currentStep;
    const progress = this.getProgressPercentage(property);
    const status = (property as any).status;
    const isActive = (property as any).isActive;

    // ✅ إذا كانت Draft غير مكتملة
    if (isDraft && progress < 100) {
      alert('Please complete all steps before submitting.');
      this.editProperty(property);
      return;
    }

    // ✅ إذا كانت Draft مكتملة - إرسال للموافقة
    if (isDraft && progress === 100) {
      if (!confirm('Submit this listing for admin approval?\n\nYour listing will be reviewed within 24-48 hours.')) return;
      
      this.propertyService.submitForApproval(propertyId).subscribe({
        next: () => {
          alert('✅ Property submitted for approval!\n\nYou will be notified once it has been reviewed.');
          this.clearAllLocalStorage();
          localStorage.removeItem('currentDraftId');
          this.loadAllDrafts();
        },
        error: (error) => {
          alert(error.message || 'Failed to submit for approval');
        }
      });
      return;
    }

    // ✅ إذا كانت معتمدة - تفعيل
    if (status === 'Approved' && !isActive) {
      if (!confirm('Activate this listing?\n\nIt will be visible to guests and available for bookings.')) return;
      
      this.propertyService.activateProperty(propertyId).subscribe({
        next: () => {
          alert('✅ Property activated successfully!\n\nYour listing is now live and visible to guests.');
          this.loadAllDrafts();
        },
        error: (error) => {
          alert(error.message || 'Failed to activate property');
        }
      });
      return;
    }

    // ✅ إذا كانت مفعلة - إيقاف
    if (status === 'Active' && isActive) {
      if (!confirm('Deactivate this listing?\n\nIt will be hidden from guests and unavailable for new bookings.')) return;
      
      this.propertyService.deactivateProperty(propertyId).subscribe({
        next: () => {
          alert('✅ Property deactivated successfully!\n\nYour listing is now hidden from guests.');
          this.loadAllDrafts();
        },
        error: (error) => {
          alert(error.message || 'Failed to deactivate property');
        }
      });
      return;
    }

    // ✅ إذا كانت بانتظار الموافقة
    if (status === 'PendingApproval') {
      alert('This property is pending admin approval.\n\nYou will be notified once it has been reviewed.');
      return;
    }

    // ✅ إذا كانت مرفوضة
    if (status === 'Rejected') {
      this.showRejectionReason(property);
      return;
    }

    // ✅ إذا كانت معلقة
    if (status === 'Suspended') {
      alert('This property has been suspended.\n\nPlease contact support for more information.');
      return;
    }
  }

  /**
   * ✅ Get progress percentage - FIXED for published properties
   */
  getProgressPercentage(property: Property | PropertyDraft): number {
    const isActive = (property as any).isActive;
    const hasCurrentStep = 'currentStep' in property && property.currentStep;
    
    // If property is published (no currentStep or isActive), return 100%
    if (isActive || !hasCurrentStep) {
      return 100;
    }
    
    // For drafts, calculate progress based on current step
    const progress = this.propertyService.getProgressPercentage(property.currentStep!);
    return progress;
  }

  /**
   * ✅ Get status badge CSS class
   */
  getStatusBadgeClass(property: Property | PropertyDraft): string {
    const isDraft = 'currentStep' in property && property.currentStep;
    const isActive = (property as any).isActive;
    const status = (property as any).status;
    
    // Check if it's a draft first
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

    // Then check the status from backend
    switch (status) {
      case 'PendingApproval':
        return 'status-pending-approval';
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'Active':
        return 'status-active';
      case 'Inactive':
        return 'status-inactive';
      case 'Suspended':
        return 'status-suspended';
      default:
        return 'status-draft';
    }
  }

  /**
   * ✅ Get status label text
   */
  getStatusLabel(property: Property | PropertyDraft): string {
    const isDraft = 'currentStep' in property && property.currentStep;
    const status = (property as any).status;
    
    if (isDraft) {
      const progress = this.getProgressPercentage(property);
      
      if (progress === 100) {
        return 'Ready to submit';
      } else if (progress >= 50) {
        return `In progress (${progress}%)`;
      } else {
        return `Started (${progress}%)`;
      }
    }

    switch (status) {
      case 'PendingApproval':
        return 'Pending Approval';
      case 'Approved':
        return 'Approved';
      case 'Rejected':
        return 'Rejected';
      case 'Active':
        return 'Active';
      case 'Inactive':
        return 'Inactive';
      case 'Suspended':
        return 'Suspended';
      default:
        return 'Draft';
    }
  }

  /**
   * ✅ Get step name for display
   */
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

  /**
   * ✅ Get current step for property
   */
  getCurrentStep(property: Property | PropertyDraft): string {
    if ('currentStep' in property && property.currentStep) {
      return this.getStepName(property.currentStep);
    }
    return 'Completed';
  }

  /**
   * ✅ Get property title
   */
  getPropertyTitle(property: Property | PropertyDraft): string {
    const title = property.title || 'Untitled Property';
    return title === 'Untitled Listing' ? 'New Draft' : title;
  }

  /**
   * ✅ Get property image with full URL
   */
  getPropertyImage(property: Property | PropertyDraft): string {
    if ('images' in property && property.images && property.images.length > 0) {
      const primaryImage = property.images.find((img: any) => img.isPrimary);
      const imageToUse = primaryImage || property.images[0];
      
      if (imageToUse?.imageUrl) {
        const imageUrl = imageToUse.imageUrl;
        
        // If URL starts with /, prepend the base URL
        if (imageUrl.startsWith('/')) {
          return `${environment.apiUrl.replace('/api', '')}${imageUrl}`;
        }
        
        // If it's already a full URL, return as is
        if (imageUrl.startsWith('http')) {
          return imageUrl;
        }
        
        // Otherwise, construct the full URL
        return `${environment.imageBaseUrl}${imageUrl}`;
      }
    }
    return '';
  }

  /**
   * ✅ Check if property is a draft
   */
  isDraft(property: Property | PropertyDraft): boolean {
    const hasCurrentStep = 'currentStep' in property && !!property.currentStep;
    const isActive = (property as any).isActive;
    
    return hasCurrentStep && !isActive;
  }

  /**
   * ✅ Check if property is pending approval
   */
  isPendingApproval(property: Property | PropertyDraft): boolean {
    const status = (property as any).status;
    return status === 'PendingApproval';
  }

  /**
   * ✅ Check if property is approved
   */
  isApproved(property: Property | PropertyDraft): boolean {
    const status = (property as any).status;
    return status === 'Approved';
  }

  /**
   * ✅ Check if property is rejected
   */
  isRejected(property: Property | PropertyDraft): boolean {
    const status = (property as any).status;
    return status === 'Rejected';
  }

  /**
   * ✅ Check if property is active
   */
  isActive(property: Property | PropertyDraft): boolean {
    const isActive = (property as any).isActive;
    return isActive === true;
  }

  /**
   * ✅ Check if property is published (active or inactive)
   */
  isPublished(property: Property | PropertyDraft): boolean {
    const status = (property as any).status;
    return status === 'Active' || status === 'Inactive';
  }

  /**
   * ✅ Get location string
   */
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

  /**
   * ✅ Get room type label
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
   * ✅ Check if property needs action
   */
  needsAction(property: Property | PropertyDraft): boolean {
    const isDraft = this.isDraft(property);
    
    if (isDraft) {
      const progress = this.getProgressPercentage(property);
      return progress < 100;
    }

    const status = (property as any).status;
    return status === 'Draft' || 
           status === 'Rejected' ||
           status === 'Suspended';
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
   * ✅ Get amenities count
   */
  getAmenitiesCount(property: Property | PropertyDraft): number {
    // Check amenityIds first (for drafts)
    if ('amenityIds' in property && property.amenityIds) {
      return property.amenityIds.length;
    }
    
    // Then check amenities array (for published properties)
    if ('amenities' in property && property.amenities) {
      return Array.isArray(property.amenities) ? property.amenities.length : 0;
    }
    
    return 0;
  }

  /**
   * ✅ Format price
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * ✅ Get price per night
   */
  getPricePerNight(property: Property | PropertyDraft): string {
    if ('pricing' in property && property.pricing) {
      return this.formatPrice(property.pricing.basePrice);
    }
    
    if ('pricePerNight' in property && property.pricePerNight && property.pricePerNight > 0) {
      return this.formatPrice(property.pricePerNight);
    }

    return 'Not set';
  }

  /**
   * ✅ Get average rating
   */
  getAverageRating(property: Property | PropertyDraft): string {
    if ('stats' in property && property.stats && property.stats.averageRating) {
      return property.stats.averageRating.toFixed(1);
    }
    return 'New';
  }

  /**
   * ✅ Get total reviews
   */
  getTotalReviews(property: Property | PropertyDraft): number {
    if ('stats' in property && property.stats && property.stats.totalReviews) {
      return property.stats.totalReviews;
    }
    return 0;
  }

  /**
   * ✅ Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(date: Date | undefined): string {
    if (!date) return 'recently';
    
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  }

  /**
   * ✅ Show rejection reason
   */
  showRejectionReason(property: Property | PropertyDraft): void {
    const rejectionReason = (property as any).rejectionReason || 'No reason provided';
    
    const message = `Your listing was rejected for the following reason:\n\n` +
                    `"${rejectionReason}"\n\n` +
                    `Please address the issues and resubmit your listing.`;
    
    alert(message);
  }

  /**
   * ✅ View property details (navigate to detail page)
   */
  viewPropertyDetails(property: Property | PropertyDraft, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const propertyId = property.id?.toString();
    if (!propertyId) return;

    // Navigate to property detail page
    this.router.navigate(['/properties', propertyId]);
  }

  /**
   * ✅ Filter properties by status (optional - for future use)
   */
  filterProperties(filter: 'all' | 'draft' | 'pending' | 'active' | 'inactive'): void {
    // This can be implemented later if needed
    console.log('Filter by:', filter);
  }

  /**
   * ✅ Get count of drafts
   */
  getDraftsCount(): number {
    return this.properties().filter(p => this.isDraft(p)).length;
  }

  /**
   * ✅ Get count of pending properties
   */
  getPendingCount(): number {
    return this.properties().filter(p => this.isPendingApproval(p)).length;
  }

  /**
   * ✅ Get count of active properties
   */
  getActiveCount(): number {
    return this.properties().filter(p => this.isActive(p)).length;
  }
}
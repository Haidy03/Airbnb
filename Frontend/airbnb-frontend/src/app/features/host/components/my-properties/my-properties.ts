import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../services/property';
import { Property, PropertyStatus } from '../../models/property.model';

@Component({
  selector: 'app-my-properties',
  imports: [CommonModule],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.css',
 
})

export class MyProperties implements OnInit{
  // Properties data
  properties = signal<Property[]>([]);
  loading = signal<boolean>(true);
  
  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('grid');

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  /**
   * Load all properties
   */
  loadProperties(): void {
    this.loading.set(true);
    
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties.set(properties);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.loading.set(false);
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
   * Navigate to add property
   */
  addNewProperty(): void {
    this.router.navigate(['/host/properties/add']);
  }

  /**
   * Navigate to edit property
   */
  editProperty(propertyId: string): void {
    this.router.navigate(['/host/properties/edit', propertyId]);
  }

   /**
   * Quick publish/unpublish toggle
   */
  togglePublishStatus(property: Property, event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    const willPublish = property.status !== PropertyStatus.PUBLISHED;
    
    // Validate before publishing
    if (willPublish) {
      const validation = this.propertyService.validatePropertyForPublishing(property);
      if (!validation.isValid) {
        const errorMsg = 'Cannot publish. Please complete:\n' + validation.errors.join('\n');
        alert(errorMsg);
        this.router.navigate(['/host/properties/edit', property.id]);
        return;
      }
    }
    
    const confirmMsg = willPublish 
      ? 'Publish this listing? It will be visible to guests.'
      : 'Unpublish this listing? It will be hidden from guests.';
    
    if (!confirm(confirmMsg)) return;
    
    const action$ = willPublish 
      ? this.propertyService.publishProperty(property.id)
      : this.propertyService.unpublishProperty(property.id);
    
    action$.subscribe({
      next: (updatedProperty) => {
        // Update local state
        const current = this.properties();
        const index = current.findIndex(p => p.id === property.id);
        if (index !== -1) {
          const updated = [...current];
          updated[index] = updatedProperty;
          this.properties.set(updated);
        }
        
        const msg = willPublish ? 'Published successfully!' : 'Unpublished successfully!';
        alert(msg);
      },
      error: (error) => {
        console.error('Error toggling status:', error);
        alert(error.message || 'Failed to update status');
      }
    });
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: PropertyStatus): string {
    switch (status) {
      case PropertyStatus.PUBLISHED:
        return 'status-published';
      case PropertyStatus.DRAFT:
        return 'status-draft';
      case PropertyStatus.UNLISTED:
        return 'status-unlisted';
      case PropertyStatus.UNDER_REVIEW:
        return 'status-review';
      default:
        return '';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: PropertyStatus): string {
    switch (status) {
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
        return status;
    }
  }

  /**
   * Check if property needs action
   */
  needsAction(property: Property): boolean {
    return property.status === PropertyStatus.DRAFT || 
           property.status === PropertyStatus.BLOCKED ||
           property.status === PropertyStatus.UNDER_REVIEW;
  }

  /**
   * Get property location string
   */
  getLocationString(property: Property): string {
    const parts = [];
    if (property.roomType) {
      parts.push(this.getRoomTypeLabel(property.roomType));
    }
    if (property.location.city) {
      parts.push(property.location.city);
    }
    if (property.location.state) {
      parts.push(property.location.state);
    }
    if (property.location.country) {
      parts.push(property.location.country);
    }
    return parts.join(', ') || 'Home in';
  }

  /**
   * Get room type label
   */
  getRoomTypeLabel(roomType: string): string {
    const labels: { [key: string]: string } = {
      'entire_place': 'Home in',
      'private_room': 'Private room in',
      'shared_room': 'Shared room in',
      'hotel_room': 'Hotel room in'
    };
    return labels[roomType] || 'Home in';
  }
}

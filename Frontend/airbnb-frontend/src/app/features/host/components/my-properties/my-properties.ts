import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../services/property';
import { Property, PropertyStatus, PROPERTY_STATUS_LABELS } from '../../models/property.model';

@Component({
  selector: 'app-my-properties',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-properties.html',
  styleUrl: './my-properties.css',
})
export class MyProperties implements OnInit {
  allProperties = signal<Property[]>([]);
  searchQuery = signal<string>('');
  isLoading = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');
  isSearchOpen = signal(false);

  properties = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const list = this.allProperties();
    
    if (!query) return list;

    return list.filter(p => 
      (p.title || '').toLowerCase().includes(query) ||
      (p.city || '').toLowerCase().includes(query) ||
      (p.country || '').toLowerCase().includes(query)
    );
  });

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllDrafts();
  }

  loadAllDrafts(): void {
    this.isLoading.set(true);
    this.propertyService.getAllDrafts().subscribe({
      next: (data) => {
        this.allProperties.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.isLoading.set(false);
      }
    });
  }

  toggleViewMode(): void {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  toggleSearch(): void {
    this.isSearchOpen.update(v => !v);
    if (!this.isSearchOpen()) this.searchQuery.set('');
  }

  // ✅ Helper: Status Label
  getStatusLabel(property: Property): string {
    // Use numerical enum comparison
    if (property.currentStep && Number(property.status) === PropertyStatus.DRAFT) {
      return 'In progress';
    }
    return PROPERTY_STATUS_LABELS[Number(property.status)] || 'Unknown';
  }

  // ✅ Helper: Status Color
  getStatusColor(property: Property): string {
    const status = Number(property.status);
    
    if (property.currentStep && status === PropertyStatus.DRAFT) return 'orange';
    
    switch (status) {
      case PropertyStatus.ACTIVE: return 'green';
      case PropertyStatus.APPROVED: return 'green';
      case PropertyStatus.PENDING_APPROVAL: return 'black';
      case PropertyStatus.REJECTED: return 'red';
      default: return 'orange';
    }
  }

  getPropertyImage(property: Property): string {
    return property.coverImage || 'assets/images/placeholder-property.jpg';
  }

  // ✅ Helper: Missing Method Implementation
  getPropertyTypeLabel(property: Property): string {
    return property.propertyType || 'Unknown';
  }

  getLocation(property: Property): string {
    // Safely access flat fields
    const city = property.city || property.location?.city || '';
    const country = property.country || property.location?.country || '';
    if (city && country) return `${city}, ${country}`;
    return city || country || 'Location pending';
  }

  editProperty(property: Property, event?: Event): void {
    if (event) event.stopPropagation();

    const propertyId = property.id;
    const status = Number(property.status);

    // Resume Draft
    if (status === PropertyStatus.DRAFT) {
      localStorage.setItem('currentDraftId', propertyId);
      const currentStep = property.currentStep || 'intro';
      
      const stepRoutes: { [key: string]: string } = {
        'intro': 'intro', 'property-type': 'property-type', 'room-type': 'room-type',
        'location': 'location', 'floor-plan': 'floor-plan', 'amenities': 'amenities',
        'photos': 'photos', 'title': 'title', 'description': 'description',
        'pricing': 'pricing', 'booking-settings': 'instant-book', 'legal-and-create': 'legal-and-create',
        'default': 'intro'
      };
      
      const targetRoute = stepRoutes[currentStep] || stepRoutes['default'];
      this.router.navigate([`/host/properties/${targetRoute}`]);
    } 
    // Edit Published/Pending
    else {
      this.router.navigate(['/host/properties/editor', propertyId]);
    }
  }

  addNewProperty(): void {
    this.propertyService.createPropertyDraft().subscribe({
      next: (draft) => {
        if (draft.id) {
          localStorage.setItem('currentDraftId', draft.id);
          this.router.navigate(['/host/properties/intro']);
        }
      }
    });
  }
  
  // Template Helpers
  isDraft(p: Property) { return Number(p.status) === PropertyStatus.DRAFT; }
  isActionRequired(p: Property) { return Number(p.status) === PropertyStatus.REJECTED; }
  isPublished(p: Property) { return Number(p.status) === PropertyStatus.ACTIVE; }
}
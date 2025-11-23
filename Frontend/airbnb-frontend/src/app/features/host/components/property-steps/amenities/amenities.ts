import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PropertyService } from '../../../services/property';

interface Amenity {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  isActive: boolean;
}

@Component({
  selector: 'app-amenities-step',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './amenities.html',
  styleUrls: ['./amenities.css']
})
export class AmenitiesStepComponent implements OnInit{
  selectedAmenities = signal<number[]>([]);
   // Signal for selected IDs (using Set for performance)
  selectedIds = computed(() => new Set(this.selectedAmenities()));

 
  isLoading = signal(false);
  currentDraftId: string | null = null;
 
  // --- State ---

  
  // Data matching your database screenshot
  readonly amenities: Amenity[] = [
    { id: 1, name: 'WiFi', description: null, icon: 'wifi', category: 'Basic', isActive: true },
    { id: 2, name: 'TV', description: null, icon: 'tv', category: 'Entertainment', isActive: true },
    { id: 3, name: 'Kitchen', description: null, icon: 'utensils', category: 'Kitchen', isActive: true },
    { id: 4, name: 'Washer', description: null, icon: 'washing-machine', category: 'Basic', isActive: true },
    { id: 5, name: 'Dryer', description: null, icon: 'wind', category: 'Basic', isActive: true },
    { id: 6, name: 'Air conditioning', description: null, icon: 'snowflake', category: 'HeatingCooling', isActive: true },
    { id: 7, name: 'Heating', description: null, icon: 'flame', category: 'HeatingCooling', isActive: true },
    { id: 8, name: 'Dedicated workspace', description: null, icon: 'briefcase', category: 'InternetOffice', isActive: true },
    { id: 9, name: 'Pool', description: null, icon: 'waves', category: 'Outdoor', isActive: true },
    { id: 10, name: 'Hot tub', description: null, icon: 'hot-tub', category: 'Outdoor', isActive: true },
    { id: 11, name: 'Patio', description: null, icon: 'patio', category: 'Outdoor', isActive: true }, // Added from design
    { id: 12, name: 'BBQ grill', description: null, icon: 'grill', category: 'Outdoor', isActive: true }, // Added from design
    { id: 13, name: 'Outdoor dining area', description: null, icon: 'dining', category: 'Outdoor', isActive: true }, // Added from design
    { id: 14, name: 'Fire pit', description: null, icon: 'fire', category: 'Outdoor', isActive: true }, // Added from design
    { id: 15, name: 'Free parking on premises', description: null, icon: 'parking', category: 'Parking', isActive: true },
    { id: 16, name: 'Paid parking on premises', description: null, icon: 'paid-parking', category: 'Parking', isActive: true },
    { id: 17, name: 'EV charger', description: null, icon: 'zap', category: 'Parking', isActive: true },
    { id: 18, name: 'Smoke alarm', description: null, icon: 'alert-triangle', category: 'Safety', isActive: true },
    { id: 19, name: 'Carbon monoxide alarm', description: null, icon: 'alert-circle', category: 'Safety', isActive: true },
  ];

 
  // --- Computed Groups ---
  
  // Group 1: "Guest favorites" (Combines Basic, Kitchen, Ent, Parking, etc.)
  guestFavorites = computed(() => this.amenities.filter(a => 
    ['Basic', 'Entertainment', 'Kitchen', 'HeatingCooling', 'InternetOffice', 'Parking'].includes(a.category)
  ));

  // Group 2: "Standout amenities" (Outdoor)
  standoutAmenities = computed(() => this.amenities.filter(a => 
    a.category === 'Outdoor'
  ));

  // Group 3: "Safety items" (Safety)
  safetyItems = computed(() => this.amenities.filter(a => 
    a.category === 'Safety'
  ));

  constructor(
    private router: Router,
    private propertyService: PropertyService 

  ) {}

  ngOnInit(): void {
    this.getCurrentDraft();
 
  }

    /**
   * Get current draft
   */
  getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          if (draft.amenityIds && draft.amenityIds.length > 0) {
            this.selectedAmenities.set(draft.amenityIds);
          }
        }
      });
    }
  }
  // --- Actions ---

    toggleAmenity(amenityId: number): void {
    const current = this.selectedAmenities();
    if (current.includes(amenityId)) {
      this.selectedAmenities.set(current.filter(id => id !== amenityId));
    } else {
      this.selectedAmenities.set([...current, amenityId]);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

 saveAndExit(): void {
    if (!confirm('Save your progress and exit?')) return;

    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { amenityIds: this.selectedAmenities() },
        'amenities'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/host/properties/location']);
  }


  goNext(): void {
    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { amenityIds: this.selectedAmenities() },
        'amenities'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/photos']);
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    }
  }


}
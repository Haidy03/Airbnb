import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router ,RouterLink} from '@angular/router';
import { PropertyService } from '../../../services/property';

@Component({
  selector: 'app-property-intro',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './property-intro.html',
  styleUrls: ['./property-intro.css']
})
export class PropertyIntroComponent implements OnInit {
  isLoading = signal(false);
  draftPropertyId = signal<string | null>(null);

  constructor(
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    // Check if there's a draft in progress
    const savedDraft = localStorage.getItem('property_draft_id');
    if (savedDraft) {
      this.draftPropertyId.set(savedDraft);
    }
  }

  /**
   * Save progress and exit
   */
  async saveAndExit(): Promise<void> {
    const confirmed = confirm(
      'Save your progress and exit? You can continue later from where you left off.'
    );
    
    if (!confirmed) return;

    this.isLoading.set(true);

    try {
      // If we have a draft, just exit
      if (this.draftPropertyId()) {
        this.router.navigate(['/host/properties']);
        return;
      }

      // Create a minimal draft property
      const draftProperty = {
        title: 'Untitled Property',
        description: 'Property listing in progress',
        propertyType: 'HOUSE',
        address: '',
        city: '',
        country: '',
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

      this.propertyService.createProperty(draftProperty as any).subscribe({
        next: (property) => {
          console.log('✅ Draft property created:', property.id);
          localStorage.setItem('property_draft_id', property.id);
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          console.error('❌ Failed to create draft:', error);
          alert('Failed to save draft. Please try again.');
          this.isLoading.set(false);
        }
      });
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      this.isLoading.set(false);
    }
  }

  /**
   * Show questions/help modal
   */
  showQuestionsModal(): void {
    alert('Questions? Contact our support team for help with listing your property.');
  }

  /**
   * Go back to properties list
   */
  goBack(): void {
    this.router.navigate(['/host/properties']);
  }

  /**
   * Start the multi-step property creation
   */
  startPropertyCreation(): void {
    // Navigate to the actual add property form
    this.router.navigate(['/host/properties/property-type']);
  }
}
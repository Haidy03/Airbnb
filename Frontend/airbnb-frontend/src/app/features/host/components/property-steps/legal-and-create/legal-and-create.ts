import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 

@Component({
  selector: 'app-safety-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-and-create.html',
  styleUrls: ['./legal-and-create.css']
})
export class legalandcreateComponent implements OnInit {
  isLoading = signal(false);
  currentDraftId: string | null = null;
  currentDraft: Property | null = null;

  // Safety checkboxes state
  exteriorCamera = signal(false);
  noiseMonitor = signal(false);
  weapons = signal(false);

  constructor(
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.getCurrentDraft();
  }

  private getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          this.currentDraft = draft;
          
          // Load safety details if they exist
          if (draft.safetyDetails) {
            this.exteriorCamera.set(draft.safetyDetails.exteriorCamera || false);
            this.noiseMonitor.set(draft.safetyDetails.noiseMonitor || false);
            this.weapons.set(draft.safetyDetails.weapons || false);
          }
          
          console.log('✅ Draft loaded:', draft);
        },
        error: (error) => {
          console.error('Error loading draft:', error);
          this.router.navigate(['/host/properties']);
        }
      });
    } else {
      console.error('No draft ID found');
      this.router.navigate(['/host/properties/intro']);
    }
  }

  toggleSafety(item: 'exteriorCamera' | 'noiseMonitor' | 'weapons'): void {
    switch (item) {
      case 'exteriorCamera':
        this.exteriorCamera.set(!this.exteriorCamera());
        break;
      case 'noiseMonitor':
        this.noiseMonitor.set(!this.noiseMonitor());
        break;
      case 'weapons':
        this.weapons.set(!this.weapons());
        break;
    }
  }

  isSafetyChecked(item: 'exteriorCamera' | 'noiseMonitor' | 'weapons'): boolean {
    switch (item) {
      case 'exteriorCamera':
        return this.exteriorCamera();
      case 'noiseMonitor':
        return this.noiseMonitor();
      case 'weapons':
        return this.weapons();
    }
  }

  showQuestionsModal(): void {
    alert('Safety details help guests understand what to expect at your property.');
  }

  private getSafetyPayload() {
    return{
      // نرسل الأسماء مطابقة تماماً لـ UpdatePropertyDto في الباك
      hasExteriorCamera: this.exteriorCamera(),
      hasNoiseMonitor: this.noiseMonitor(),
      hasWeapons: this.weapons()
    };
  }

  exit(): void {
    if (!confirm('Exit? Make sure to publish your listing later.')) return;

    this.isLoading.set(true);

    if (this.currentDraftId) {
      // ✅ نستخدم الدالة المساعدة لإرسال البيانات مسطحة
      const payload = this.getSafetyPayload();
      
      console.log('📤 Sending Safety Payload:', payload); // للتأكد في الـ Console

      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        payload, 
        'safety-details'
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
    } else {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/host/properties/pricing']);
  }

  createListing(): void {
    this.isLoading.set(true);

    if (this.currentDraftId) {
      // ✅ نستخدم نفس الدالة المساعدة هنا أيضاً
      const payload = this.getSafetyPayload();

      console.log('📤 Creating Listing with Safety:', payload);

      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        payload,
        'safety-details'
      ).subscribe({
        next: () => {
          // Publish logic...
          this.propertyService.publishProperty(this.currentDraftId!).subscribe({
            next: () => {
              this.isLoading.set(false);
              this.clearAllLocalStorage();
              alert('✅ Your listing has been published successfully!');
              this.router.navigate(['/host/properties']);
            },
            error: (error) => {
              this.isLoading.set(false);
              alert('Property saved but not yet published. ' + error.message);
              this.router.navigate(['/host/properties']);
            }
          });
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  /**
   * ✅ Clear ALL localStorage after publish
   */
  private clearAllLocalStorage(): void {
    const keysToRemove = [
      'currentDraftId',
      'property_photos',
      'selected_amenities',
      'property_type_id',
      'property_room_type',
      'property_location',
      'property_floor_plan',
      'property_pricing',
      'property_title',
      'property_description',
      'property_instant_book',
      'property_safety_details'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('✅ All localStorage cleared after publish');
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 
import { NotificationService } from '../../../../../core/services/notification.service';

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
    private propertyService: PropertyService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.getCurrentDraft();
    console.log('🟢 Component Initialized');
  }

  private getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          this.currentDraft = draft;
          
          
          if (draft.safetyDetails) {
            console.log('📦 Loading Safety Details from Draft:', draft.safetyDetails);
            this.exteriorCamera.set(draft.safetyDetails.exteriorCamera || false);
            this.noiseMonitor.set(draft.safetyDetails.noiseMonitor || false);
            this.weapons.set(draft.safetyDetails.weapons || false);
          } else {
            console.log('⚠️ No safetyDetails found in draft');
          }
          
         
          console.log('✅ Current State:', {
            exteriorCamera: this.exteriorCamera(),
            noiseMonitor: this.noiseMonitor(),
            weapons: this.weapons()
          });
          
          console.log('✅ Draft loaded:', draft);
        },
        error: (error) => {
          console.error('❌ Error loading draft:', error);
          this.router.navigate(['/host/properties']);
        }
      });
    } else {
      console.error('❌ No draft ID found');
      this.router.navigate(['/host/properties/intro']);
    }
  }

  toggleSafety(item: 'exteriorCamera' | 'noiseMonitor' | 'weapons', event?: Event): void {

    if (event) {
      event.stopPropagation();
    }
    
    console.log(`🔄 Toggling ${item}`);
    
    switch (item) {
      case 'exteriorCamera':
        const newCameraValue = !this.exteriorCamera();
        this.exteriorCamera.set(newCameraValue);
        console.log(`✅ Exterior Camera: ${this.exteriorCamera()}`);
        break;
      case 'noiseMonitor':
        const newNoiseValue = !this.noiseMonitor();
        this.noiseMonitor.set(newNoiseValue);
        console.log(`✅ Noise Monitor: ${this.noiseMonitor()}`);
        break;
      case 'weapons':
        const newWeaponsValue = !this.weapons();
        this.weapons.set(newWeaponsValue);
        console.log(`✅ Weapons: ${this.weapons()}`);
        break;
    }


    console.log('📊 Current Values After Toggle:', {
      exteriorCamera: this.exteriorCamera(),
      noiseMonitor: this.noiseMonitor(),
      weapons: this.weapons()
    });
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
    this.notificationService.showToast('info', 'Safety details help guests know what to expect.');
  }

  private getSafetyPayload() {
    const payload = {
      hasExteriorCamera: this.exteriorCamera(),
      hasNoiseMonitor: this.noiseMonitor(),
      hasWeapons: this.weapons()
    };
    
    console.log('📤 Safety Payload Created:', payload);
    return payload;
  }

   async exit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction('Exit?', 'Make sure to publish your listing later.'); 
    if (!confirmed) return;

    this.isLoading.set(true);

    if (this.currentDraftId) {
      const payload = this.getSafetyPayload();
      
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        payload, 
        'safety-details'
      ).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.notificationService.showError('Failed to save: ' + error.message); 
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/host/properties/house-rules']);
  }

  createListing(): void {
    console.log('🚀 Creating Listing...');
    this.isLoading.set(true);

    if (this.currentDraftId) {
      const payload = this.getSafetyPayload();

      console.log('📤 Creating Listing with Safety Details:', payload);

      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        payload,
        'safety-details'
      ).subscribe({
        next: (updateResponse) => {
          console.log('✅ Step Update Successful:', updateResponse);
          
          // Now publish
          this.propertyService.publishProperty(this.currentDraftId!).subscribe({
            next: (publishResponse) => {
              console.log('✅ Property Published Successfully:', publishResponse);
              this.isLoading.set(false);
              this.clearAllLocalStorage();
              this.notificationService.showSuccess('Congratulations!', 'Your listing has been published successfully!');
              this.router.navigate(['/host/properties']);
            },
            error: (error) => {
              console.error('❌ Publish Failed:', error);
              this.isLoading.set(false);
              this.notificationService.showError('Property saved but not published: ' + error.message);
              this.router.navigate(['/host/properties']);
            }
          });
        },
        error: (error) => {
          console.error('❌ Update Failed:', error);
          this.isLoading.set(false);
          this.notificationService.showError('Failed to save: ' + error.message);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

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
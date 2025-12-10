import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { NotificationService } from '../../../../../core/services/notification.service';
@Component({
  selector: 'app-property-intro',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-intro.html',
  styleUrls: ['./property-intro.css']
})
export class PropertyIntroComponent implements OnInit {
  isLoading = signal(false);
  currentDraftId: string | null = null; 

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private notificationService: NotificationService 
  ) {}

  ngOnInit(): void {
    this.getCurrentDraft();
  }

  /**
   * ✅ Get current draft if exists
   */
  getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      console.log('✅ Resuming existing draft:', this.currentDraftId);
      
      // ✅ Load draft data and clear old localStorage
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          console.log('✅ Draft loaded successfully');
          // ✅ Clear any old localStorage that might conflict
          this.clearOldLocalStorage();
        },
        error: (error) => {
          console.error('❌ Error loading draft:', error);
          
          localStorage.removeItem('currentDraftId');
          this.currentDraftId = null;
        }
      });
    }
  }

  /**
   * ✅ Clear old localStorage entries
   */
  private clearOldLocalStorage(): void {
    // ✅ Only clear specific keys that might cause conflicts
    const keysToCheck = [
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

    keysToCheck.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Cleared old localStorage: ${key}`);
      }
    });
  }
  /**
   * ✅ Save progress and exit
   */
  async saveAndExit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction(
      'Save & Exit?',
      'Your progress will be saved.'
    );
    if (confirmed) {
      this.router.navigate(['/host/properties']);
    }
  }

  /**
   * Show questions/help modal
   */
  showQuestionsModal(): void {
    this.notificationService.showToast('info', 'Contact our support team for help.');
  }

  /**
   * Go back to properties list
   */
  goBack(): void {
    this.router.navigate(['/host/properties']);
  }

  /**
   * ✅ Start property creation
   */
  startPropertyCreation(): void {
    // ✅ Check if we already have a draft ID
    if (this.currentDraftId) {
      console.log('✅ Continuing existing draft:', this.currentDraftId);
      this.isLoading.set(false);
      this.router.navigate(['/host/properties/property-type']);
      return;
    }

    // ✅ No draft exists, create new one
    this.isLoading.set(true);

    // ✅ Clear all localStorage before creating new draft
    this.clearAllLocalStorage();

    this.propertyService.createPropertyDraft().subscribe({
      next: (draft) => {
        console.log('✅ Draft created:', draft.id);
        
        if (draft.id) {
          localStorage.setItem('currentDraftId', draft.id);
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/property-type']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error creating draft:', error);
        this.notificationService.showError('Failed to create property. Please try again.');
      }
    });
  }

  /**
   * ✅ Clear ALL localStorage related to property creation
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
      'property_description',
      'property_instant_book',
      'property_safety_details'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('✅ All localStorage cleared for new draft');
  }

}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 
import { NotificationService } from '../../../../../core/services/notification.service'; 

@Component({
  selector: 'app-booking-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './instant-book.html',
  styleUrls: ['./instant-book.css']
})
export class instantBookComponent implements OnInit {
  isLoading = signal(false);
  currentDraftId: string | null = null;
  currentDraft: Property | null = null;

  // Booking settings state
  bookingMode = signal<'instant' | 'approval'>('approval');

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private notificationService: NotificationService
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
          
          
          if (draft.isInstantBook) {
            this.bookingMode.set('instant');
          } else {
            this.bookingMode.set('approval');
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

  selectBookingMode(mode: 'instant' | 'approval'): void {
    this.bookingMode.set(mode);
  }

  
  private getPayload() {
    return {
      
      isInstantBook: this.bookingMode() === 'instant'
    };
  }

  async saveAndExit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction('Save & Exit?', 'Your progress will be saved.'); 
    if (!confirmed) return;

    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        this.getPayload(), 
        'booking-settings'
      ).subscribe({
        next: () => {
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

  showQuestionsModal(): void {
    this.notificationService.showToast('info', 'You can change this anytime!'); 
  }

  learnMore(): void {
    window.open('https://www.airbnb.com/help/article/828', '_blank');
  }

  goBack(): void {
    this.router.navigate(['/host/properties/finish-setup']);
  }

  goNext(): void {
    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        this.getPayload(), 
        'booking-settings'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/pricing']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.notificationService.showError('Failed to save: ' + error.message);
        }
      });
    }
  }
}
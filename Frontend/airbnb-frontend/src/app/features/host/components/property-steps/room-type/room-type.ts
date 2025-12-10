import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { NotificationService } from '../../../../../core/services/notification.service';

type RoomType = 'entire_place' | 'private_room' | 'shared_room' | 'hotel_room';

interface RoomTypeOption {
  id: RoomType;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-property-room-type',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './room-type.html',
  styleUrls: ['./room-type.css']
  
 
})
export class PropertyRoomTypeComponent implements OnInit {
  selectedType = signal<RoomType | undefined>(undefined);
  isLoading = signal(false);
  currentDraftId: string | null = null;

  roomTypes: RoomTypeOption[] = [
    {
      id: 'entire_place',
      title: 'An entire place',
      description: 'Guests have the whole place to themselves',
      icon: '🏠'
    },
    {
      id: 'private_room',
      title: 'A private room',
      description: 'Guests have their own room in a home, plus access to shared spaces',
      icon: '🚪'
    },
    {
      id: 'shared_room',
      title: 'A shared room',
      description: 'Guests sleep in a room or common area that may be shared with others',
      icon: '🛏️'
    }
  ];

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private notificationService: NotificationService
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
          if (draft.roomType) {
            this.selectedType.set(draft.roomType as RoomType);
          }
        }
      });
    }
  }

  selectRoomType(type: RoomType): void {
    this.selectedType.set(type);
  }

  async saveAndExit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction('Save & Exit?', 'Your progress will be saved.');
    if (!confirmed) return;

    this.isLoading.set(true);

    if (this.currentDraftId && this.selectedType()) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        {roomType: this.selectedType() },
        'room-type'
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
    }
  }

  showQuestionsModal(): void {
    this.notificationService.showToast('info', 'Contact support.'); 
  }

  goBack(): void {
    this.router.navigate(['/host/properties/property-type']);
  }

   goNext(): void {
    if (!this.selectedType()) {
      this.notificationService.showError('Please select a room type.');
      return;
    }

    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { roomType: this.selectedType() },
        'room-type'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/location']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.notificationService.showError('Failed to save: ' + error.message);
        }
      });
    }
  }

}
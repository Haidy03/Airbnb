import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { NotificationService } from '../../../../../core/services/notification.service';
import Swal from 'sweetalert2';
interface FloorPlanData {
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
}

@Component({
  selector: 'app-property-floor-plan',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './floor-plan.html',
  styleUrls: ['./floor-plan.css']
})
export class PropertyFloorPlanComponent implements OnInit {
  isLoading = signal(false);
  currentDraftId: string | null = null;

  floorPlan = signal<FloorPlanData>({
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1
  });

  isFormValid = computed(() => {
    const plan = this.floorPlan();
    return plan.guests >= 1 && 
           plan.bedrooms >= 1 && 
           plan.beds >= 1 && 
           plan.bathrooms >=1;
  });

  constructor(
    private router: Router,
    private propertyService: PropertyService,
    private notificationService: NotificationService 
  ) {}

  ngOnInit(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    this.loadSavedData();
  }

  loadSavedData(): void {
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          console.log('Draft Loaded:', draft); // Debugging
          
          this.floorPlan.set({
            guests: draft.maxGuests || 1,
            bedrooms: draft.numberOfBedrooms || 1,
            beds: draft.numberOfBeds || 1, 
            bathrooms: draft.numberOfBathrooms || 1
          });
        },
        error: (err) => console.error('Error loading draft', err)
      });
    }
  }

  // ... (Increment / Decrement Logic remains the same) ...
  increment(field: keyof FloorPlanData, step: number = 1): void {
    const current = this.floorPlan();
    this.floorPlan.set({ ...current, [field]: current[field] + step });
  }

  decrement(field: keyof FloorPlanData, step: number = 1): void {
    const current = this.floorPlan();
    if (current[field] > 0) {
        this.floorPlan.set({ ...current, [field]: current[field] - step });
    }
  }
  
  canDecrement(field: keyof FloorPlanData): boolean {
  const val = this.floorPlan()[field];
  return val > 1;
  }
  
  canIncrement(field: keyof FloorPlanData): boolean { return true; }
  formatBathrooms(value: number): string { return value.toString(); }
  showQuestionsModal(): void {}

  saveAndExit(): void {
     this.saveData(() => this.router.navigate(['/host/properties']));
  }

  goBack(): void {
    this.router.navigate(['/host/properties/location']);
  }

  goNext(): void {
    if (!this.isFormValid()) return;
    this.saveData(() => this.router.navigate(['/host/properties/stand-out']));
  }

  
  private saveData(onSuccess: () => void): void {
    this.isLoading.set(true);

    if (this.currentDraftId) {
      const plan = this.floorPlan();
      
     
      const payload = {
        maxGuests: plan.guests,
        numberOfBedrooms: plan.bedrooms,
        numberOfBeds: plan.beds, 
        numberOfBathrooms: plan.bathrooms
      };

      console.log('Sending Payload:', payload);

      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        payload,
        'floor-plan'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          onSuccess();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.notificationService.showError('Failed to save: ' + error.message);
        }
      });
    } else {
        this.router.navigate(['/host/properties/intro']);
    }
  }
}
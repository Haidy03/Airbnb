import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';

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
           plan.bathrooms >= 0.5;
  });

  constructor(
    private router: Router,
    private propertyService: PropertyService
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
          
          // ✅ الآن TypeScript لن يعترض لأننا أضفنا الحقول في الـ Interface
          this.floorPlan.set({
            guests: draft.maxGuests || 1,
            bedrooms: draft.numberOfBedrooms || 1,
            beds: draft.numberOfBeds || 1, // ✅ الحقل الجديد من الباك
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
    // يمكنك إضافة شروط الحد الأقصى هنا
    this.floorPlan.set({ ...current, [field]: current[field] + step });
  }

  decrement(field: keyof FloorPlanData, step: number = 1): void {
    const current = this.floorPlan();
    if (current[field] > 0) { // شرط بسيط لمنع القيم السالبة
        this.floorPlan.set({ ...current, [field]: current[field] - step });
    }
  }
  
  canDecrement(field: keyof FloorPlanData): boolean {
      const val = this.floorPlan()[field];
      return field === 'bathrooms' ? val > 0.5 : val > 1; // مثال
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

  // ✅ دالة موحدة للحفظ
  private saveData(onSuccess: () => void): void {
    this.isLoading.set(true);

    if (this.currentDraftId) {
      const plan = this.floorPlan();
      
      // ✅ تجهيز البيانات بنفس أسماء الـ DTO في الباك اند
      const payload = {
        maxGuests: plan.guests,
        numberOfBedrooms: plan.bedrooms,
        numberOfBeds: plan.beds, // ✅ إرسال الحقل الجديد
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
          alert('Failed to save: ' + error.message);
        }
      });
    } else {
        this.router.navigate(['/host/properties/intro']);
    }
  }
}
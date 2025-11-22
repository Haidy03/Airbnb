import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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
  
  // Floor plan data
  floorPlan = signal<FloorPlanData>({
    guests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1
  });

  // Validation
  isFormValid = computed(() => {
    const plan = this.floorPlan();
    return plan.guests >= 1 && 
           plan.bedrooms >= 1 && 
           plan.beds >= 1 && 
           plan.bathrooms >= 0.5;
  });

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadSavedData();
  }

  /**
   * Load saved data from localStorage
   */
  loadSavedData(): void {
    const saved = localStorage.getItem('property_floor_plan');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.floorPlan.set(data);
      } catch (error) {
        console.error('Error loading saved floor plan:', error);
      }
    }
  }

  /**
   * Save data to localStorage
   */
  saveData(): void {
    localStorage.setItem('property_floor_plan', JSON.stringify(this.floorPlan()));
  }

  /**
   * Increment a value
   */
  increment(field: keyof FloorPlanData, step: number = 1): void {
    const current = this.floorPlan();
    const maxValues = {
      guests: 16,
      bedrooms: 50,
      beds: 50,
      bathrooms: 50
    };

    if (current[field] < maxValues[field]) {
      this.floorPlan.set({
        ...current,
        [field]: current[field] + step
      });
      this.saveData();
    }
  }

  /**
   * Decrement a value
   */
  decrement(field: keyof FloorPlanData, step: number = 1): void {
    const current = this.floorPlan();
    const minValues = {
      guests: 1,
      bedrooms: 0,
      beds: 1,
      bathrooms: 0.5
    };

    if (current[field] > minValues[field]) {
      this.floorPlan.set({
        ...current,
        [field]: current[field] - step
      });
      this.saveData();
    }
  }

  /**
   * Check if can decrement
   */
  canDecrement(field: keyof FloorPlanData): boolean {
    const current = this.floorPlan();
    const minValues = {
      guests: 1,
      bedrooms: 0,
      beds: 1,
      bathrooms: 0.5
    };
    return current[field] > minValues[field];
  }

  /**
   * Check if can increment
   */
  canIncrement(field: keyof FloorPlanData): boolean {
    const current = this.floorPlan();
    const maxValues = {
      guests: 16,
      bedrooms: 50,
      beds: 50,
      bathrooms: 50
    };
    return current[field] < maxValues[field];
  }

  /**
   * Format bathroom display
   */
  formatBathrooms(value: number): string {
    if (value === 0.5) return '0.5';
    return value.toString();
  }

  /**
   * Save and exit
   */
  saveAndExit(): void {
    const confirmed = confirm(
      'Save your progress and exit? You can continue later from where you left off.'
    );
    
    if (!confirmed) return;

    this.saveData();
    this.router.navigate(['/host/properties']);
  }

  /**
   * Show questions modal
   */
  showQuestionsModal(): void {
    alert('Questions? Contact our support team for help with listing your property.');
  }

  /**
   * Go back to previous step
   */
  goBack(): void {
    this.saveData();
    this.router.navigate(['/host/properties/location']);
  }

  /**
   * Go to next step
   */
  goNext(): void {
    if (!this.isFormValid()) {
      alert('Please ensure all values are valid.');
      return;
    }

    this.saveData();
    
    // Navigate to amenities step (you'll create this next)
    this.router.navigate(['/host/properties/stand-out']);
  }
}
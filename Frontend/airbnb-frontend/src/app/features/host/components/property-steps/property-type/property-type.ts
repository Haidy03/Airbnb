import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

interface PropertyTypeOption {
  id: number; // ✅ Changed to number
  code: string;
  label: string;
  icon: string;
  description?: string;
  category?: string;
}

@Component({
  selector: 'app-property-type',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-type.html',
  styleUrls: ['./property-type.css']
})
export class PropertyTypeComponent implements OnInit {
  isLoading = signal(false);
  selectedType = signal<number | null>(null); // ✅ Changed to number
  loadingPropertyTypes = signal(false);
  
  propertyTypes: PropertyTypeOption[] = [];

  constructor(
    private router: Router,
    private http: HttpClient // ✅ Inject HttpClient
  ) {}

  ngOnInit(): void {
    this.loadPropertyTypes(); // ✅ Load from backend
    this.loadSavedSelection(); // ✅ Load saved selection
  }

  /**
   * ✅ Load property types from backend
   */
  loadPropertyTypes(): void {
    this.loadingPropertyTypes.set(true);
    
    this.http.get<any[]>(`${environment.apiUrl}/PropertyTypes`)
      .subscribe({
        next: (types) => {
          console.log('✅ Property types loaded:', types);
          
          // Map backend response to our interface
          this.propertyTypes = types.map(t => ({
            id: t.id,
            code: t.code,
            label: t.name,
            icon: t.iconType,
            description: t.description,
            category: t.category
          }));
          
          this.loadingPropertyTypes.set(false);
        },
        error: (error) => {
          console.error('❌ Error loading property types:', error);
          this.loadingPropertyTypes.set(false);
          
          // ✅ Fallback to hardcoded types if API fails
          this.propertyTypes = [
            { id: 1, code: 'HOUSE', label: 'House', icon: 'house' },
            { id: 2, code: 'APARTMENT', label: 'Apartment', icon: 'apartment' },
            { id: 3, code: 'BARN', label: 'Barn', icon: 'barn' },
            { id: 4, code: 'BED_BREAKFAST', label: 'Bed & breakfast', icon: 'bed-breakfast' },
            { id: 5, code: 'BOAT', label: 'Boat', icon: 'boat' },
            { id: 6, code: 'CABIN', label: 'Cabin', icon: 'cabin' },
            { id: 7, code: 'CAMPER', label: 'Camper/RV', icon: 'camper' },
            { id: 8, code: 'CASA_PARTICULAR', label: 'Casa particular', icon: 'casa' },
            { id: 9, code: 'CASTLE', label: 'Castle', icon: 'castle' },
            { id: 10, code: 'CAVE', label: 'Cave', icon: 'cave' },
            { id: 11, code: 'CONTAINER', label: 'Container', icon: 'container' },
            { id: 12, code: 'CYCLADIC_HOME', label: 'Cycladic home', icon: 'cycladic' }
          ];
        }
      });
  }

  /**
   * ✅ Load saved selection from localStorage
   */
  loadSavedSelection(): void {
    const saved = localStorage.getItem('property_type_id');
    if (saved) {
      this.selectedType.set(parseInt(saved));
    }
  }

  /**
   * Select property type
   */
  selectPropertyType(typeId: number): void {
    this.selectedType.set(typeId);
  }

  /**
   * Save and exit
   */
  async saveAndExit(): Promise<void> {
    const confirmed = confirm(
      'Save your progress and exit? You can continue later from where you left off.'
    );
    
    if (!confirmed) return;

    this.isLoading.set(true);

    // Save current selection
    if (this.selectedType()) {
      localStorage.setItem('property_type_id', this.selectedType()!.toString());
    }

    // Navigate back to properties list
    setTimeout(() => {
      this.router.navigate(['/host/properties']);
    }, 500);
  }

  showQuestionsModal(): void {
    alert('Questions? Contact our support team for help with listing your property.');
  }

  goBack(): void {
    this.router.navigate(['/host/properties/intro']);
  }

  goNext(): void {
    if (!this.selectedType()) {
      alert('Please select a property type to continue.');
      return;
    }

    // ✅ Save selection to localStorage
    localStorage.setItem('property_type_id', this.selectedType()!.toString());
    
    // ✅ Navigate to next step (you'll create this)
    this.router.navigate(['/host/properties/room-type']); // Next step
  }
}
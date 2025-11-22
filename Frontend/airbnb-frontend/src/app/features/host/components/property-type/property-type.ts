import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface PropertyType {
  id: string;
  label: string;
  icon: string;
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
  selectedType = signal<string>('');
  
  propertyTypes: PropertyType[] = [
    { id: 'HOUSE', label: 'House', icon: 'house' },
    { id: 'APARTMENT', label: 'Apartment', icon: 'apartment' },
    { id: 'BARN', label: 'Barn', icon: 'barn' },
    { id: 'BED_BREAKFAST', label: 'Bed & breakfast', icon: 'bed-breakfast' },
    { id: 'BOAT', label: 'Boat', icon: 'boat' },
    { id: 'CABIN', label: 'Cabin', icon: 'cabin' },
    { id: 'CAMPER', label: 'Camper/RV', icon: 'camper' },
    { id: 'CASA_PARTICULAR', label: 'Casa particular', icon: 'casa' },
    { id: 'CASTLE', label: 'Castle', icon: 'castle' },
    { id: 'CAVE', label: 'Cave', icon: 'cave' },
    { id: 'CONTAINER', label: 'Container', icon: 'container' },
    { id: 'CYCLADIC_HOME', label: 'Cycladic home', icon: 'cycladic' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load saved property type from localStorage
    const savedType = localStorage.getItem('property_type');
    if (savedType) {
      this.selectedType.set(savedType);
    }
  }

  selectPropertyType(typeId: string): void {
    this.selectedType.set(typeId);
  }

  async saveAndExit(): Promise<void> {
    const confirmed = confirm(
      'Save your progress and exit? You can continue later from where you left off.'
    );
    
    if (!confirmed) return;

    this.isLoading.set(true);

    // Save current selection
    if (this.selectedType()) {
      localStorage.setItem('property_type', this.selectedType());
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

    // Save selection
    localStorage.setItem('property_type', this.selectedType());
    
    // Navigate to next step (you'll create this later)
    this.router.navigate(['/host/properties/privacy-type']);
  }
}
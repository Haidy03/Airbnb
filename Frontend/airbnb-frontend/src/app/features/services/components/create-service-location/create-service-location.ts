import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-service-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-service-location.html',
  styleUrls: ['./create-service-location.css']
})
export class CreateServiceLocationComponent {
  locationType = signal<number | null>(null);
  city = signal<string>('');

  constructor(private router: Router) {
    const savedType = localStorage.getItem('draftServiceLocationType');
    const savedCity = localStorage.getItem('draftServiceCity');

    if (savedType) this.locationType.set(Number(savedType));
    if (savedCity) this.city.set(savedCity);
  }

  selectType(type: number) {
    this.locationType.set(type);
  }

  goBack() {
    this.router.navigate(['/host/services/price']);
  }

  onNext() {
    if (this.locationType() !== null && this.city().trim()) {
      localStorage.setItem('draftServiceLocationType', this.locationType()!.toString());
      localStorage.setItem('draftServiceCity', this.city().trim());
     // alert(`Location saved! Type: ${this.locationType()}, City: ${this.city()}`);
      this.router.navigate(['/host/services/availability']); 
      
    }
  }
}
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-service-price',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-service-price.html',
  styleUrls: ['./create-service-price.css']
})
export class CreateServicePriceComponent {
  price = signal<number | null>(null);
  pricingUnits = [
    { value: 1, label: 'Per person' },
    { value: 0, label: 'Per hour' },
    { value: 2, label: 'Per session' },
    { value: 3, label: 'Flat fee' }
  ];
  
  selectedUnit = signal<number>(1); 

  constructor(private router: Router) {
    
    const savedPrice = localStorage.getItem('draftServicePrice');
    const savedUnit = localStorage.getItem('draftServiceUnit');
    
    if (savedPrice) this.price.set(Number(savedPrice));
    if (savedUnit) this.selectedUnit.set(Number(savedUnit));
  }

  onPriceChange(val: any) {
    this.price.set(val);
  }

  onUnitChange(val: any) {
    this.selectedUnit.set(Number(val));
  }

  goBack() {
    this.router.navigate(['/host/services/description']);
  }

  onNext() {
    if (this.price() && this.price()! > 0) {
      localStorage.setItem('draftServicePrice', this.price()!.toString());
      localStorage.setItem('draftServiceUnit', this.selectedUnit().toString());
      //alert(`Price saved: ${this.price()} EGP - Unit: ${this.selectedUnit()}`);
      this.router.navigate(['/host/services/location']); 
    }
  }
}
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-service-description',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-service-description.html',
  styleUrls: ['./create-service-description.css']
})
export class CreateServiceDescriptionComponent {
  description = signal<string>('');
  maxLength = 500; // وصف أطول من العنوان

  constructor(private router: Router) {
    // استرجاع البيانات القديمة لو موجودة
    const savedDesc = localStorage.getItem('draftServiceDescription');
    if (savedDesc) {
      this.description.set(savedDesc);
    }
  }

  onDescChange(newValue: string) {
    this.description.set(newValue);
  }

  goBack() {
    this.router.navigate(['/host/services/title']);
  }

  onNext() {
    if (this.description().trim().length > 0) {
      localStorage.setItem('draftServiceDescription', this.description().trim());
      alert('Description saved! Ready for Location Step.'); 
    }
  }
}
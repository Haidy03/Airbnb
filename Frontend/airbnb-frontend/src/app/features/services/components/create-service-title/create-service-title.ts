import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-service-title',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-service-title.html',
  styleUrls: ['./create-service-title.css']
})
export class CreateServiceTitleComponent {
  title = signal<string>('');
  maxLength = 50;

  constructor(private router: Router) {
    const savedTitle = localStorage.getItem('draftServiceTitle');
    if (savedTitle) {
      this.title.set(savedTitle);
    }
  }

  onTitleChange(newValue: string) {
    this.title.set(newValue);
  }

  goBack() {
    this.router.navigate(['/host/services/create']);
  }

  onNext() {
    if (this.title().trim().length > 0) {
      localStorage.setItem('draftServiceTitle', this.title().trim());
      this.router.navigate(['/host/services/description']); 
    }
  }
}
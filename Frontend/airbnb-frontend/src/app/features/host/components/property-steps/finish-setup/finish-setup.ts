import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-finish-setup',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './finish-setup.html',
  styleUrls: ['./finish-setup.css']
})
export class FinishsetupComponent {
  isLoading = signal(false);

  constructor(private router: Router) {}

  showQuestionsModal() {
   
  }

  saveAndExit() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/host/dashboard']);
    }, 1000);
  }

  goBack() {
    this.router.navigate(['/host/properties/description']); 
  }

  startPropertyCreation() {
    this.router.navigate(['/host/properties/instant-book']); 
  }
}
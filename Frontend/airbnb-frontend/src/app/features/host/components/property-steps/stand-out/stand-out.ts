import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-stand-out',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './stand-out.html',
  styleUrls: ['./stand-out.css']
})
export class StandOutComponent {
  isLoading = signal(false);

  constructor(private router: Router) {}

  showQuestionsModal() {
    console.log('Show questions');
  }

  saveAndExit() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/']); // Redirect after saving
    }, 1000);
  }

  goBack() {
    this.router.navigate(['/host/properties/floor-plan']); 
  }

  startPropertyCreation() {
    this.router.navigate(['/host/properties/amenities']); // Next step
  }
}
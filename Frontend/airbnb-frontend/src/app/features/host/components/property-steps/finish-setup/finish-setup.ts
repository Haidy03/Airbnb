// finish-up-and-publish.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';

@Component({
  selector: 'app-finish-up-and-publish',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './finish-setup.html',
  styleUrls: ['./finish-setup.css']
})
export class FinishsetupComponent {
  isLoading = signal(false);

  constructor(
    private router: Router,
    private propertyService: PropertyService
  ) {}

  showQuestionsModal(): void {
    alert('What’s your question about publishing?');
  }

  saveAndExit(): void {
    if (!confirm('Save your progress and exit?')) return;

    this.isLoading.set(true);
    // Optional: Save current step as 'publish' or finalize draft
    // this.propertyService.updateDraftStatus(...).subscribe(...);

    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/host/properties']);
    }, 500);
  }

  goBack(): void {
    this.router.navigate(['/host/properties/description']);
  }

  goNext(): void {
    this.isLoading.set(true);

    // Finalize and publish logic would go here
    // e.g., this.propertyService.publishDraft(draftId).subscribe(...)

    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/host/properties/instant-book']); // or listing page
    }, 600);
  }
}
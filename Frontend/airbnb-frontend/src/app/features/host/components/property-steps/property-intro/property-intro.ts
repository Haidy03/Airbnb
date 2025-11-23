import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property'; // ✅ Use the correct Service

@Component({
  selector: 'app-property-intro',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-intro.html',
  styleUrls: ['./property-intro.css']
})
export class PropertyIntroComponent implements OnInit {
  isLoading = signal(false);
  
  // ✅ Match the style of PropertyTypeComponent
  currentDraftId: string | null = null; 

  constructor(
    private router: Router,
    private propertyService: PropertyService // ✅ Inject PropertyService only
  ) {}

  ngOnInit(): void {
    this.getCurrentDraft(); // ✅ Check for existing draft on load
  }

  /**
   * Get current draft if exists (Matching PropertyType pattern)
   */
  getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    // Optional: You could verify it exists with the backend here if needed, 
    // but for the Intro page, just knowing we have an ID is usually enough.
    if (this.currentDraftId) {
      console.log('✅ Resuming existing draft:', this.currentDraftId);
    }
  }

  /**
   * Save progress and exit
   */
  saveAndExit(): void {
    const confirmed = confirm('Save your progress and exit?');
    if (confirmed) {
      this.router.navigate(['/host/properties']);
    }
  }

  /**
   * Show questions/help modal
   */
  showQuestionsModal(): void {
    alert('Questions? Contact our support team for help with listing your property.');
  }

  /**
   * Go back to properties list
   */
  goBack(): void {
    this.router.navigate(['/host/properties']);
  }

  /**
   * Start the multi-step property creation
   * ✅ UPDATED: Uses PropertyService and handles the redirect
   */
  startPropertyCreation(): void {
    this.isLoading.set(true);

    // ✅ Calls the FIXED createPropertyDraft() from PropertyService
    this.propertyService.createPropertyDraft().subscribe({
      next: (draft) => {
        console.log('✅ Draft created:', draft.id);
        
        if (draft.id) {
          // ✅ Store ID in localStorage so the Next Step can find it
          localStorage.setItem('currentDraftId', draft.id);
          
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/property-type']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Error creating draft:', error);
        alert('Failed to create property. Please try again.');
      }
    });
  }
}
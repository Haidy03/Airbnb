import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 

@Component({
  selector: 'app-property-title',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './title.html',
  styleUrls: ['./title.css']
})
export class PropertyTitleComponent implements OnInit {
  // Form and state
  titleForm!: FormGroup;
  isLoading = signal(false);
  currentDraftId: string | null = null;
  currentDraft: Property | null = null;

  // Character counter
  maxChars = 50;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getCurrentDraft();
  }

  /**
   * Initialize the form with validators
   */
  private initializeForm(): void {
    this.titleForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(this.maxChars)
      ]]
    });
  }

  /**
   * Get current draft from localStorage and backend
   */
  private getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          this.currentDraft = draft;
          
          // Pre-fill form if title exists
          if (draft.title && draft.title !== 'Untitled Listing') {
            this.titleForm.patchValue({
              title: draft.title
            });
          }
          
          console.log('✅ Draft loaded:', draft);
        },
        error: (error) => {
          console.error('Error loading draft:', error);
          this.router.navigate(['/host/properties']);
        }
      });
    } else {
      console.error('No draft ID found');
      this.router.navigate(['/host/properties/intro']);
    }
  }

  /**
   * Get remaining character count
   */
  getRemainingChars(): number {
    const title = this.titleForm.get('title')?.value || '';
    return this.maxChars - title.length;
  }

  /**
   * Check if character count is getting low
   */
  isCharCountLow(): boolean {
    return this.getRemainingChars() <= 10;
  }

  /**
   * Get character count color
   */
  getCharCountColor(): string {
    const remaining = this.getRemainingChars();
    if (remaining <= 5) return '#FF385C';
    if (remaining <= 10) return '#FFB800';
    return '#717171';
  }

  /**
   * Save and exit
   */
  saveAndExit(): void {
    if (!confirm('Save your progress and exit? You can continue later.')) return;

    this.isLoading.set(true);

    if (this.currentDraftId && this.titleForm.valid) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { title: this.titleForm.get('title')?.value },
        'title'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          console.log('✅ Title saved');
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error saving:', error);
          alert('Failed to save: ' + error.message);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  /**
   * Show help modal
   */
  showQuestionsModal(): void {
    alert(
      `Tips for a great title:\n\n` +
      `✓ Be specific and descriptive\n` +
      `✓ Highlight unique features\n` +
      `✓ Keep it short and punchy\n` +
      `✓ Examples: "Cozy Cave with City Views", "Luxury Cave Retreat"\n\n` +
      `You can change this anytime!`
    );
  }

  /**
   * Go back to previous step
   */
  goBack(): void {
    this.router.navigate(['/host/properties/photos']);
  }

  /**
   * Go to next step
   */
  goNext(): void {
    if (!this.titleForm.valid) {
      alert('Please enter a valid title (10-50 characters)');
      return;
    }

    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { title: this.titleForm.get('title')?.value },
        'title'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          console.log('✅ Title saved, moving to description');
          this.router.navigate(['/host/properties/description']);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error saving:', error);
          alert('Failed to save: ' + error.message);
        }
      });
    }
  }
}
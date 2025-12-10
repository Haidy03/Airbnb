import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 
import { NotificationService } from '../../../../../core/services/notification.service';
import Swal from 'sweetalert2';
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
    private propertyService: PropertyService,
    private notificationService: NotificationService
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
  async saveAndExit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction('Save & Exit?', 'Your progress will be saved.'); // ✅
    if (!confirmed) return;

    this.isLoading.set(true);

    if (this.currentDraftId && this.titleForm.valid) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { title: this.titleForm.get('title')?.value },
        'title'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.notificationService.showError('Failed to save: ' + error.message); // ✅
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
    Swal.fire({
      title: 'Title Tips',
      html: `
        <ul style="text-align: left;">
          <li>✓ Be specific and descriptive</li>
          <li>✓ Highlight unique features</li>
          <li>✓ Keep it short and punchy</li>
        </ul>
      `,
      confirmButtonColor: '#222',
      confirmButtonText: 'Got it'
    });
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
      this.notificationService.showError('Please enter a valid title (10-50 characters)');
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
          this.notificationService.showError('Failed to save: ' + error.message);
        }
      });
    }
  }
}
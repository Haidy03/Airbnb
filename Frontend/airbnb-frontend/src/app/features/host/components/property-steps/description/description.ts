import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model'; 


@Component({
  selector: 'app-property-description',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './description.html',
  styleUrls: ['./description.css']
})
export class PropertyDescriptionComponent implements OnInit {
  descriptionForm!: FormGroup;
  isLoading = signal(false);
  currentDraftId: string | null = null;
  currentDraft: Property | null = null;

  maxChars = 500;
  minChars = 50;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getCurrentDraft();
  }

  private initializeForm(): void {
    this.descriptionForm = this.fb.group({
      description: ['', [
        Validators.required,
        Validators.minLength(this.minChars),
        Validators.maxLength(this.maxChars)
      ]]
    });
  }

  private getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          this.currentDraft = draft;
          
          if (draft.description && draft.description !== 'Draft description...') {
            this.descriptionForm.patchValue({
              description: draft.description
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

  getRemainingChars(): number {
    const description = this.descriptionForm.get('description')?.value || '';
    return this.maxChars - description.length;
  }

  getCharCount(): number {
    const description = this.descriptionForm.get('description')?.value || '';
    return description.length;
  }

  saveAndExit(): void {
    if (!confirm('Save your progress and exit?')) return;

    this.isLoading.set(true);

    if (this.currentDraftId && this.descriptionForm.valid) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { description: this.descriptionForm.get('description')?.value },
        'description'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  showQuestionsModal(): void {
    alert('Share what makes your place special and unique!');
  }

  goBack(): void {
    this.router.navigate(['/host/properties/title']);
  }

  goNext(): void {
    if (!this.descriptionForm.valid) {
      alert(`Please enter a description (${this.minChars}-${this.maxChars} characters)`);
      return;
    }

    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { description: this.descriptionForm.get('description')?.value },
        'description'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/instant-book']);
        },
        error: (error) => {
          this.isLoading.set(false);
          alert('Failed to save: ' + error.message);
        }
      });
    }
  }
}
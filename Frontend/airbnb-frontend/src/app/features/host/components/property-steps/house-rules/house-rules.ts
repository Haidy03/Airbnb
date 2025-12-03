import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../services/property';

@Component({
  selector: 'app-house-rules',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './house-rules.html',
  styleUrls: ['./house-rules.css']
})
export class HouseRulesComponent implements OnInit {
  rulesForm!: FormGroup;
  isLoading = signal(false);
  currentDraftId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private propertyService: PropertyService
  ) {}

  ngOnInit() {
    this.initForm();
    this.getCurrentDraft();
  }

  initForm() {
    this.rulesForm = this.fb.group({
      checkInTime: ['15:00', Validators.required],
      checkOutTime: ['11:00', Validators.required],
      houseRules: ['']
    });
  }

  getCurrentDraft() {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          const formatTime = (t: any) => t ? String(t).substring(0, 5) : '';
          
          this.rulesForm.patchValue({
            checkInTime: formatTime(draft.houseRules?.checkInTime) || '15:00',
            checkOutTime: formatTime(draft.houseRules?.checkOutTime) || '11:00',
            houseRules: (draft as any).houseRules || '' 
          });
        },
        error: () => this.router.navigate(['/host/properties'])
      });
    }
  }

  goBack() {

    this.router.navigate(['/host/properties/pricing']);
  }

  goNext() {
    if (this.rulesForm.invalid) return;
    this.isLoading.set(true);

    if (this.currentDraftId) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        this.rulesForm.value,
        'house-rules'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
        
          this.router.navigate(['/host/properties/legal-and-create']);
        },
        error: (err) => {
          this.isLoading.set(false);
          alert('Failed to save rules');
        }
      });
    }
  }

 saveAndExit() {
 
    if (!confirm('Save your progress and exit?')) return;

    this.isLoading.set(true);

    if (this.currentDraftId) {
 
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        this.rulesForm.value, 
        'house-rules'       
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
        
          this.router.navigate(['/host/properties']);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error(error);
          alert('Failed to save: ' + (error.message || 'Unknown error'));
        }
      });
    } else {
   
      this.router.navigate(['/host/properties']);
    }
  }
  showQuestionsModal() {
    alert('Set clear expectations for your guests regarding arrival and departure.');
  }
}
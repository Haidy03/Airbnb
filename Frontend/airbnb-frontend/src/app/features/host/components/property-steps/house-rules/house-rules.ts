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
      // ✅ فقط الوقت
      checkInTime: ['15:00', Validators.required], 
      checkOutTime: ['11:00', Validators.required]
    });
  }

  getCurrentDraft() {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          const formatTime = (t: any) => t ? String(t).substring(0, 5) : '';
          const d = draft as any;
          
          // محاولة قراءة الوقت سواء كان Flat أو Nested
          const inTime = d.checkInTime || d.houseRules?.checkInTime;
          const outTime = d.checkOutTime || d.houseRules?.checkOutTime;
          
          this.rulesForm.patchValue({
            checkInTime: formatTime(inTime) || '15:00',
            checkOutTime: formatTime(outTime) || '11:00'
          });
        },
        error: (err) => {
          console.error('Error loading draft', err);
          this.router.navigate(['/host/properties']);
        }
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
      // إرسال التوقيتات فقط
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
          alert('Failed to save rules: ' + (err.error?.message || err.message));
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
          alert('Failed to save: ' + (error.message || 'Unknown error'));
        }
      });
    } else {
      this.router.navigate(['/host/properties']);
    }
  }

  showQuestionsModal() {
    alert('Set clear expectations for your guests regarding arrival and departure times.');
  }
}
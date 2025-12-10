import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { PropertyDraftService } from '../../../services/property-draft';
import { PropertyService } from '../../../services/property';
import { NotificationService } from '../../../../../core/services/notification.service';

interface PropertyTypeOption {
  id: number; 
  code: string;
  label: string;
  icon: string;
  description?: string;
  category?: string;
}

@Component({
  selector: 'app-property-type',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './property-type.html',
  styleUrls: ['./property-type.css']
})
export class PropertyTypeComponent implements OnInit {
 isLoading = signal(false);
  selectedType = signal<number | undefined>(undefined);
  loadingPropertyTypes = signal(false);
  
  propertyTypes: any[] = [];
  currentDraftId: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient, 
    private propertyService: PropertyService ,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPropertyTypes(); 
    this.loadSavedSelection(); 
    
    this.getCurrentDraft(); 
  }

    /**
   * Get current draft if exists
   */
  getCurrentDraft(): void {
    this.currentDraftId = localStorage.getItem('currentDraftId');
    
    if (this.currentDraftId) {
      this.propertyService.getDraftById(this.currentDraftId).subscribe({
        next: (draft) => {
          console.log('✅ Draft loaded:', draft);
          if (draft.propertyTypeId) {
            this.selectedType.set(draft.propertyTypeId);
          }
        },
        error: (error) => {
          console.error('Error loading draft:', error);
        }
      });
    }
  }

  
   /**
   * Load property types from backend
   */
  loadPropertyTypes(): void {
    this.loadingPropertyTypes.set(true);
    
    this.http.get<any[]>(`${environment.apiUrl}/PropertyTypes`)
      .subscribe({
        next: (types) => {
          console.log('✅ Property types loaded:', types);
          this.propertyTypes = types.map(t => ({
            id: t.id,
            code: t.code,
            label: t.name,
            icon: t.iconType,
            description: t.description,
            category: t.category
          }));
          this.loadingPropertyTypes.set(false);
        },
        error: (error) => {
          console.error('❌ Error loading property types:', error);
          this.loadingPropertyTypes.set(false);
        }
      });
  }

  /**
   * ✅ Load saved selection from localStorage
   */
  loadSavedSelection(): void {
    const saved = localStorage.getItem('property_type_id');
    if (saved) {
      this.selectedType.set(parseInt(saved));
    }
  }

  /**
   * Select property type
   */
  selectPropertyType(typeId: number): void {
    this.selectedType.set(typeId);
  }

  /**
   * Save and exit
   */
   async saveAndExit(): Promise<void> {
    const confirmed = await this.notificationService.confirmAction('Save & Exit?', 'Your progress will be saved.');
    if (!confirmed) return;

    this.isLoading.set(true);

    if (this.currentDraftId && this.selectedType()) {
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        {propertyTypeId: this.selectedType() },
        'property-type'
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
      this.router.navigate(['/host/properties']);
    }
  }


  showQuestionsModal(): void {
    this.notificationService.showToast('info', 'Contact support for help.'); 
  }


  goBack(): void {
    this.router.navigate(['/host/properties/intro']);
  }

  goNext(): void {
    
    if (!this.selectedType()) {
      this.notificationService.showError('Please select a property type to continue.');
      return;
    }

    this.isLoading.set(true);
    
    if (this.currentDraftId) {
    
      this.propertyService.updateDraftAtStep(
        this.currentDraftId,
        { propertyTypeId: this.selectedType() },
        'property-type'
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/host/properties/room-type']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.notificationService.showError('Failed to save: ' + error.message);
        }
      });
    } else {
      this.isLoading.set(false);
      this.router.navigate(['/host/properties/room-type']);
    }
  }

  
}
import { Component, OnInit, signal, inject } from '@angular/core'; // ✅ Added inject
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ExperienceService } from '../../../../../../shared/Services/experience.service';
import { Experience } from '../../../../../../shared/models/experience.model';
import { environment } from '../../../../../../../environments/environment';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  selector: 'app-host-experiences',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './host-experiences.component.html',
  styleUrls: ['./host-experiences.component.css']
})
export class HostExperiencesComponent implements OnInit {
  experiences = signal<Experience[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private notificationService = inject(NotificationService);

  constructor(
    private experienceService: ExperienceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExperiences();
  }

  loadExperiences(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.experienceService.getMyExperiences().subscribe({
      next: (response) => {
        if (response.success) {
          this.experiences.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading experiences:', error);
        this.error.set('Failed to load experiences');
        this.isLoading.set(false);
      }
    });
  }

  createExperience(): void {
    this.router.navigate(['/host/experiences/create']);
  }

  editExperience(id: number): void {
    this.router.navigate(['/host/experiences', id, 'edit']);
  }

  
  async deleteExperience(id: number): Promise<void> {
    const confirmed = await this.notificationService.confirmAction(
      'Delete Experience?',
      'Are you sure you want to delete this experience? This cannot be undone.',
      'Yes, delete'
    );

    if (!confirmed) return;

    this.experienceService.deleteExperience(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showToast('success', 'Experience deleted successfully');
          this.loadExperiences();
        }
      },
      error: (error) => {
        console.error('Error deleting experience:', error);
        this.notificationService.showError('Failed to delete experience'); 
      }
    });
  }

  submitForApproval(id: number): void {
    this.experienceService.submitForApproval(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showSuccess('Submitted!', 'Experience submitted for approval'); 
          this.loadExperiences();
        }
      },
      error: (error) => {
        console.error('Error submitting experience:', error);
        this.notificationService.showError(error.error?.message || 'Failed to submit experience');
      }
    });
  }

  activateExperience(id: number): void {
    this.experienceService.activateExperience(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.showToast('success', 'Experience activated');
          this.loadExperiences();
        }
      },
      error: (error) => {
        console.error('Error activating experience:', error);
        this.notificationService.showError('Failed to activate experience'); 
      }
    });
  }

  getImageUrl(imageUrl?: string): string {
    if (!imageUrl) return 'assets/images/placeholder-property.jpg';
    
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const baseUrl = environment.apiUrl.replace('/api', ''); 
    return `${baseUrl}${imageUrl}`;
  }

  getStatusBadgeClass(status: string): string {
    return this.experienceService.getStatusBadgeClass(status);
  }
}
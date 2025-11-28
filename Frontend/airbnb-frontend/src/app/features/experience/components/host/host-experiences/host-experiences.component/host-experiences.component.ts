import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ExperienceService } from '../../../../../../shared/Services/experience.service';
import { Experience } from '../../../../../../shared/models/experience.model';
import { environment } from '../../../../../../../environments/environment';

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

  deleteExperience(id: number): void {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    this.experienceService.deleteExperience(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadExperiences();
        }
      },
      error: (error) => {
        console.error('Error deleting experience:', error);
        alert('Failed to delete experience');
      }
    });
  }

  submitForApproval(id: number): void {
    this.experienceService.submitForApproval(id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Experience submitted for approval');
          this.loadExperiences();
        }
      },
      error: (error) => {
        console.error('Error submitting experience:', error);
        alert(error.error?.message || 'Failed to submit experience');
      }
    });
  }

  activateExperience(id: number): void {
    this.experienceService.activateExperience(id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Experience activated');
          this.loadExperiences();
        }
      },
      error: (error) => {
        console.error('Error activating experience:', error);
        alert('Failed to activate experience');
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
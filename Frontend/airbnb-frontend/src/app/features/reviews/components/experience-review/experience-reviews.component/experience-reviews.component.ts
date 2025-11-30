import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { ReviewCardComponent } from '../../../components/review-card/review-card.component'; // تأكدي من المسار
import { HeaderComponent } from '../../../../guest/components/header/header'; // اختياري لو عايزة هيدر

@Component({
  selector: 'app-experience-reviews',
  standalone: true,
  imports: [CommonModule, RouterModule, ReviewCardComponent, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="container">
      <div class="header-section">
        <h1>Experience Reviews</h1>
        <a [routerLink]="['/experiences', experienceId]" class="back-link">← Back to Experience</a>
      </div>

      <div *ngIf="loading()" class="loading">Loading reviews...</div>

      <div *ngIf="!loading() && reviews().length === 0" class="empty-state">
        No reviews yet for this experience.
      </div>

      <div class="reviews-grid">
        <app-review-card 
          *ngFor="let review of reviews()" 
          [review]="review"
          [showPropertyName]="false">
        </app-review-card>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 800px; margin: 40px auto; padding: 20px; }
    .header-section { margin-bottom: 30px; margin-top: 80px; }
    .back-link { color: #222; text-decoration: underline; font-weight: 600; }
    .loading { text-align: center; padding: 40px; }
    .reviews-grid { display: flex; flex-direction: column; gap: 20px; }
    .empty-state { text-align: center; color: #717171; padding: 40px; }
  `]
})
export class ExperienceReviewsComponent implements OnInit {
  experienceId!: number;
  reviews = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private experienceService: ExperienceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.experienceId = +this.route.snapshot.paramMap.get('id')!;
    this.loadReviews();
  }

  loadReviews(): void {
    this.experienceService.getReviews(this.experienceId).subscribe({
      next: (res: any) => {
        // حسب شكل الـ Response من الباك اند (مباشرة أو داخل data)
        const data = res.success ? res.data : res; 
        this.reviews.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading reviews', err);
        this.loading.set(false);
      }
    });
  }
}
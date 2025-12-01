import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../reviews/services/review.service'; 
import { HostReviewsData } from '../../../reviews/models/review.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-host-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './host-reviews.html',
  styleUrls: ['./host-reviews.css']
})
export class HostReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);

  stats = signal<HostReviewsData | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.reviewService.getHostReviews().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }
  getImageUrl(url?: string): string {
    if (!url) return 'assets/images/user.png'; // صورة افتراضية لو مفيش صورة
    
    if (url.startsWith('http')) return url; // لو رابط خارجي (جوجل مثلا)

    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    
    return `${baseUrl}${cleanPath}`;
  }
}
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { ExperienceSearchResult } from '../../../../../shared/models/experience.model';
import { ExperienceCardComponent } from '../../experience-card/experience-card.component/experience-card.component';
import { HeaderComponent } from "../../../../guest/components/header/header";
import { WishlistService } from '../../../../guest/services/wishlist.service';

@Component({
  selector: 'app-experiences-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ExperienceCardComponent, HeaderComponent],
  templateUrl: './experiences-home.component.html',
  styleUrls: ['./experiences-home.component.css']
})
export class ExperiencesHomeComponent implements OnInit {
  featuredExperiences = signal<ExperienceSearchResult[]>([]);
  popularExperiences = signal<ExperienceSearchResult[]>([]);
  parisExperiences = signal<ExperienceSearchResult[]>([]);
  londonExperiences = signal<ExperienceSearchResult[]>([]);
  
  isLoading = signal(true);
  error = signal<string | null>(null);
  

  private favoriteIds = new Set<number>();

  constructor(
    private experienceService: ExperienceService,
    private wishlistService: WishlistService 
  ) {}

    ngOnInit(): void {
    this.loadData();

    this.experienceService.getWishlist().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          res.data.forEach((item: any) => {
             if (item.id) {
               this.favoriteIds.add(Number(item.id));
             }
          });
          
          this.updateAllListsFavorites();
        }
      },
      error: (err) => console.error('Error loading wishlist', err)
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadFromAPI();
  }

 
  private mapFavorites(experiences: ExperienceSearchResult[]): ExperienceSearchResult[] {
    return experiences.map(exp => ({
      ...exp,
  
      isFavorite: this.favoriteIds.has(exp.id)
    }));
  }

  private updateAllListsFavorites() {
    this.featuredExperiences.update(list => this.mapFavorites(list));
    this.popularExperiences.update(list => this.mapFavorites(list));
    this.parisExperiences.update(list => this.mapFavorites(list));
    this.londonExperiences.update(list => this.mapFavorites(list));
  }

  private loadFromAPI(): void {
 
    this.experienceService.getFeaturedExperiences(8).subscribe({
      next: (res) => {
        if (res.success && res.data) {
    
          const mappedData = this.mapFavorites(res.data);
          this.featuredExperiences.set(mappedData);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });

  
     this.experienceService.searchExperiences({ sortBy: 'popular', pageSize: 12 }).subscribe({
      next: (res) => { 
        if (res.success) {
           const mappedData = this.mapFavorites(res.data);
            this.popularExperiences.set(mappedData);
        }
      }
    });
  
  }

  // Scroll functions...
  scrollLeft(id: string) { document.getElementById(id)?.scrollBy({ left: -620, behavior: 'smooth' }); }
  scrollRight(id: string) { document.getElementById(id)?.scrollBy({ left: 620, behavior: 'smooth' }); }
}
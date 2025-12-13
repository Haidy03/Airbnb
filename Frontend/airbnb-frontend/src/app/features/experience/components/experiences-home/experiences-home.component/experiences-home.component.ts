import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  
  private route = inject(ActivatedRoute);
  
  isLoading = signal(true);
  error = signal<string | null>(null);

  isSearching = signal(false);

  private favoriteIds = new Set<number>();

  constructor(
    private experienceService: ExperienceService,
    private wishlistService: WishlistService 
  ) {}

  ngOnInit(): void {
  
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


    this.route.queryParams.subscribe(params => {
   
      if (Object.keys(params).length > 0) {
        this.performSearch(params);
      } else {
      
        this.isSearching.set(false);
        this.loadData();
      }
    });
  }

  
  performSearch(params: any) {
    this.isLoading.set(true);
    this.isSearching.set(true);
    this.error.set(null);

    const searchDto: any = {};
    
    if (params['searchTerm']) searchDto.searchTerm = params['searchTerm']; 
    if (params['category']) searchDto.categoryId = Number(params['category']);
    
    if (params['duration']) searchDto.duration = Number(params['duration']);
    if (params['guests']) searchDto.guests = Number(params['guests']);
    if (params['location']) searchDto.location = params['location'];

    console.log('Sending Search DTO:', searchDto);
    this.experienceService.searchExperiences(searchDto).subscribe({
      next: (res) => {
        if (res.success) {
          const mappedData = this.mapFavorites(res.data);
          
         
          this.popularExperiences.set(mappedData);

         
          this.featuredExperiences.set([]);
          this.parisExperiences.set([]);
          this.londonExperiences.set([]);
        } else {
          this.popularExperiences.set([]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to search experiences.');
        this.isLoading.set(false);
      }
    });
  }


  loadData(): void {
    this.isLoading.set(true);
    this.isSearching.set(false);
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
    // 1. Featured Section
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

    // 2. Popular Section (Default when not searching specific query)
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
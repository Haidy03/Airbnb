import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExperienceService } from '../../../../../shared/Services/experience.service';
import { ExperienceSearchResult } from '../../../../../shared/models/experience.model';
import { ExperienceCardComponent } from '../../experience-card/experience-card.component/experience-card.component';
import { HeaderComponent } from "../../../../guest/components/header/header";

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

  constructor(private experienceService: ExperienceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    // Try to load from API
    this.loadFromAPI();
    
    // Fallback: Load mock data after 2 seconds if API fails
    setTimeout(() => {
      if (this.featuredExperiences().length === 0) {
        console.warn('API not responding, loading mock data...');
        this.loadMockData();
      }
    }, 2000);
  }

  private loadFromAPI(): void {
    // 1. Load Featured/Airbnb Originals
    this.experienceService.getFeaturedExperiences(8).subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.featuredExperiences.set(res.data);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading featured:', err);
        console.log('Will load mock data as fallback...');
      }
    });

    // 2. Load Popular Experiences
    this.experienceService.searchExperiences({ 
      sortBy: 'popular',
      pageSize: 12 
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.popularExperiences.set(res.data);
        }
      },
      error: (err) => console.error('Error loading popular:', err)
    });

    // 3. Load Paris Experiences
    this.experienceService.searchExperiences({ 
      location: 'Paris',
      pageSize: 8 
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.parisExperiences.set(res.data);
        }
      },
      error: (err) => console.error('Error loading Paris:', err)
    });

    // 4. Load London Experiences
    this.experienceService.searchExperiences({ 
      location: 'London',
      pageSize: 8 
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.londonExperiences.set(res.data);
        }
      },
      error: (err) => console.error('Error loading London:', err)
    });
  }

  private loadMockData(): void {
    console.log('Loading mock data as fallback...');
    const mockExperiences: ExperienceSearchResult[] = [
      {
        id: 1,
        title: 'Paris Food Tour with Local Chef',
        hostName: 'Marie Dubois',
        hostAvatar: 'https://i.pravatar.cc/150?img=1',
        categoryName: 'Food & Drink',
        type: 'InPerson',
        city: 'Paris',
        country: 'France',
        durationHours: 3,
        durationMinutes: 0,
        pricePerPerson: 75,
        averageRating: 4.9,
        totalReviews: 156,
        primaryImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=500&fit=crop',
        isAvailable: true
      },
      {
        id: 2,
        title: 'Virtual Cooking Class: Italian Pasta',
        hostName: 'Giovanni Rossi',
        hostAvatar: 'https://i.pravatar.cc/150?img=12',
        categoryName: 'Food & Drink',
        type: 'Online',
        city: 'Rome',
        country: 'Italy',
        durationHours: 2,
        durationMinutes: 30,
        pricePerPerson: 45,
        averageRating: 4.8,
        totalReviews: 203,
        primaryImage: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=500&fit=crop',
        isAvailable: true
      },
      {
        id: 3,
        title: 'Sunset Photography Walk in London',
        hostName: 'James Mitchell',
        hostAvatar: 'https://i.pravatar.cc/150?img=33',
        categoryName: 'Photography',
        type: 'InPerson',
        city: 'London',
        country: 'UK',
        durationHours: 2,
        durationMinutes: 0,
        pricePerPerson: 60,
        averageRating: 4.7,
        totalReviews: 89,
        primaryImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=500&fit=crop',
        isAvailable: true
      },
      {
        id: 4,
        title: 'Art Workshop: Watercolor Basics',
        hostName: 'Sophie Chen',
        hostAvatar: 'https://i.pravatar.cc/150?img=5',
        categoryName: 'Art & Culture',
        type: 'InPerson',
        city: 'Paris',
        country: 'France',
        durationHours: 3,
        durationMinutes: 0,
        pricePerPerson: 85,
        averageRating: 4.9,
        totalReviews: 124,
        primaryImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=500&fit=crop',
        isAvailable: true
      },
      {
        id: 5,
        title: 'London Street Food Adventure',
        hostName: 'Ahmed Hassan',
        hostAvatar: 'https://i.pravatar.cc/150?img=14',
        categoryName: 'Food & Drink',
        type: 'InPerson',
        city: 'London',
        country: 'UK',
        durationHours: 4,
        durationMinutes: 0,
        pricePerPerson: 70,
        averageRating: 4.8,
        totalReviews: 167,
        primaryImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=500&fit=crop',
        isAvailable: true
      },
      {
        id: 6,
        title: 'Personal Training Session',
        hostName: 'Mike Johnson',
        hostAvatar: 'https://i.pravatar.cc/150?img=52',
        categoryName: 'Training',
        type: 'InPerson',
        city: 'London',
        country: 'UK',
        durationHours: 1,
        durationMinutes: 30,
        pricePerPerson: 50,
        averageRating: 4.9,
        totalReviews: 201,
        primaryImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop',
        isAvailable: true
      },
      {
        id: 7,
        title: 'Spa & Massage Experience',
        hostName: 'Lisa Anderson',
        hostAvatar: 'https://i.pravatar.cc/150?img=9',
        categoryName: 'Spa treatments',
        type: 'InPerson',
        city: 'Paris',
        country: 'France',
        durationHours: 2,
        durationMinutes: 0,
        pricePerPerson: 120,
        averageRating: 5.0,
        totalReviews: 98,
        primaryImage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=500&fit=crop',
        isAvailable: true
      },
      {
        id: 8,
        title: 'Professional Makeup Session',
        hostName: 'Emma Watson',
        hostAvatar: 'https://i.pravatar.cc/150?img=10',
        categoryName: 'Makeup',
        type: 'InPerson',
        city: 'London',
        country: 'UK',
        durationHours: 2,
        durationMinutes: 30,
        pricePerPerson: 95,
        averageRating: 4.8,
        totalReviews: 142,
        primaryImage: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=500&fit=crop',
        isAvailable: true
      }
    ];

    this.featuredExperiences.set(mockExperiences);
    this.popularExperiences.set(mockExperiences);
    this.parisExperiences.set(mockExperiences.filter(e => e.city === 'Paris'));
    this.londonExperiences.set(mockExperiences.filter(e => e.city === 'London'));
    this.isLoading.set(false);
  }

  scrollLeft(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollBy({ left: -620, behavior: 'smooth' });
    }
  }

  scrollRight(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollBy({ left: 620, behavior: 'smooth' });
    }
  }
}
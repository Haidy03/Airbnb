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
  
  // Set لتسريع البحث عن الـ IDs
  private favoriteIds = new Set<number>();

  constructor(
    private experienceService: ExperienceService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    // 1. تحميل بيانات التجارب أولاً
    this.loadData();

    // 2. الاشتراك في "البث المباشر" للمفضلة
    // أي تغيير يحصل في المفضلة (إضافة/حذف) في أي مكان، الكود ده هيشتغل ويحدث القلوب هنا
    this.wishlistService.wishlist$.subscribe(wishlistItems => {
      this.favoriteIds.clear();
      wishlistItems.forEach(item => {
  // التحقق إذا كانت experienceId موجودة في item
  if ('experienceId' in item) {
      this.favoriteIds.add((item as any).experienceId);
  } else {
      this.favoriteIds.add(Number(item.id));
  }
});

      // إعادة تلوين القلوب في القوائم الموجودة حالياً
      this.updateAllListsFavorites();
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.loadFromAPI();
  }

  // دالة لتحديث خاصية isFavorite بناءً على القائمة الحالية للمفضلة
  private mapFavorites(experiences: ExperienceSearchResult[]): ExperienceSearchResult[] {
    return experiences.map(exp => ({
      ...exp,
      isFavorite: this.favoriteIds.has(exp.id)
    }));
  }

  // دالة لتحديث القوائم المعروضة حالياً (تستخدم عند تحميل البيانات أو تغير المفضلة)
  private updateAllListsFavorites() {
    this.featuredExperiences.update(list => this.mapFavorites(list));
    this.popularExperiences.update(list => this.mapFavorites(list));
    this.parisExperiences.update(list => this.mapFavorites(list));
    this.londonExperiences.update(list => this.mapFavorites(list));
  }

  private loadFromAPI(): void {
    // تحميل Featured
    this.experienceService.getFeaturedExperiences(8).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // نمرر البيانات لدالة mapFavorites عشان تاخد اللون الصح من البداية
          this.featuredExperiences.set(this.mapFavorites(res.data));
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });

    // باقي الـ APIs (Popular, Paris, London)...
    // فقط تأكدي من استخدام this.mapFavorites(res.data) قبل عمل set
    this.experienceService.searchExperiences({ sortBy: 'popular', pageSize: 12 }).subscribe({
      next: (res) => { if (res.success) this.popularExperiences.set(this.mapFavorites(res.data)); }
    });
    
    // ... ونفس الشيء لباقي الدوال
  }

  // Scroll functions...
  scrollLeft(id: string) { document.getElementById(id)?.scrollBy({ left: -620, behavior: 'smooth' }); }
  scrollRight(id: string) { document.getElementById(id)?.scrollBy({ left: 620, behavior: 'smooth' }); }
}
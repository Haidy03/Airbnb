import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Trip } from '../../models/user.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-past-trips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './past-trips.component.html',
  styleUrls: ['./past-trips.component.css']
})
export class PastTripsComponent implements OnInit {
  isLoading = true;
  completedStays: any[] = [];
  completedExperiences: any[] = [];

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.isLoading = true;
    this.userService.getPastTrips().subscribe({
      next: (data: any) => {
        const trips = Array.isArray(data) ? data : (data.data || []);
        
        console.log('🚀 API Data:', trips); // شوفي هنا بعد تعديل الباك اند

        const allCompleted = trips.filter((t: any) => 
          t.status && t.status.toLowerCase() === 'completed'
        );

        const mappedTrips = allCompleted.map((t: any) => {
          return {
            ...t,
            // ✅ هنا بنحاول نقرأ كل الاحتمالات اللي ممكن الباك اند يبعتها
            // لازم الباك اند يبعت واحد من دول
            realExperienceId: t.experienceId || t.experience?.id,
            realPropertyId: t.propertyId || t.property?.id,
            
            hostName: t.hostName || t.host?.firstName || 'Host',
            totalPrice: t.totalPrice || t.price || 0
          };
        });

        this.completedStays = mappedTrips.filter((t: any) => 
           t.type === 'Property' || (!t.type && !t.realExperienceId)
        );

        this.completedExperiences = mappedTrips.filter((t: any) => 
           t.type === 'Experience' || t.realExperienceId
        );

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  openDetails(trip: any) {
    if (trip.type === 'Experience' || trip.realExperienceId) {
      
      // ✅ نستخدم الـ ID الحقيقي للتجربة
      const targetId = trip.realExperienceId;

      if (targetId) {
        this.router.navigate(['/experiences', targetId]);
      } else {
        // لو مفيش ID تجربة، يبقى الباك اند لسه متعدلش
        console.error('❌ الخطأ: الباك اند لم يرسل experienceId', trip);
        alert('System Error: Missing Experience ID from server.');
      }

    } else {
      // ✅ نستخدم الـ ID الحقيقي للوحدة
      const targetId = trip.realPropertyId;
      
      if (targetId) {
        this.router.navigate(['/listing', targetId]);
      } else {
         console.error('❌ الخطأ: الباك اند لم يرسل propertyId', trip);
         alert('System Error: Missing Property ID from server.');
      }
    }
  }

  // ... (باقي الدوال getImageUrl, formatDate, getTitle كما هي)
  getImageUrl(trip: any): string {
    const img = trip.propertyImage || trip.experienceImage || trip.imageUrl || trip.image;
    if (!img) return 'assets/images/placeholder.jpg';
    if (img.startsWith('http') || img.includes('assets/')) return img;
    const baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
    return `${baseUrl}${img.startsWith('/') ? img : '/' + img}`;
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  getTitle(trip: any): string {
    return trip.propertyName || trip.title || trip.propertyTitle || trip.experienceTitle || 'Trip';
  }
}
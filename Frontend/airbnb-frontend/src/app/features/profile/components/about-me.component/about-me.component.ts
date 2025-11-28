import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router'; // ✅ 1. استيراد ActivatedRoute
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../services/user.service';
import { ProfileDetails } from '../../models/user.model';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-me.component.html',
  styleUrls: ['./about-me.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutMeComponent implements OnInit {
  // Services using inject() style (Best Practice)
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // ✅ لحل مشكلة الروابط

  // Signals
  user = this.authService.user; // البيانات الأساسية من الهيدر
  profileDetails = signal<ProfileDetails | null>(null); // ✅ البيانات التفصيلية

  ngOnInit() {
    this.loadProfileDetails();
  }

  loadProfileDetails() {
    this.userService.getProfileDetails().subscribe({
      next: (details) => {
        // ✅ 2. حل مشكلة الكاش للصورة هنا أيضاً
        if (details.profileImage) {
          // نفصل الرابط القديم عن أي وقت سابق ونضيف وقت جديد
          const cleanUrl = details.profileImage.split('?')[0];
          details.profileImage = `${cleanUrl}?t=${new Date().getTime()}`;
        }
        this.profileDetails.set(details);
      },
      error: (err) => console.error('Error fetching profile:', err)
    });
  }

  onEdit() {
    // ✅ 3. التنقل النسبي: يحافظ على الـ Layout (Host أو Guest)
    // نخرج خطوة للأعلى (..) ثم ندخل لـ edit-profile
    this.router.navigate(['../edit-profile'], { relativeTo: this.route });
  }

  onGetStarted() {
    this.onEdit();
  }
  
  // ✅ دالة مساعدة لعرض الحرف الأول لو مفيش صورة
  get userInitial(): string {
    const u = this.user();
    return u?.firstName ? u.firstName.charAt(0).toUpperCase() : 'U';
  }
}
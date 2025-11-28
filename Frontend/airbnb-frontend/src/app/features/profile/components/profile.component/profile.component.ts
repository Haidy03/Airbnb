import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // ✅ أضفنا RouterLink و RouterLinkActive
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ✅ القائمة بمسارات نسبية (بدون / في البداية)
  menuItems: MenuItem[] = [
    { icon: '🅰️', label: 'About me', route: 'about-me' },
    { icon: '✏️', label: 'Edit Profile', route: 'edit-profile' },
    { icon: '🧳', label: 'My trips', route: 'past-trips' }, 
    
  ];

  ngOnInit() {
    const url = this.router.url;
    if (url.endsWith('/profile') || url.endsWith('/profile/')) {
      this.router.navigate(['about-me'], { relativeTo: this.route });
    }
  }
}
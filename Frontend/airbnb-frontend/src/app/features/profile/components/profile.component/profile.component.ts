import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { NgFor } from '@angular/common'; 
interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [RouterOutlet , NgFor]
})
export class ProfileComponent implements OnInit {
  menuItems: MenuItem[] = [
    { icon: 'A', label: 'About me', route: 'about' },
    { icon: '🧳', label: 'Past trips', route: 'trips' },
    { icon: '👥', label: 'Connections', route: 'connections' }
  ];

  currentRoute: string = 'about';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Navigate to about by default
    if (this.router.url === '/profile' || this.router.url === '/profile/') {
      this.router.navigate(['about'], { relativeTo: this.route });
    }
  }

  navigateTo(route: string) {
    this.currentRoute = route;
    this.router.navigate([route], { relativeTo: this.route });
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}

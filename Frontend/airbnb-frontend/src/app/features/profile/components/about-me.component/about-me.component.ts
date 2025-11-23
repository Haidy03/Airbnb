import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Profile } from '../../models/user.model';

@Component({
  selector: 'app-about-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-me.component.html',
  styleUrls: ['./about-me.component.css']
})
export class AboutMeComponent implements OnInit {
  user:  Profile | null = null;
  isLoading = true;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.isLoading = true;
    this.userService.getCurrentUser().subscribe({
      next: (userData) => {
        this.user = userData;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.isLoading = false;
      }
    });
  }

  onEdit() {
    this.router.navigate(['/profile/edit']);
  }

  onGetStarted() {
    this.router.navigate(['/profile/edit']);
  }
}

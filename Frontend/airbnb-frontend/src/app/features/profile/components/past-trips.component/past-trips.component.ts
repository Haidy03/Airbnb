import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Trip } from '../../models/user.model';

@Component({
  selector: 'app-past-trips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './past-trips.component.html',
  styleUrls: ['./past-trips.component.css']
})
export class PastTripsComponent implements OnInit {
  trips: Trip[] = [];
  isLoading = true;

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
      next: (data) => {
        this.trips = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading trips:', err);
        this.isLoading = false;
      }
    });
  }

  openTrip(trip: Trip) {
    // Example: navigate to a trip detail route (adjust route as needed)
    this.router.navigate(['/profile/trips', trip.id]);
  }

  formatDate(date: Date | string) {
    const d = new Date(date);
    return d.toLocaleDateString();
  }
}

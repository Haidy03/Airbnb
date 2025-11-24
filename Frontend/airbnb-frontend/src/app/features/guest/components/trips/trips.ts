import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ مهم عشان routerLink يشتغل
import { HeaderComponent } from '../header/header';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  activeTab: 'upcoming' | 'past' | 'cancelled' = 'upcoming';

  ngOnInit(): void {}

  setActiveTab(tab: 'upcoming' | 'past' | 'cancelled') {
    this.activeTab = tab;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './trips.html',
  styleUrls: ['./trips.css']
})
export class TripsComponent implements OnInit {
  ngOnInit(): void {}
}

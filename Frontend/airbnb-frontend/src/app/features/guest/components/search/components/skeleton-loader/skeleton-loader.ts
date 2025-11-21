import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.html',
  styleUrl: './skeleton-loader.css'
})
export class SkeletonLoaderComponent {
  // Array to iterate over and display multiple skeleton cards
  skeletonCards = new Array(8);
}

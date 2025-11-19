// src/app/features/guest/components/search/components/property-card/property-card.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-card.html',
  styleUrls: ['./property-card.css']
})
export class PropertyCardComponent {
  @Input() property!: Property;
  @Input() isFavorite: boolean = false;
  @Output() favoriteToggle = new EventEmitter<string>();
  @Output() cardClick = new EventEmitter<Property>();

  currentImageIndex = 0;

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteToggle.emit(this.property.id);
  }

  onCardClick(): void {
    this.cardClick.emit(this.property);
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    if (this.property.images && this.property.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.property.images.length;
    }
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    if (this.property.images && this.property.images.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0
        ? this.property.images.length - 1
        : this.currentImageIndex - 1;
    }
  }

  goToImage(index: number, event: Event): void {
    event.stopPropagation();
    this.currentImageIndex = index;
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceCard } from '../../models/service.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-card.html',
  styleUrls: ['./service-card.css']
})
export class ServiceCardComponent {
  @Input() service!: ServiceCard;
  private baseUrl = environment.apiUrl.replace('/api', '').replace(/\/$/, '');
  getImageUrl(url: string | undefined | null): string {
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http') || url.startsWith('https')) {
       return url; 
    }
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${this.baseUrl}/${cleanPath}`;
  }
}
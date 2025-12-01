import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/service';
import { ServiceCard } from '../../models/service.model';
import { ServiceCardComponent } from '../../components/service-card/service-card';

@Component({
  selector: 'app-services-home',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent],
  templateUrl: './services-home.html'
})
export class ServicesHomeComponent implements OnInit {
  services: ServiceCard[] = [];
  isLoading = true;

  constructor(private servicesService: ServicesService) {}

  ngOnInit() {
    this.servicesService.getFeaturedServices().subscribe({
      next: (res) => {
        if (res.success) {
          this.services = res.data;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/service';
import { ServiceCard } from '../../models/service.model';
import { ServiceCardComponent } from '../service-card/service-card';
import { HeaderComponent } from '../../../guest/components/header/header'; // تأكدي من المسار

@Component({
  selector: 'app-services-home',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent, HeaderComponent],
  templateUrl: './services-home.html',
  styleUrls: ['./services-home.css']
})
export class ServicesHomeComponent implements OnInit {
  
  chefsList: ServiceCard[] = [];
  trainingList: ServiceCard[] = [];
  isLoading = true;

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    // 1. Fetch Chefs Data
    this.servicesService.getServicesByCategory('Chefs').subscribe({
      next: (res) => {
        if(res.success) this.chefsList = res.data;
      },
      error: (err) => console.error(err)
    });

    // 2. Fetch Training Data (وإنهاء التحميل)
    this.servicesService.getServicesByCategory('Training').subscribe({
      next: (res) => {
        if(res.success) this.trainingList = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}
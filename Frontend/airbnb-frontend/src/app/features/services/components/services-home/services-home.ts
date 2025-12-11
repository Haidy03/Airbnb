import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/service';
import { ServiceCard, ServiceCategory } from '../../models/service.model';
import { ServiceCardComponent } from '../../components/service-card/service-card';
import { forkJoin, map } from 'rxjs';

interface CategorySection {
  category: ServiceCategory;
  services: ServiceCard[];
}

@Component({
  selector: 'app-services-home',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent],
  templateUrl: './services-home.html',
  styleUrls: ['./services-home.css']
})
export class ServicesHomeComponent implements OnInit {

  categorySections: CategorySection[] = [];
  isLoading = true;

  private servicesService = inject(ServicesService);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

 
    this.servicesService.getAllCategories().subscribe({
      next: (res) => {
        if (res.success) {
          const categories = res.data;
          
         
          const requests = categories.map(cat => 
            this.servicesService.getServicesByCategory(cat.name).pipe(
              
              map(serviceRes => ({
                category: cat,
                services: serviceRes.data || [] 
              }))
            )
          );

          forkJoin(requests).subscribe({
            next: (results) => {
              this.categorySections = results.filter(section => section.services.length > 0);
              this.isLoading = false;
            },
            error: () => this.isLoading = false
          });
        } else {
          this.isLoading = false;
        }
      },
      error: () => this.isLoading = false
    });
  }


  scroll(container: HTMLElement, direction: 'left' | 'right') {
  const scrollAmount = container.clientWidth * 0.8;
  
  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}
}
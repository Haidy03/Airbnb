import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicesService } from '../../services/service'; 
import {ServiceCategory} from '../../models/service.model';

@Component({
  selector: 'app-create-service',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-service.html',
  styleUrls: ['./create-service.css']
})
export class CreateServiceComponent implements OnInit {
  // Signals لإدارة الحالة
  categories = signal<ServiceCategory[]>([]);
  isLoading = signal(true);
  selectedCategoryId = signal<number | null>(null);

  constructor(
    private servicesService: ServicesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories() {
    this.servicesService.getAllCategories().subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
        this.isLoading.set(false);
      }
    });
  }

  selectCategory(id: number) {
    this.selectedCategoryId.set(id);
  }

  goBack() {
    this.router.navigate(['/host/properties']); 
  }

  onNext() {
    if (this.selectedCategoryId()) {
      localStorage.setItem('draftServiceCategory', this.selectedCategoryId()!.toString());
      alert('Selected Category ID: ' + this.selectedCategoryId() + ' - Ready for next step!');
    }
  }
}
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router'; // ✅ Import ActivatedRoute
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
  
  // ✅ فلاتر البحث الحالية
  activeCategory: string | null = null;
  activeQuery: string | null = null;

  private servicesService = inject(ServicesService);
  private route = inject(ActivatedRoute); // ✅ Inject Route

  ngOnInit() {
    // ✅ الاستماع لتغييرات الـ URL
    this.route.queryParams.subscribe(params => {
      this.activeCategory = params['category'];
      this.activeQuery = params['q'];
      
      if (this.activeCategory || this.activeQuery) {
        this.loadFilteredData();
      } else {
        this.loadAllData();
      }
    });
  }

  // ✅ تحميل كل البيانات (الوضع الافتراضي)
  loadAllData() {
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

  // ✅ تحميل البيانات المفلترة (بحث)
  loadFilteredData() {
    this.isLoading = true;
    this.categorySections = [];

    // إذا تم تحديد فئة، نستخدم الـ Endpoint الخاص بها
    if (this.activeCategory) {
      this.servicesService.getServicesByCategory(this.activeCategory).subscribe({
        next: (res) => {
          let services = res.data || [];
          
          // تصفية إضافية بالاسم لو موجود
          if (this.activeQuery) {
            services = services.filter(s => 
              s.title.toLowerCase().includes(this.activeQuery!.toLowerCase())
            );
          }

          if (services.length > 0) {
            this.categorySections.push({
              category: { id: 0, name: this.activeCategory!, icon: '' },
              services: services
            });
          }
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
    } else {
      // إذا كان البحث بالاسم فقط، نحتاج لجلب كل الخدمات ثم الفلترة
      // (أو استخدام endpoint بحث مخصصة لو موجودة في الباك اند)
      // هنا سنستخدم الطريقة البسيطة: جلب الكل ثم الفلترة
      this.loadAllDataWithFilter();
    }
  }
  
  // دالة مساعدة للبحث بالاسم فقط عبر كل الفئات
  private loadAllDataWithFilter() {
    this.servicesService.getAllCategories().subscribe({
      next: (res) => {
        if (res.success) {
          const categories = res.data;
          const requests = categories.map(cat => 
            this.servicesService.getServicesByCategory(cat.name).pipe(
              map(serviceRes => {
                // فلترة الخدمات بالاسم
                const filteredServices = (serviceRes.data || []).filter(s => 
                  s.title.toLowerCase().includes(this.activeQuery!.toLowerCase())
                );
                return {
                  category: cat,
                  services: filteredServices
                };
              })
            )
          );

          forkJoin(requests).subscribe({
            next: (results) => {
              this.categorySections = results.filter(section => section.services.length > 0);
              this.isLoading = false;
            },
            error: () => this.isLoading = false
          });
        }
      }
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
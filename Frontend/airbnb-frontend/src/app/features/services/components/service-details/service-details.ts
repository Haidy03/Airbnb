import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../../services/service';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [CommonModule], // أزلنا FormsModule لأننا سنستخدم زر بسيط حالياً
  templateUrl: './service-details.html',
  styleUrls: ['./service-details.css']
})
export class ServiceDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private servicesService = inject(ServicesService);

  service: any = null;
  isLoading = true;

  // ✅ Mock Data to match the design (مؤقتاً للعرض)
  qualifications = [
    { icon: 'bi-trophy', title: '5 years of experience', desc: 'I prepared my first dish at 6 years old.' },
    { icon: 'bi-star', title: 'Mastered classic Roman dishes', desc: 'I mastered carbonara by 8 and saltimbocca.' },
    { icon: 'bi-mortarboard', title: 'Hands-on training', desc: 'I honed my skills in the kitchen, cooking.' }
  ];

  specialtiesImages = [
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?q=80&w=600',
    'https://images.unsplash.com/photo-1621356260656-76472251395b?q=80&w=600',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600'
  ];

  menuItems = [
    { title: 'Roman Dish Experience', desc: 'Enjoy the experience of a private chef at home.', price: 1927, img: 'https://images.unsplash.com/photo-1626844131082-256783844137?q=80&w=300' },
    { title: 'Base Menu – Flavors of Rome', desc: 'Private Roman Chef bringing the flavors of tradition.', price: 3578, img: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?q=80&w=300' },
    { title: 'Homemade Pasta and Dessert', desc: 'Learn the art of fresh pasta and traditional dessert.', price: 3578, img: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?q=80&w=300' }
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadService(Number(id));
    }
  }

  loadService(id: number) {
    this.servicesService.getServiceDetails(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.service = res.data;
        }
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }
}
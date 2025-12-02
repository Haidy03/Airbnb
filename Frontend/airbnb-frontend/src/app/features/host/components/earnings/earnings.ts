import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EarningsService } from '../../services/earnings';
import { EarningsDashboard } from '../../models/earnings.model';

@Component({
  selector: 'app-host-earnings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './earnings.html',
  styleUrls: ['./earnings.css']
})
export class HostEarningsComponent implements OnInit {
  private earningsService = inject(EarningsService);
  
  data = signal<EarningsDashboard | null>(null);
  isLoading = signal(true);

  // لحساب ارتفاع الأعمدة في الرسم البياني
  maxChartValue = computed(() => {
    const chart = this.data()?.chartData;
    if (!chart || chart.length === 0) return 100;
    return Math.max(...chart.map(c => c.amount)) || 100;
  });

  ngOnInit() {
    this.earningsService.getEarnings().subscribe({
      next: (res) => {
        console.log('Data from Backend:', res); 
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  // دالة مساعدة لحساب نسبة ارتفاع العمود
  getBarHeight(amount: number): string {
    const max = this.maxChartValue();
    const percentage = (amount / max) * 100;
    return `${Math.max(percentage, 2)}%`; // على الأقل 2% عشان يظهر
  }
}
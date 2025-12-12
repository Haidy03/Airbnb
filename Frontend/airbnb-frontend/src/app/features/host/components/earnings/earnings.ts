import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef, AfterViewInit, HostListener  } from '@angular/core';
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
  
  @ViewChild('chartScroll') chartScroll!: ElementRef;

  data = signal<EarningsDashboard | null>(null);
  isLoading = signal(true);
  selectedMonth = signal<string | null>(null);
  showScrollButtons = signal(false);
  fullChartData = signal<{month: string, amount: number}[]>([]);

  maxChartValue = computed(() => {
    const chart = this.fullChartData();
    if (!chart || chart.length === 0) return 100;
    return Math.max(...chart.map(c => c.amount)) || 100;
  });

  filteredTransactions = computed(() => {
    const all = this.data()?.recentTransactions || [];
    const month = this.selectedMonth();
    if (!month) return all; 

    return all.filter(t => {
      const transDate = new Date(t.date);
      const transMonthName = transDate.toLocaleString('default', { month: 'short' });
      return transMonthName === month;
    });
  });

  ngOnInit() {
    this.earningsService.getEarnings().subscribe({
      next: (res) => {
        this.data.set(res);
        this.prepareFullYearData(res.chartData);
        this.isLoading.set(false);
        
        setTimeout(() => this.checkScroll(), 100);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScroll();
  }

  checkScroll() {
    if (this.chartScroll?.nativeElement) {
      const el = this.chartScroll.nativeElement;
      const hasOverflow = el.scrollWidth > el.clientWidth;
      this.showScrollButtons.set(hasOverflow);
    }
  }

  prepareFullYearData(apiData: {month: string, amount: number}[]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const fullData = months.map(monthName => {
      const found = apiData.find(d => d.month === monthName);
      return {
        month: monthName,
        amount: found ? found.amount : 0 
      };
    });

    this.fullChartData.set(fullData);
  }

  getBarHeight(amount: number): string {
    const max = this.maxChartValue();
    const percentage = (amount / max) * 100;
    return `${Math.max(percentage, 1)}%`; 
  }

  selectMonth(month: string) {
    if (this.selectedMonth() === month) {
      this.selectedMonth.set(null); 
    } else {
      this.selectedMonth.set(month);
    }
  }

  scrollLeft() {
    this.chartScroll.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight() {
    this.chartScroll.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }

  scrollToEnd() {
     if(this.chartScroll) {
         this.chartScroll.nativeElement.scrollLeft = this.chartScroll.nativeElement.scrollWidth;
     }
  }
}
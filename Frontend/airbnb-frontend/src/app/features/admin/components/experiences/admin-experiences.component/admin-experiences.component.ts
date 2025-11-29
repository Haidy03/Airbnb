import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

// ✅ تعريف Interface سريع للتجربة داخل الأدمن
interface AdminExperience {
  id: number;
  title: string;
  hostName: string;
  categoryName: string;
  status: string;
  pricePerPerson: number;
  city: string;
  country: string;
  totalBookings: number;
  averageRating: number;
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  images: any[];
}

@Component({
  selector: 'app-admin-experiences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-experiences.component.html',
  styleUrls: ['./admin-experiences.component.css']
})
export class AdminExperiencesComponent implements OnInit {
  experiences = signal<AdminExperience[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // ✅ الفلاتر مثل صفحة Properties
  selectedStatus = signal<string>('PendingApproval');
  searchTerm = signal<string>('');
  pageNumber = signal(1);
  pageSize = 10;

  // ✅ Modal States
  selectedExperience = signal<AdminExperience | null>(null);
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showDeleteModal = signal(false);
  rejectionReason = signal('');

  private apiUrl = `${environment.apiUrl}/admin/experiences`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadExperiences();
  }

  // ✅ دالة التحميل مع الفلاتر
  loadExperiences(): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('pageNumber', this.pageNumber().toString())
      .set('pageSize', this.pageSize.toString());

    // إرسال الحالة إذا لم تكن All
    if (this.selectedStatus() !== 'All') {
      params = params.set('status', this.selectedStatus());
    }

    if (this.searchTerm()) {
      params = params.set('searchTerm', this.searchTerm());
    }

    this.http.get<AdminExperience[]>(this.apiUrl, { params }).subscribe({
      next: (data) => {
        this.experiences.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load experiences');
        this.loading.set(false);
      }
    });
  }

  // ✅ تغيير التاب (Status)
  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.pageNumber.set(1);
    this.loadExperiences();
  }

  // ✅ البحث
  onSearch(): void {
    this.pageNumber.set(1);
    this.loadExperiences();
  }

  // --- Actions ---

  openApproveModal(exp: AdminExperience): void {
    this.selectedExperience.set(exp);
    this.showApproveModal.set(true);
  }

  closeApproveModal(): void {
    this.showApproveModal.set(false);
    this.selectedExperience.set(null);
  }

  approveExperience(): void {
    const exp = this.selectedExperience();
    if (!exp) return;

    this.http.post(`${this.apiUrl}/${exp.id}/approve`, {}).subscribe({
      next: () => {
        this.loadExperiences();
        this.closeApproveModal();
        alert('Experience approved successfully');
      },
      error: () => alert('Error approving experience')
    });
  }

  openRejectModal(exp: AdminExperience): void {
    this.selectedExperience.set(exp);
    this.showRejectModal.set(true);
    this.rejectionReason.set('');
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedExperience.set(null);
    this.rejectionReason.set('');
  }

  rejectExperience(): void {
    const exp = this.selectedExperience();
    if (!exp || !this.rejectionReason().trim()) return;

    this.http.post(`${this.apiUrl}/${exp.id}/reject`, {
      rejectionReason: this.rejectionReason()
    }).subscribe({
      next: () => {
        this.loadExperiences();
        this.closeRejectModal();
        alert('Experience rejected');
      },
      error: () => alert('Error rejecting experience')
    });
  }

  // --- Helpers ---

  getStatusBadgeClass(status: string): string {
    const map: {[key: string]: string} = {
      'PendingApproval': 'pending',
      'Approved': 'approved',
      'Rejected': 'rejected',
      'Draft': 'draft',
      'Active': 'active'
    };
    return map[status] || 'default';
  }

  formatCurrency(amount: number): string {
    return `$${amount}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  getImageUrl(url: string): string {
    if (!url) return 'assets/placeholder.jpg';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  // Pagination (Simple)
  nextPage() { this.pageNumber.update(v => v + 1); this.loadExperiences(); }
  previousPage() { if(this.pageNumber() > 1) { this.pageNumber.update(v => v - 1); this.loadExperiences(); } }
}
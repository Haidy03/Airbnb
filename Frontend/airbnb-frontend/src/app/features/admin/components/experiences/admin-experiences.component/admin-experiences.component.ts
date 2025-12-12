import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { AdminService } from '../../../serevices/admin.service'; 

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
  
  selectedStatus = signal<string>('PendingApproval');
  searchTerm = signal<string>('');
  pageNumber = signal(1);
  pageSize = 10;

  selectedExperience = signal<AdminExperience | null>(null);
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  showDeleteModal = signal(false);
  rejectionReason = signal('');

  private apiUrl = `${environment.apiUrl}/admin/experiences`;

  constructor(private http: HttpClient, private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadExperiences();
  }

  loadExperiences(): void {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('pageNumber', this.pageNumber().toString())
      .set('pageSize', this.pageSize.toString());

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
      error: (err: any) => { 
        console.error(err);
        this.error.set('Failed to load experiences');
        this.loading.set(false);
      }
    });
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.pageNumber.set(1);
    this.loadExperiences();
  }

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
        this.showNotification('Experience approved successfully');
      },
      error: () => this.showNotification('Error approving experience', 'error')
    });
  }

  moveToPending(exp: AdminExperience): void {
    if(!confirm('Are you sure you want to move this experience back to pending approval?')) return;

    this.adminService.updateExperienceStatus(exp.id, 'PendingApproval').subscribe({
      next: () => {
        this.loadExperiences();
        this.showNotification('Experience moved to pending successfully');
      },
      error: (err: any) => { 
        console.error(err);
        this.showNotification('Failed to update status', 'error');
      }
    });
  }

  openDeleteModal(exp: AdminExperience): void {
    this.selectedExperience.set(exp);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedExperience.set(null);
  }

  deleteExperience(): void {
    const exp = this.selectedExperience();
    if (!exp) return;

    this.adminService.deleteExperience(exp.id).subscribe({
      next: () => {
        this.loadExperiences();
        this.closeDeleteModal();
        this.showNotification('Experience deleted successfully');
      },
      error: (err: any) => {
        console.error(err);
        this.showNotification('Failed to delete experience', 'error');
      }
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
        this.showNotification('Experience rejected');
      },
      error: () => this.showNotification('Error rejecting experience', 'error')
    });
  }

  // --- Helpers ---

  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message); // Simple alert for now, can be replaced with Toastr
  }

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
    if (!url) return 'assets/images/placeholder.jpg';
    if (url.startsWith('http')) return url;
    if (url.includes('assets/')) return url;
    return `${environment.apiUrl.replace('/api', '')}${url}`;
  }

  nextPage() { this.pageNumber.update(v => v + 1); this.loadExperiences(); }
  previousPage() { if(this.pageNumber() > 1) { this.pageNumber.update(v => v - 1); this.loadExperiences(); } 
}


toggleSuspension(exp: AdminExperience): void {
    // تحديد الحالة الجديدة بناءً على الحالة الحالية
    const isSuspended = exp.status === 'Suspended';
    const newStatus = isSuspended ? 'Active' : 'Suspended';
    const actionText = isSuspended ? 'unsuspend' : 'suspend';

    if (!confirm(`Are you sure you want to ${actionText} this experience?`)) return;

    this.adminService.updateExperienceStatus(exp.id, newStatus).subscribe({
      next: () => {
        this.showNotification(`Experience ${actionText}ed successfully`);
        this.loadExperiences(); // إعادة تحميل القائمة لتحديث الواجهة
      },
      error: (err: any) => {
        console.error(err);
        this.showNotification(`Failed to ${actionText} experience`, 'error');
      }
    });
  }
}
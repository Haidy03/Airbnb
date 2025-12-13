import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../serevices/admin.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AdminUser } from '../../../models/admin.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Filters
  selectedRole = signal<string>('all');
  searchTerm = signal<string>('');
  pageNumber = signal(1);
  pageSize = 10;

  // Modal states
  selectedUser = signal<AdminUser | null>(null);
  showBlockModal = signal(false);
  showDeleteModal = signal(false);
  blockReason = signal('');

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const role = this.selectedRole() === 'all' ? undefined : this.selectedRole();
    const search = this.searchTerm() || undefined;

    this.adminService.getAllUsers(role, search, this.pageNumber(), this.pageSize)
      .subscribe({
        next: (data) => {
          this.users.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load users');
          this.loading.set(false);
          console.error('Error loading users:', err);
          this.notificationService.showToast('error', 'Failed to load users');
        }
      });
  }

  onRoleChange(role: string): void {
    this.selectedRole.set(role);
    this.pageNumber.set(1);
    this.loadUsers();
  }

  onSearch(): void {
    this.pageNumber.set(1);
    this.loadUsers();
  }

  toggleUserStatus(user: AdminUser): void {
    const newStatus = !user.isActive;
    this.adminService.updateUserStatus(user.id, newStatus)
      .subscribe({
        next: () => {
          user.isActive = newStatus;
          const msg = `User ${newStatus ? 'activated' : 'deactivated'} successfully`;
          this.notificationService.showToast('success', msg);
        },
        error: (err) => {
          console.error('Error updating user status:', err);
          this.notificationService.showToast('error', 'Failed to update user status');
        }
      });
  }

  openBlockModal(user: AdminUser): void {
    this.selectedUser.set(user);
    this.showBlockModal.set(true);
    this.blockReason.set('');
  }

  closeBlockModal(): void {
    this.showBlockModal.set(false);
    this.selectedUser.set(null);
    this.blockReason.set('');
  }

  blockUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    if (user.isBlocked) {
      // Unblock Logic
      this.adminService.unblockUser(user.id).subscribe({
        next: () => {
          user.isBlocked = false;
          user.isActive = true;
          user.blockReason = undefined;
          this.closeBlockModal();
          this.notificationService.showSuccess('Unblocked', 'User unblocked successfully');
        },
        error: (err) => {
          console.error('Error unblocking user:', err);
          this.notificationService.showToast('error', 'Failed to unblock user');
        }
      });

    } else {
      // Block Logic
      if (!this.blockReason().trim()) {
        this.notificationService.showToast('warning', 'Please provide a reason for blocking');
        return;
      }

      this.adminService.blockUser(user.id, this.blockReason()).subscribe({
        next: () => {
          user.isBlocked = true;
          user.isActive = false;
          user.blockReason = this.blockReason();
          this.closeBlockModal();
          this.notificationService.showSuccess('Blocked', 'User blocked successfully');
        },
        error: (err) => {
          console.error('Error blocking user:', err);
          this.notificationService.showToast('error', 'Failed to block user');
        }
      });
    }
  }

  openDeleteModal(user: AdminUser): void {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
  }

  deleteUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        const currentUsers = this.users();
        this.users.set(currentUsers.filter(u => u.id !== user.id));
        this.closeDeleteModal();
        this.notificationService.showSuccess('Deleted', 'User deleted successfully');
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.notificationService.showToast('error', 'Failed to delete user');
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    return role.toLowerCase();
  }

  getStatusBadgeClass(user: AdminUser): string {
    if (user.isBlocked) return 'blocked';
    if (!user.isActive) return 'inactive';
    if (user.isVerified) return 'verified';
    return 'active';
  }

  getStatusText(user: AdminUser): string {
    if (user.isBlocked) return 'Blocked';
    if (!user.isActive) return 'Inactive';
    if (user.isVerified) return 'Verified';
    return 'Active';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  nextPage(): void {
    this.pageNumber.set(this.pageNumber() + 1);
    this.loadUsers();
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.set(this.pageNumber() - 1);
      this.loadUsers();
    }
  }
}
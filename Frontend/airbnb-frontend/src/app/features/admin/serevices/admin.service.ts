import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DashboardStats,
  AdminUser,
  VerificationRequest,
  AdminProperty,
  AdminBooking,
  AdminDispute,
  RevenueReport,
  UserActivityReport,
  OccupancyReport,
  AdminServiceItem 
} from '../models/admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Dashboard & Analytics
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  getRevenueReport(startDate: Date, endDate: Date): Observable<RevenueReport> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    return this.http.get<RevenueReport>(`${this.apiUrl}/analytics/revenue`, { params });
  }

  getUserActivityReport(startDate: Date, endDate: Date): Observable<UserActivityReport> {
    const params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());
    return this.http.get<UserActivityReport>(`${this.apiUrl}/analytics/user-activity`, { params });
  }

  getOccupancyReport(): Observable<OccupancyReport> {
    return this.http.get<OccupancyReport>(`${this.apiUrl}/analytics/occupancy`);
  }

  // User Management
  getAllUsers(role?: string, searchTerm?: string, pageNumber = 1, pageSize = 10): Observable<AdminUser[]> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    if (role) params = params.set('role', role);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`, { params });
  }

  getUserById(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${userId}`);
  }

  updateUserStatus(userId: string, isActive: boolean, reason?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/status`, { isActive, reason });
  }

  blockUser(userId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/block`, { isBlocked: true, reason });
  }

  unblockUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/unblock`, {});
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // Verification Management
  getPendingVerifications(): Observable<VerificationRequest[]> {
    return this.http.get<VerificationRequest[]>(`${this.apiUrl}/verifications/pending`);
  }

  getAllVerifications(status?: string): Observable<VerificationRequest[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<VerificationRequest[]>(`${this.apiUrl}/verifications`, { params });
  }

  getVerificationById(verificationId: number): Observable<VerificationRequest> {
    return this.http.get<VerificationRequest>(`${this.apiUrl}/verifications/${verificationId}`);
  }

  approveVerification(verificationId: number, adminNotes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verifications/${verificationId}/approve`, { adminNotes });
  }

  rejectVerification(verificationId: number, rejectionReason: string, adminNotes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verifications/${verificationId}/reject`, { 
      rejectionReason, 
      adminNotes 
    });
  }

  // Property Management
  getAllProperties(status?: string, searchTerm?: string, pageNumber = 1, pageSize = 10): Observable<AdminProperty[]> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    if (status) params = params.set('status', status);
    if (searchTerm) params = params.set('searchTerm', searchTerm);

    return this.http.get<AdminProperty[]>(`${this.apiUrl}/properties`, { params });
  }

  getPropertyById(propertyId: number): Observable<AdminProperty> {
    return this.http.get<AdminProperty>(`${this.apiUrl}/properties/${propertyId}`);
  }

  approveProperty(propertyId: number, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/properties/${propertyId}/approve`, { notes });
  }

  rejectProperty(propertyId: number, rejectionReason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/properties/${propertyId}/reject`, { rejectionReason });
  }

  updatePropertyStatus(propertyId: number, status: string, reason?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/properties/${propertyId}/status`, { status, reason });
  }

  deleteProperty(propertyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/properties/${propertyId}`);
  }

  // Bookings Management
  getAllBookings(status?: string, startDate?: Date, endDate?: Date, pageNumber = 1, pageSize = 10): Observable<AdminBooking[]> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    if (status) params = params.set('status', status);
    if (startDate) params = params.set('startDate', startDate.toISOString());
    if (endDate) params = params.set('endDate', endDate.toISOString());

    return this.http.get<AdminBooking[]>(`${this.apiUrl}/bookings`, { params });
  }

  cancelBooking(bookingId: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/cancel`, { reason });
  }

  refundBooking(bookingId: number, refundAmount: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/refund`, { refundAmount, reason });
  }

  // Disputes Management
  getAllDisputes(status?: string): Observable<AdminDispute[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<AdminDispute[]>(`${this.apiUrl}/disputes`, { params });
  }

  getDisputeById(disputeId: number): Observable<AdminDispute> {
    return this.http.get<AdminDispute>(`${this.apiUrl}/disputes/${disputeId}`);
  }

  resolveDispute(disputeId: number, resolution: string, adminResponse?: string, refundAmount?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/disputes/${disputeId}/resolve`, {
      resolution,
      adminResponse,
      refundAmount
    });
  }

  closeDispute(disputeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/disputes/${disputeId}/close`, {});
  }

  // Reviews Management
  getAllReviews(pageNumber = 1, pageSize = 10): Observable<any[]> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any[]>(`${this.apiUrl}/reviews`, { params });
  }

  getFlaggedReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reviews/flagged`);
  }

  deleteReview(reviewId: number, reason: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reviews/${reviewId}`, {
      params: new HttpParams().set('reason', reason)
    });
  }
  updateExperienceStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/experiences/${id}/status`, { status });
  }

  // دالة حذف التجربة
  deleteExperience(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/experiences/${id}`);
  }
   // ==========================================
  // ✅ SERVICES MANAGEMENT (NEW)
  // ==========================================

  // جلب الخدمات المعلقة (للموافقة)
  getPendingServices(): Observable<any> { // الباك إند بيرجع { success: true, data: [...] }
    return this.http.get(`${this.apiUrl}/services/pending`);
  }

  // الموافقة على الخدمة
  approveService(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/services/${id}/approve`, {});
  }

  // رفض الخدمة
  rejectService(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/services/${id}/reject`, { reason });
  }

  // Settings
  getSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings`, settings);
  }

  // Profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profile);
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, data);
  }
}
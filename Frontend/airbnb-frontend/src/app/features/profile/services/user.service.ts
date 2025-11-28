import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs'; // ❌ أزلنا of و delay
import { map, catchError } from 'rxjs/operators';
import { ProfileDetails, Trip, Connection } from '../models/user.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // تأكدي أن هذا الرابط مطابق للباك إند عندك
  private apiUrl = 'https://localhost:5202/api'; 
  private readonly API_BASE_URL = 'https://localhost:5202/';

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  
  private transformUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // إزالة السلاش في البداية لتجنب الازدواج //
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const cleanBase = this.API_BASE_URL.endsWith('/') ? this.API_BASE_URL : `${this.API_BASE_URL}/`;
    return `${cleanBase}${cleanPath}`;
  }

  getCurrentUser(): Observable<{success: boolean; data: any[]; initial: string}> {
    const currentAuthUser = this.authService.currentUser;
    if (!currentAuthUser) {
      return throwError(() => new Error('No authenticated user'));
    }

    const fullName = currentAuthUser.fullName || 
                     (currentAuthUser.firstName && currentAuthUser.lastName 
                       ? `${currentAuthUser.firstName} ${currentAuthUser.lastName}` 
                       : currentAuthUser.email?.split('@')[0] || 'User');
    
    const initial = currentAuthUser.firstName 
                    ? currentAuthUser.firstName.charAt(0).toUpperCase()
                    : fullName.charAt(0).toUpperCase();

     return this.http.get<any>(
      `${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(user => {
        // التعامل مع اختلاف المسميات (Backend DTO sends ProfileImageUrl)
        const rawPic = user.profileImageUrl || user.profileImage || user.profilePicture;
        
        return {
          ...user,
          profileImage: this.transformUrl(rawPic), 
          profilePicture: this.transformUrl(rawPic),
          initial: initial
        };
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ التعديل الأهم هنا: تفعيل الاتصال الحقيقي
  getProfileDetails(): Observable<ProfileDetails> {
    return this.http.get<any>(`${this.apiUrl}/Auth/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(data => {
        // 1. تحويل رابط الصورة ليظهر بشكل صحيح
        // ملاحظة: الـ DTO في الباك إند يرسل ProfileImageUrl (PascalCase)
        // أو profileImageUrl (camelCase) حسب إعدادات الـ JSON
        let imgUrl = data.profileImageUrl || data.profileImage;
        
        if (imgUrl) {
          imgUrl = this.transformUrl(imgUrl);
        }

        // 2. تجميع البيانات
        // ندمج الـ FunFacts (لو موجودة) مع البيانات الأساسية لتظهر في الفورم
        return {
          ...data,
          ...(data.funFacts || {}), // فك الأسئلة الإضافية
          profileImage: imgUrl,     // تعيين الرابط الكامل
          // تأكيد تعيين الأسماء لضمان ظهورها
          firstName: data.firstName,
          lastName: data.lastName,
          aboutMe: data.bio || data.aboutMe, // Bio من الباك إند = AboutMe في الفرونت
          whereILive: data.city || data.whereILive // City من الباك إند = WhereILive في الفرونت
        } as ProfileDetails;
      }),
      catchError(error => {
        console.error('Error fetching profile details:', error);
        return throwError(() => error);
      })
    );
  }

  // ✅ التعديل هنا: تفعيل الحفظ الحقيقي
  updateProfileDetails(details: ProfileDetails): Observable<ProfileDetails> {
    
    // تحويل البيانات لتناسب الـ DTO في الباك إند (اختياري، لو الأسماء متطابقة لا مشكلة)
    const payload = {
        ...details,
        bio: details.aboutMe, // Mapping Frontend 'aboutMe' to Backend 'Bio'
        city: details.whereILive // Mapping Frontend 'whereILive' to Backend 'City'
    };

    return this.http.put<ProfileDetails>(
      `${this.apiUrl}/Auth/profile`, 
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        console.error('Error updating profile:', error);
        return throwError(() => error);
      })
    );
  }

  uploadProfileImage(file: File): Observable<{url: string}> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<{url: string, message: string}>(
      `${this.apiUrl}/Auth/upload-photo`, 
      formData,
      { headers }
    ).pipe(
       map(response => {
        // نرجع الرابط نظيف (بدون transformUrl هنا) لأننا نحتاجه نظيفاً للحفظ في الداتا بيز
        // التحويل للعرض يتم في الكومبوننت أو عند القراءة
        return { 
          url: response.url 
        };
       }),
      catchError(error => {
        console.error('Error uploading image:', error);
        return throwError(() => error);
      })
    );
  }

  getPastTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/Booking/my-trips`, {
      headers: this.getAuthHeaders()
    });
  }

  getConnections(): Observable<Connection[]> {
    // يمكن تفعيلها لاحقاً
    return throwError(() => new Error('Not implemented'));
  }
}
// services/error.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  private router = inject(Router);

  handleError(error: HttpErrorResponse): void {
    console.error('❌ Error occurred:', error);

    if (error.status === 401) {
      // Unauthorized - redirect to login
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    } else if (error.status === 403) {
      // Forbidden - show access denied message
      // يمكنك استخدام خدمة للإشعارات أو عرض رسالة في المكون
      console.error('Access denied');
    } else if (error.status === 0) {
      // Network error
      console.error('Network error - please check your connection');
    } else {
      // Other errors
      console.error('An error occurred:', error.message);
    }
  }
}
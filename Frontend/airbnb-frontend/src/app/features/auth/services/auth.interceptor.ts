// auth.interceptor.ts
import { HttpInterceptorFn , HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ErrorService } from '../services/error.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ✅ FIXED: Get token from correct key
  const token = localStorage.getItem('token');
  const errorService = inject(ErrorService);
  // ✅ Skip adding token for auth endpoints
  const isAuthEndpoint = req.url.includes('/Auth/login') || 
                         req.url.includes('/Auth/register'); ;

  // If there's a token and it's not an auth endpoint, add Authorization header
  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('🔐 Added auth token to request:', req.url);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // ✅ Handle errors centrally
      errorService.handleError(error);
      return throwError(() => error);
    })
  );;
};
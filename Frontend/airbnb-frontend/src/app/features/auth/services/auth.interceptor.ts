import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ✅ FIXED: Get token from correct key
  const token = localStorage.getItem('token');

  // ✅ Skip adding token for auth endpoints
  const isAuthEndpoint = req.url.includes('/Auth/login') || 
                         req.url.includes('/Auth/register') ||
                         req.url.includes('/Auth/phone/start');

  // If there's a token and it's not an auth endpoint, add Authorization header
  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('🔐 Added auth token to request:', req.url);
  }

  return next(req);
};
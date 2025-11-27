import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service'; // ✅ استيراد TokenService

// ✅ Auth Guard - Protects routes that require authentication
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService); // ✅ حقن TokenService
  const router = inject(Router);

  console.log('🔒 Auth Guard - Checking authentication...');
  
  const token = authService.getToken();
  
  // ✅ التحقق من وجود التوكن وعدم انتهاء صلاحيته
  if (!token || tokenService.isTokenExpired(token)) {
    console.log('❌ Auth Guard - Token is missing or expired');
    authService.logout(); // تنظيف التوكن المنتهي
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: router.url }
    });
  }

  console.log('✅ Auth Guard - User is authenticated');
  return true;
};

// ✅ No Auth Guard - Redirects authenticated users away from login pages
export const noAuthGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService); // ✅ حقن TokenService
  const router = inject(Router);

  console.log('🔓 No Auth Guard - Checking if user is already logged in...');

  const token = authService.getToken();
  
  if (!token || tokenService.isTokenExpired(token)) {
    console.log('✅ No Auth Guard - User is NOT authenticated, allowing access to login');
    return true;
  }

  // ✅ استخدام TokenService لاستخراج الـ role
  const userRole = tokenService.getUserRole(token);

  console.log('👤 No Auth Guard - User is authenticated, role:', userRole);

  // Redirect based on role
  if (userRole === 'admin') {
    console.log('🔄 Redirecting Admin to /admin/dashboard');
    return router.createUrlTree(['/admin/dashboard']);
  } else if (userRole === 'host') {
    console.log('🔄 Redirecting Host to /host/dashboard');
    return router.createUrlTree(['/host/dashboard']);
  } else {
    console.log('🔄 Redirecting Guest to /');
    return router.createUrlTree(['/']);
  }
};

// ✅ Host Guard - Only allows Hosts to access
export const hostGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService); // ✅ حقن TokenService
  const router = inject(Router);

  console.log('🏠 Host Guard - Checking if user is Host...');

  const token = authService.getToken();
  
  if (!token || tokenService.isTokenExpired(token)) {
    console.log('❌ Host Guard - User not authenticated, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  // ✅ استخدام TokenService لاستخراج الـ role
  const userRole = tokenService.getUserRole(token);

  console.log('👤 Host Guard - User role:', userRole);

  // if (userRole === 'host')
   if(userRole.includes('host'))  {
    console.log('✅ Host Guard - User is Host, allowing access');
    return true;
  }

  // Redirect based on role
  if (userRole === 'admin') {
    console.log('🔄 Host Guard - User is Admin, redirecting to admin dashboard');
    return router.createUrlTree(['/admin/dashboard']);
  } else {
    console.log('🔄 Host Guard - User is Guest, redirecting to home');
    return router.createUrlTree(['/']);
  }
};

// ✅ Admin Guard - Only allows Admins to access
export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService); // ✅ حقن TokenService
  const router = inject(Router);

  console.log('👑 Admin Guard - Checking if user is Admin...');

  const token = authService.getToken();
  
  if (!token || tokenService.isTokenExpired(token)) {
    console.log('❌ Admin Guard - User not authenticated, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  // ✅ استخدام TokenService لاستخراج الـ role
  const userRole = tokenService.getUserRole(token);

  console.log('👤 Admin Guard - User role:', userRole);

  if (userRole === 'admin') {
    console.log('✅ Admin Guard - User is Admin, allowing access');
    return true;
  }

  // Redirect based on role
  if (userRole === 'host') {
    console.log('🔄 Admin Guard - User is Host, redirecting to host dashboard');
    return router.createUrlTree(['/host/dashboard']);
  } else {
    console.log('🔄 Admin Guard - User is Guest, redirecting to home');
    return router.createUrlTree(['/']);
  }
};
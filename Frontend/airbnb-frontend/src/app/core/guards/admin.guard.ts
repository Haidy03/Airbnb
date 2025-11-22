import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Check if user has Admin role
    const userRole = this.getUserRoleFromToken(token);
    
    if (userRole === 'Admin') {
      return true;
    }

    // If not admin, redirect to home
    console.warn('Access denied: Admin role required');
    this.router.navigate(['/']);
    return false;
  }

  private getUserRoleFromToken(token: string): string | null {
    try {
      // Decode JWT token to get user role
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // The role might be in different claim names depending on your backend
      // Common claim names: role, Role, http://schemas.microsoft.com/ws/2008/06/identity/claims/role
      const role = payload['role'] 
        || payload['Role'] 
        || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      return role || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
// services/token.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  
  decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }

  // getUserRole(token: string): string {
  //   const payload = this.decodeToken(token);
  //   if (!payload) return '';
    
  //   return (payload.role || 
  //           payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
  //           '').toLowerCase();
  // }
  getUserRole(token: string): string {
    const payload = this.decodeToken(token);
    if (!payload) return '';
    
   
    const rawRole = payload.role || 
                    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (!rawRole) return '';

    
    if (Array.isArray(rawRole)) {
   
      return rawRole.join(',').toLowerCase();
    }

    
    return String(rawRole).toLowerCase();
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    return Date.now() >= payload.exp * 1000;
  }

  getUserId(token: string): string {
    const payload = this.decodeToken(token);
    return payload?.sub || payload?.userId || '';
  }

  getTokenExpiration(token: string): Date | null {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return null;
    
    return new Date(payload.exp * 1000);
  }
}
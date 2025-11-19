import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  saveUserId(userId: string): void {
    localStorage.setItem('userId', userId);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  }
}
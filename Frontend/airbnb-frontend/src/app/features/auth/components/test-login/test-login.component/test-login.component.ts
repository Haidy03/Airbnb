import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-test-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>🔐 Test Login</h1>
        <p class="subtitle">للاختبار فقط - مؤقت</p>

        <!-- Quick Login Buttons -->
        <div class="quick-login-section">
          <h3>Quick Login:</h3>
          <button 
            class="btn btn-quick" 
            (click)="quickLogin('guest')"
            [disabled]="loading">
            👤 Login as Guest
          </button>
          <button 
            class="btn btn-quick btn-host" 
            (click)="quickLogin('host')"
            [disabled]="loading">
            🏠 Login as Host
          </button>
          <button 
            class="btn btn-quick btn-admin" 
            (click)="quickLogin('admin')"
            [disabled]="loading">
            👨‍💼 Login as Admin
          </button>
        </div>

        <div class="divider">
          <span>OR</span>
        </div>

        <!-- Manual Login Form -->
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="form-group">
            <label>Email:</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email"
              class="form-control"
              placeholder="Enter email"
              required>
          </div>

          <div class="form-group">
            <label>Password:</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              class="form-control"
              placeholder="Enter password"
              required>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="alert alert-error">
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div *ngIf="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="loading || !loginForm.valid">
            <span *ngIf="loading" class="spinner"></span>
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <!-- Test Credentials Info -->
        <div class="credentials-info">
          <h4>Test Accounts:</h4>
          <div class="credential-item">
            <strong>Guest:</strong> guest@test.com / Guest@123
          </div>
          <div class="credential-item">
            <strong>Host:</strong> host@test.com / Host@123
          </div>
          <div class="credential-item">
            <strong>Admin:</strong> admin@airbnb.com / Admin@123
          </div>
        </div>

        <!-- Current Status -->
        <div class="status-section">
          <h4>Current Status:</h4>
          <div class="status-item">
            <strong>Token:</strong> 
            <span class="status-value">{{ hasToken ? '✅ Saved' : '❌ Not Found' }}</span>
          </div>
          <div class="status-item">
            <strong>User ID:</strong> 
            <span class="status-value">{{ hasUserId ? '✅ Saved' : '❌ Not Found' }}</span>
          </div>
          <button 
            *ngIf="hasToken" 
            class="btn btn-danger btn-sm"
            (click)="clearStorage()">
            🗑️ Clear Storage
          </button>
        </div>

        <!-- Test Review Buttons -->
        <div *ngIf="hasToken" class="test-actions">
          <h4>Test Review Pages:</h4>
          <button class="btn btn-test" (click)="goTo('/reviews/my-reviews')">
            📝 My Reviews
          </button>
          <button class="btn btn-test" (click)="goTo('/reviews/property/1')">
            ⭐ Property Reviews
          </button>
          <button class="btn btn-test" (click)="goTo('/reviews/add/1')">
            ➕ Add Review
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      text-align: center;
      color: #333;
      margin: 0 0 8px 0;
      font-size: 32px;
    }

    .subtitle {
      text-align: center;
      color: #999;
      margin: 0 0 32px 0;
      font-size: 14px;
    }

    .quick-login-section {
      margin-bottom: 24px;
    }

    .quick-login-section h3 {
      font-size: 14px;
      color: #666;
      margin: 0 0 12px 0;
      text-align: center;
    }

    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-quick {
      background: #f0f0f0;
      color: #333;
      margin-bottom: 8px;
    }

    .btn-quick:hover:not(:disabled) {
      background: #e0e0e0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn-host {
      background: #4CAF50;
      color: white;
    }

    .btn-host:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-admin {
      background: #FF9800;
      color: white;
    }

    .btn-admin:hover:not(:disabled) {
      background: #F57C00;
    }

    .divider {
      text-align: center;
      margin: 24px 0;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e0e0e0;
    }

    .divider span {
      background: white;
      padding: 0 16px;
      position: relative;
      color: #999;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 15px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-top: 8px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .alert {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .alert-error {
      background: #fee;
      color: #c00;
      border: 1px solid #fcc;
    }

    .alert-success {
      background: #efe;
      color: #070;
      border: 1px solid #cfc;
    }

    .credentials-info {
      background: #f7f7f7;
      padding: 16px;
      border-radius: 8px;
      margin-top: 24px;
    }

    .credentials-info h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
    }

    .credential-item {
      font-size: 13px;
      color: #333;
      margin-bottom: 6px;
      font-family: monospace;
    }

    .status-section {
      background: #f0f8ff;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .status-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }

    .status-value {
      font-weight: 600;
    }

    .btn-danger {
      background: #f44336;
      color: white;
      margin-top: 12px;
    }

    .btn-danger:hover {
      background: #d32f2f;
    }

    .btn-sm {
      padding: 8px 16px;
      font-size: 13px;
    }

    .test-actions {
      background: #fff3cd;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .test-actions h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #856404;
    }

    .btn-test {
      background: #ffc107;
      color: #333;
      margin-bottom: 8px;
    }

    .btn-test:hover {
      background: #ffb300;
    }

    @media (max-width: 600px) {
      .login-card {
        padding: 24px;
      }

      h1 {
        font-size: 24px;
      }
    }
  `]
})
export class TestLoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  get hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  get hasUserId(): boolean {
    return !!localStorage.getItem('userId');
  }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  quickLogin(type: 'guest' | 'host' | 'admin'): void {
    const credentials = {
      guest: { email: 'guest@test.com', password: 'Guest@123' },
      host: { email: 'host@test.com', password: 'Host@123' },
      admin: { email: 'admin@airbnb.com', password: 'Admin@123' }
    };

    const { email, password } = credentials[type];
    this.email = email;
    this.password = password;
    this.onLogin();
  }

  onLogin(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>(`${environment.apiUrl}/Auth/login`, loginData)
      .subscribe({
        next: (response) => {
          console.log('✅ Login Success:', response);

          // Save to localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('email', response.email);

          this.successMessage = `✅ Logged in successfully as ${response.email}`;
          this.loading = false;

          // Show success for 2 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('❌ Login Error:', error);
          this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
          this.loading = false;
        }
      });
  }

  clearStorage(): void {
    if (confirm('Are you sure you want to clear all stored data?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      
      this.successMessage = '🗑️ Storage cleared!';
      setTimeout(() => {
        this.successMessage = '';
      }, 2000);
    }
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}
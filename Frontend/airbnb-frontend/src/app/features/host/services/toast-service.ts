import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<Toast[]>([]);
  private toastIdCounter = 0;

  readonly activeToasts = this.toasts.asReadonly();

  /**
   * Show success toast
   */
  success(title: string, message: string, duration = 3000): void {
    this.show('success', title, message, duration);
  }

  /**
   * Show error toast
   */
  error(title: string, message: string, duration = 5000): void {
    this.show('error', title, message, duration);
  }

  /**
   * Show warning toast
   */
  warning(title: string, message: string, duration = 4000): void {
    this.show('warning', title, message, duration);
  }

  /**
   * Show info toast
   */
  info(title: string, message: string, duration = 3000): void {
    this.show('info', title, message, duration);
  }

  /**
   * Show toast notification
   */
  private show(
    type: Toast['type'],
    title: string,
    message: string,
    duration: number
  ): void {
    const id = `toast-${++this.toastIdCounter}`;
    
    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration,
      timestamp: new Date()
    };

    // Add toast
    this.toasts.update(toasts => [...toasts, toast]);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  /**
   * Remove toast by ID
   */
  remove(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toasts.set([]);
  }
}

// ============================================
// TOAST COMPONENT
// ============================================

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toastService.activeToasts()"
        class="toast"
        [class]="'toast-' + toast.type"
        [@fadeSlide]
        (click)="toastService.remove(toast.id)">
        
        <div class="toast-icon">
          <svg *ngIf="toast.type === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          
          <svg *ngIf="toast.type === 'error'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          
          <svg *ngIf="toast.type === 'warning'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          
          <svg *ngIf="toast.type === 'info'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8h.01M12 12v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        
        <button class="toast-close" (click)="toastService.remove(toast.id); $event.stopPropagation()">
          ×
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: transform 0.2s;
    }

    .toast:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .toast-success {
      border-left: 4px solid #4CAF50;
    }

    .toast-error {
      border-left: 4px solid #FF385C;
    }

    .toast-warning {
      border-left: 4px solid #FFB300;
    }

    .toast-info {
      border-left: 4px solid #2196F3;
    }

    .toast-icon {
      flex-shrink: 0;
    }

    .toast-success .toast-icon { color: #4CAF50; }
    .toast-error .toast-icon { color: #FF385C; }
    .toast-warning .toast-icon { color: #FFB300; }
    .toast-info .toast-icon { color: #2196F3; }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 14px;
      font-weight: 600;
      color: #222;
      margin-bottom: 4px;
    }

    .toast-message {
      font-size: 13px;
      color: #717171;
      line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: #717171;
      font-size: 24px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .toast-close:hover {
      background: #F7F7F7;
      color: #222;
    }

    @media (max-width: 768px) {
      .toast-container {
        left: 16px;
        right: 16px;
        max-width: none;
      }
    }
  `],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
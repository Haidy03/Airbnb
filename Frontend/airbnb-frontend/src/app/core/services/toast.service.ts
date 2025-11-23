import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toast$: Observable<Toast> = this.toastSubject.asObservable();

  private toasts: Toast[] = [];

  showSuccess(message: string, duration: number = 3000): void {
    this.show('success', message, duration);
  }

  showError(message: string, duration: number = 5000): void {
    this.show('error', message, duration);
  }

  showWarning(message: string, duration: number = 4000): void {
    this.show('warning', message, duration);
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show('info', message, duration);
  }

  private show(type: Toast['type'], message: string, duration: number): void {
    const id = this.generateId();
    const toast: Toast = { id, type, message, duration };

    this.toasts.push(toast);
    this.toastSubject.next(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  clear(): void {
    this.toasts = [];
  }

  private generateId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getToasts(): Toast[] {
    return this.toasts;
  }
}

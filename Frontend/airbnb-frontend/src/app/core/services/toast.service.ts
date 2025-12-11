import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  image?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toast$: Observable<Toast> = this.toastSubject.asObservable();

  private toasts: Toast[] = [];

  constructor() {}

  showSuccess(message: string, duration: number = 3000): void {
    this.show(message, 'success', undefined, duration);
  }

  showError(message: string, duration: number = 5000): void {
    this.show(message, 'error', undefined, duration);
  }

  showWarning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', undefined, duration);
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show(message, 'info', undefined, duration);
  }

  
  public show(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    image?: string,
    duration: number = 4000
  ): void {

    const id = this.generateId();
    const toast: Toast = { id, type, message, image, duration };

    this.toasts.push(toast);
    this.toastSubject.next(toast);

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

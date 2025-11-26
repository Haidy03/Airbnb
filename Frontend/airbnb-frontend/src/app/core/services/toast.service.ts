import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  image?: string; // (جديد) خاصية الصورة عشان إشعار الـ Wishlist
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Subject بيبعت التوست الجديد للكومبوننت
  private toastSubject = new Subject<Toast>();
  public toast$: Observable<Toast> = this.toastSubject.asObservable();

  // مصفوفة داخلية (اختياري لو حبيت تدير الحالة هنا)
  private toasts: Toast[] = [];

  constructor() {}

  // --- الدوال القديمة (عشان الـ Account Settings تفضل شغالة) ---
  // قمنا بتعديل الاستدعاء الداخلي فقط ليناسب الترتيب الجديد

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

  // --- الدالة الرئيسية (المعدلة) ---
  // 1. خليناها public عشان الـ Home ينادي عليها
  // 2. غيرنا الترتيب: message الأول، ثم type، ثم image
  public show(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    image?: string,
    duration: number = 4000
  ): void {

    const id = this.generateId();
    const toast: Toast = { id, type, message, image, duration };

    this.toasts.push(toast);
    this.toastSubject.next(toast); // ابعت التوست للكومبوننت عشان يعرضه

    // إزالة تلقائية من السيرفس (الكومبوننت بيعمل إزالة من الـ UI بردو)
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    // ملاحظة: الـ Component بيسمع لـ toast$ اللي بتبعت "إضافة" بس.
    // الحذف بيتم في الكومبوننت محلياً، أو ممكن نعمل Subject تاني للحذف لو محتاج تزامن دقيق.
    // حالياً الكود ده كافي جداً لغرضك.
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

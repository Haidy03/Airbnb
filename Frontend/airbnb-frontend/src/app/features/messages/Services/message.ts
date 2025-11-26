import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`; // تأكدي أن الـ Controller اسمه MessagesController

  // ✅ إشارة مركزية لعدد الرسائل غير المقروءة (عشان تظهر في الـ Header)
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {
    this.refreshUnreadCount();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getConversations(mode: 'host' | 'guest'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations?mode=${mode}`, {
      headers: this.getHeaders()
    });
  }

  getMessages(conversationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations/${conversationId}/messages`, {
      headers: this.getHeaders()
    });
  }

  // ✅ دالة إرسال الرسالة
  sendMessage(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages`, data, {
      headers: this.getHeaders()
    });
  }

  // ✅ دالة لجلب عدد الرسائل غير المقروءة وتحديث الـ Signal
  refreshUnreadCount() {
    this.http.get<any>(`${this.apiUrl}/unread-count`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.unreadCount.set(res.count);
        },
        error: () => this.unreadCount.set(0)
      });
  }

  // ✅ دالة لتقليل العداد محلياً عند قراءة رسالة
  decrementUnreadCount(amount: number) {
    this.unreadCount.update(val => Math.max(0, val - amount));
  }
}
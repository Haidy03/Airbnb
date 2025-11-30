import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {
    this.refreshUnreadCount();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // 🆕 دالة لإصلاح روابط الصور
  private fixImageUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    
    // لو الرابط كامل بالفعل
    if (url.startsWith('http')) return url;
    
    // لو assets محلي
    if (url.includes('assets/')) return url;
    
    // إزالة / من البداية
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // استخدام imageBaseUrl
    const baseUrl = environment.imageBaseUrl || 'http://localhost:5000';
    
    return `${baseUrl}/${cleanUrl}`;
  }

  // 🆕 دالة لإصلاح الـ Participant
  private fixParticipant(participant: any): any {
    return {
      ...participant,
      avatar: this.fixImageUrl(participant.avatar)
    };
  }

  // ✅ تعديل getConversations لإصلاح الصور
  getConversations(mode: 'host' | 'guest'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations?mode=${mode}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        // إصلاح روابط الصور في كل conversation
        if (response.data && Array.isArray(response.data)) {
          response.data = response.data.map((conv: any) => ({
            ...conv,
            host: this.fixParticipant(conv.host),
            guest: this.fixParticipant(conv.guest),
            participants: conv.participants?.map((p: any) => this.fixParticipant(p)),
            propertyImage: this.fixImageUrl(conv.propertyImage)
          }));
        }
        return response;
      })
    );
  }

  getMessages(conversationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations/${conversationId}/messages`, {
      headers: this.getHeaders()
    });
  }

  createConversation(data: { propertyId: number, guestId: string, initialMessage: string }) {
    return this.http.post<any>(`${this.apiUrl}/conversations`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        // إصلاح الصور في الـ conversation الجديدة
        if (response.data) {
          response.data = {
            ...response.data,
            host: this.fixParticipant(response.data.host),
            guest: this.fixParticipant(response.data.guest),
            participants: response.data.participants?.map((p: any) => this.fixParticipant(p)),
            propertyImage: this.fixImageUrl(response.data.propertyImage)
          };
        }
        return response;
      })
    );
  }

  sendMessage(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages`, data, {
      headers: this.getHeaders()
    });
  }

  refreshUnreadCount() {
    this.http.get<any>(`${this.apiUrl}/unread-count`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.unreadCount.set(res.count || 0);
        },
        error: () => this.unreadCount.set(0)
      });
  }

  markConversationAsRead(conversationId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/conversations/${conversationId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  decrementUnreadCount(amount: number) {
    this.unreadCount.update(val => Math.max(0, val - amount));
  }
}
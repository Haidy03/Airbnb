// --- START OF FILE src/app/services/message.service.ts ---

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// الموديل لحمولة الطلب (Payload)
export interface SendMessagePayload {
  propertyId: string;
  guestId: string;
  initialMessage: string;
}

// الاستجابة المتوقعة من الباك إند
export interface MessageResponse {
  success: boolean;
  conversationId: string; // مُعرِّف المحادثة الجديدة
  error?: string; // رسالة الخطأ إذا فشل الطلب
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  // المسار: /api/Messages/conversations
  private apiUrl = `${environment.apiUrl}/Messages/conversations`;

  constructor(private http: HttpClient) { }

  /**
   * دالة لإنشاء محادثة جديدة وإرسال الرسالة الأولى
   * @param payload بيانات الرسالة والحجز
   */
  createConversation(payload: SendMessagePayload): Observable<MessageResponse> {

    // ملاحظة: الـ HttpClient يضيف Headers و Content-Type تلقائياً
    return this.http.post<MessageResponse>(this.apiUrl, payload);
  }
}

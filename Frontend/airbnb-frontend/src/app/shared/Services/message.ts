import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, interval, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Conversation, 
  Message, 
  SendMessageDto, 
  CreateConversationDto 
} from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = `${environment.apiUrl}/messages`;
  
  // Signals for reactive state
  conversations = signal<Conversation[]>([]);
  unreadCount = signal<number>(0);
  currentConversation = signal<Conversation | null>(null);
  currentMessages = signal<Message[]>([]);

  constructor(private http: HttpClient) {
    // Poll for unread count every 30 seconds
    this.startUnreadCountPolling();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  /**
   * Get all user conversations
   */
  getConversations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.conversations.set(response.data);
        }
      })
    );
  }

  /**
   * Get conversation by ID
   */
  getConversationById(conversationId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/conversations/${conversationId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.currentConversation.set(response.data);
        }
      })
    );
  }

  /**
   * Create new conversation
   */
  createConversation(dto: CreateConversationDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/conversations`, dto, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Add to conversations list
          const current = this.conversations();
          this.conversations.set([response.data, ...current]);
        }
      })
    );
  }

  // ==========================================
  // MESSAGES
  // ==========================================

  /**
   * Get messages for a conversation
   */
  getMessages(conversationId: string, pageNumber: number = 1, pageSize: number = 50): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/conversations/${conversationId}/messages?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success) {
          this.currentMessages.set(response.data);
        }
      })
    );
  }

  /**
   * Send message
   */
  sendMessage(dto: SendMessageDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages`, dto, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Add message to current messages
          const current = this.currentMessages();
          this.currentMessages.set([...current, response.data]);
        }
      })
    );
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/messages/${messageId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Mark entire conversation as read
   */
  markConversationAsRead(conversationId: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/conversations/${conversationId}/read`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        if (response.success) {
          // Update unread count
          this.getUnreadCount().subscribe();
        }
      })
    );
  }

  /**
   * Delete message
   */
  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/messages/${messageId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Remove from current messages
          const current = this.currentMessages();
          this.currentMessages.set(current.filter(m => m.id !== messageId));
        }
      })
    );
  }

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  /**
   * Get unread message count
   */
  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.unreadCount.set(response.count);
        }
      })
    );
  }

  /**
   * Start polling for unread count
   */
  private startUnreadCountPolling(): void {
    interval(30000) // Every 30 seconds
      .pipe(
        switchMap(() => this.getUnreadCount())
      )
      .subscribe();
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Clear current conversation
   */
  clearCurrentConversation(): void {
    this.currentConversation.set(null);
    this.currentMessages.set([]);
  }

  /**
   * Format date for messages
   */
  formatMessageDate(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return messageDate.toLocaleDateString();
  }
}
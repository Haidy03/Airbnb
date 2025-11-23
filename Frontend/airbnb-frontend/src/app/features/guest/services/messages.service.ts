import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

// 1. Define User Interface locally to resolve the error
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[]; // Now refers to the User interface defined above
  lastMessage: Message;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  // API Endpoint
  private readonly API_URL = 'https://localhost:5202/api/messages';

  // State Management
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadConversations();
  }

  // Load all conversations
  private loadConversations(): void {
    this.http.get<Conversation[]>(`${this.API_URL}/conversations`)
      .subscribe({
        next: (conversations) => {
          this.conversationsSubject.next(conversations);
          this.updateUnreadCount(conversations);
        },
        error: (err) => console.error('Error loading conversations', err)
      });
  }

  // Calculate total unread messages
  private updateUnreadCount(conversations: Conversation[]): void {
    const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    this.unreadCountSubject.next(total);
  }

  // Get messages for a specific conversation
  getConversation(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.API_URL}/conversations/${conversationId}`);
  }

  // Send a new message
  sendMessage(conversationId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.API_URL}/conversations/${conversationId}`, { content })
      .pipe(
        tap(() => this.loadConversations()) // Refresh list after sending
      );
  }

  // Mark conversation as read
  markAsRead(conversationId: string): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/conversations/${conversationId}/read`, {})
      .pipe(
        tap(() => this.loadConversations()) // Refresh to update unread count
      );
  }
}

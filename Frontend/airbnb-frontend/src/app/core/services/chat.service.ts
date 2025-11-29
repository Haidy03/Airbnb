import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service'; // Adjust path if needed

export interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // Ensure this matches your backend port
  private readonly API_URL = 'https://localhost:5202/api/Chat';

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  sendMessage(message: string): Observable<string> {
    return this.http.post<{ response: string }>(
      this.API_URL,
      { message },
      { headers: this.getHeaders() }
    ).pipe(
      map(res => res.response),
      catchError(err => {
        console.error('Chat Error:', err);
        return throwError(() => new Error('Failed to reach the AI brain.'));
      })
    );
  }
}
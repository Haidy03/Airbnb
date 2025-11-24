// Frontend/airbnb-frontend/src/app/features/messages/messages-inbox/messages-inbox.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from '../../../shared/Services/message';
import { Conversation } from '../../../shared/models/message.model';

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css']
})
export class MessagesInboxComponent implements OnInit {
  conversations = signal<Conversation[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  currentUserId = '';

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    this.loadConversations();
  }

  private getCurrentUserId(): string {
    // Get from auth service or token
    return localStorage.getItem('userId') || '';
  }

  loadConversations(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.messageService.getConversations().subscribe({
      next: (response) => {
        if (response.success) {
          this.conversations.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load conversations');
        this.isLoading.set(false);
        console.error('Error loading conversations:', error);
      }
    });
  }

  openConversation(conversation: Conversation): void {
    this.router.navigate(['/messages', conversation.id]);
  }

  getOtherParticipant(conversation: Conversation): any {
    return conversation.participants.find(p => p.userId !== this.currentUserId);
  }

  formatDate(date: Date): string {
    return this.messageService.formatMessageDate(date);
  }

  hasUnreadMessages(conversation: Conversation): boolean {
    return conversation.unreadCount > 0;
  }
}
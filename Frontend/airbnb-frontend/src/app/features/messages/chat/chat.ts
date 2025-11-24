// Frontend/airbnb-frontend/src/app/features/messages/chat/chat.component.ts
import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../../../shared/Services/message';
import { Conversation, Message, SendMessageDto, MessageType } from '../../../shared/models/message.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  conversation = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);
  isLoading = signal(false);
  isSending = signal(false);
  error = signal<string | null>(null);
  
  messageText = '';
  currentUserId = '';
  conversationId = '';
  
  private pollingSubscription?: Subscription;
  private shouldScrollToBottom = false;

  constructor(
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    
    this.route.params.subscribe(params => {
      this.conversationId = params['id'];
      if (this.conversationId) {
        this.loadConversation();
        this.loadMessages();
        this.markAsRead();
        this.startPolling();
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private getCurrentUserId(): string {
    return localStorage.getItem('userId') || '';
  }

  loadConversation(): void {
    this.messageService.getConversationById(this.conversationId).subscribe({
      next: (response) => {
        if (response.success) {
          this.conversation.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading conversation:', error);
        this.error.set('Failed to load conversation');
      }
    });
  }

  loadMessages(): void {
    this.isLoading.set(true);
    
    this.messageService.getMessages(this.conversationId).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages.set(response.data);
          this.shouldScrollToBottom = true;
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.error.set('Failed to load messages');
        this.isLoading.set(false);
      }
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim() || this.isSending()) return;

    this.isSending.set(true);

    const dto: SendMessageDto = {
      conversationId: this.conversationId,
      content: this.messageText.trim(),
      messageType: MessageType.TEXT
    };

    this.messageService.sendMessage(dto).subscribe({
      next: (response) => {
        if (response.success) {
          // Add message to list
          const current = this.messages();
          this.messages.set([...current, response.data]);
          
          // Clear input
          this.messageText = '';
          this.shouldScrollToBottom = true;
        }
        this.isSending.set(false);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        this.isSending.set(false);
      }
    });
  }

  markAsRead(): void {
    this.messageService.markConversationAsRead(this.conversationId).subscribe({
      next: () => {
        console.log('Conversation marked as read');
      },
      error: (error) => {
        console.error('Error marking as read:', error);
      }
    });
  }

  deleteMessage(messageId: string): void {
    if (!confirm('Are you sure you want to delete this message?')) return;

    this.messageService.deleteMessage(messageId).subscribe({
      next: (response) => {
        if (response.success) {
          const current = this.messages();
          this.messages.set(current.filter(m => m.id !== messageId));
        }
      },
      error: (error) => {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    });
  }

  isMyMessage(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  getOtherParticipant(): any {
    const conv = this.conversation();
    if (!conv) return null;
    
    return conv.participants.find(p => p.userId !== this.currentUserId);
  }

  formatMessageTime(date: Date): string {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatMessageDate(date: Date): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  shouldShowDateSeparator(message: Message, index: number): boolean {
    if (index === 0) return true;
    
    const messages = this.messages();
    const prevMessage = messages[index - 1];
    const currentDate = new Date(message.sentAt).toDateString();
    const prevDate = new Date(prevMessage.sentAt).toDateString();
    
    return currentDate !== prevDate;
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private startPolling(): void {
    // Poll for new messages every 5 seconds
    this.pollingSubscription = interval(5000).subscribe(() => {
      this.loadMessages();
    });
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  goBack(): void {
    this.router.navigate(['/messages']);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
// Frontend/airbnb-frontend/src/app/test/message-test/message-test.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from '../../shared/Services/message';
import { CreateConversationDto, MessageType } from '../../shared/models/message.model';

@Component({
  selector: 'app-message-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="test-page">
      <div class="header">
        <h1>🧪 Messages Testing Tool</h1>
        <p>Quick way to test the messaging system</p>
      </div>

      <!-- Step 1: User Info -->
      <div class="card">
        <h2>📋 Step 1: Current User Info</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>User ID:</label>
            <input type="text" [(ngModel)]="currentUserId" placeholder="Enter your user ID">
          </div>
          <div class="info-item">
            <label>Role:</label>
            <select [(ngModel)]="userRole">
              <option value="guest">Guest</option>
              <option value="host">Host</option>
            </select>
          </div>
        </div>
        <button (click)="saveUserInfo()" class="btn-primary">
          Save User Info
        </button>
      </div>

      <!-- Step 2: Quick Create Conversation -->
      <div class="card">
        <h2>💬 Step 2: Create Test Conversation</h2>
        <p class="hint">Fill in the details below to create a test conversation</p>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Property ID *</label>
            <input type="number" [(ngModel)]="testPropertyId" placeholder="1">
            <small>Must be a valid property ID from your database</small>
          </div>

          <div class="form-group">
            <label>Other User ID *</label>
            <input type="text" [(ngModel)]="otherUserId" placeholder="user-123">
            <small>ID of the {{ userRole === 'guest' ? 'Host' : 'Guest' }}</small>
          </div>

          <div class="form-group full-width">
            <label>First Message *</label>
            <textarea 
              [(ngModel)]="firstMessage" 
              rows="3"
              placeholder="Hi! I'm interested in your property..."></textarea>
          </div>
        </div>

        <button 
          (click)="quickCreateConversation()" 
          [disabled]="isLoading()"
          class="btn-success">
          {{ isLoading() ? '⏳ Creating...' : '✨ Create Conversation' }}
        </button>

        <div *ngIf="createResult()" class="result-box" [class.success]="createResult()?.success">
          <h3>{{ createResult()?.success ? '✅ Success!' : '❌ Error' }}</h3>
          <div *ngIf="createResult()?.success">
            <p><strong>Conversation ID:</strong> {{ createResult()?.data?.id }}</p>
            <p><strong>Property:</strong> {{ createResult()?.data?.propertyTitle }}</p>
            <button (click)="openConversation(createResult()?.data?.id)" class="btn-link">
              🔗 Open Conversation
            </button>
          </div>
          <div *ngIf="!createResult()?.success">
            <pre>{{ createResult() | json }}</pre>
          </div>
        </div>
      </div>

      <!-- Step 3: View Conversations -->
      <div class="card">
        <h2>📬 Step 3: My Conversations</h2>
        <button 
          (click)="loadConversations()" 
          [disabled]="isLoading()"
          class="btn-primary">
          {{ isLoading() ? '⏳ Loading...' : '🔄 Refresh Conversations' }}
        </button>

        <div *ngIf="conversations().length === 0 && !isLoading()" class="empty-state">
          <p>No conversations yet. Create one above! ☝️</p>
        </div>

        <div *ngIf="conversations().length > 0" class="conversations-list">
          <div 
            *ngFor="let conv of conversations()"
            class="conversation-card"
            [class.unread]="conv.unreadCount > 0">
            
            <div class="conv-header">
              <h3>
                {{ getOtherUser(conv)?.name }}
                <span class="badge">{{ getOtherUser(conv)?.userType }}</span>
              </h3>
              <span class="unread-badge" *ngIf="conv.unreadCount > 0">
                {{ conv.unreadCount }}
              </span>
            </div>

            <p class="property-name">🏠 {{ conv.propertyTitle }}</p>
            <p class="last-message">{{ conv.lastMessage?.content }}</p>
            
            <div class="conv-actions">
              <button (click)="openConversation(conv.id)" class="btn-small">
                💬 Open Chat
              </button>
              <button (click)="viewMessages(conv.id)" class="btn-small btn-outline">
                👁️ View Messages
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Quick Send Message -->
      <div class="card">
        <h2>📤 Step 4: Send Quick Message</h2>
        
        <div class="form-group">
          <label>Conversation ID</label>
          <input type="number" [(ngModel)]="quickConvId" placeholder="1">
        </div>

        <div class="form-group">
          <label>Message</label>
          <textarea 
            [(ngModel)]="quickMessage" 
            rows="3"
            placeholder="Type your message here..."></textarea>
        </div>

        <button 
          (click)="sendQuickMessage()" 
          [disabled]="isLoading() || !quickConvId || !quickMessage"
          class="btn-primary">
          {{ isLoading() ? '⏳ Sending...' : '🚀 Send Message' }}
        </button>

        <div *ngIf="sendResult()" class="result-box" [class.success]="sendResult()?.success">
          <p>{{ sendResult()?.success ? '✅ Message sent!' : '❌ ' + sendResult()?.message }}</p>
        </div>
      </div>

      <!-- Step 5: View Messages -->
      <div class="card" *ngIf="currentMessages().length > 0">
        <h2>💭 Messages in Conversation #{{ viewingConvId }}</h2>
        
        <div class="messages-container">
          <div 
            *ngFor="let msg of currentMessages()"
            class="message-item"
            [class.my-message]="msg.senderId === currentUserId">
            
            <div class="message-header">
              <strong>{{ msg.senderName }}</strong>
              <span class="timestamp">{{ formatDate(msg.sentAt) }}</span>
            </div>
            <p class="message-content">{{ msg.content }}</p>
            <div class="message-footer">
              <span class="status">
                {{ msg.isRead ? '✓✓ Read' : msg.isDelivered ? '✓ Delivered' : '○ Sending' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 6: Check Unread -->
      <div class="card">
        <h2>🔔 Step 6: Unread Messages</h2>
        <button (click)="checkUnread()" [disabled]="isLoading()" class="btn-primary">
          {{ isLoading() ? '⏳ Checking...' : '🔍 Check Unread Count' }}
        </button>

        <div *ngIf="unreadCount() !== null" class="result-box success">
          <h3>You have {{ unreadCount() }} unread message(s)</h3>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .test-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 24px;
      background: #F7F7F7;
      min-height: 100vh;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    h1 {
      font-size: 36px;
      color: #FF385C;
      margin: 0 0 8px 0;
    }

    .header p {
      color: #717171;
      margin: 0;
    }

    .card {
      background: white;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    h2 {
      font-size: 20px;
      color: #222;
      margin: 0 0 16px 0;
    }

    .hint {
      color: #717171;
      font-size: 14px;
      margin: 0 0 24px 0;
    }

    .info-grid, .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    label {
      font-weight: 600;
      color: #222;
      font-size: 14px;
    }

    input, textarea, select {
      padding: 12px;
      border: 1px solid #DDDDDD;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #FF385C;
    }

    small {
      color: #717171;
      font-size: 12px;
    }

    button {
      padding: 14px 24px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .btn-primary {
      background: #FF385C;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #E31C5F;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 56, 92, 0.3);
    }

    .btn-success {
      background: #00A699;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #008F84;
      transform: translateY(-2px);
    }

    .btn-small {
      padding: 8px 16px;
      font-size: 13px;
      background: #222;
      color: white;
    }

    .btn-small:hover {
      background: #000;
    }

    .btn-outline {
      background: white;
      border: 2px solid #DDDDDD;
      color: #222;
    }

    .btn-outline:hover {
      border-color: #222;
      background: #F7F7F7;
    }

    .btn-link {
      padding: 8px 16px;
      background: #E8F5F4;
      color: #00A699;
      font-size: 13px;
      margin-top: 8px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .result-box {
      margin-top: 24px;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #FF385C;
      background: #FFF5F5;
    }

    .result-box.success {
      border-left-color: #00A699;
      background: #E8F5F4;
    }

    .result-box h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
    }

    .result-box p {
      margin: 8px 0;
      color: #222;
    }

    pre {
      background: #222;
      color: #0F0;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #717171;
    }

    .conversations-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }

    .conversation-card {
      padding: 20px;
      border: 2px solid #EBEBEB;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .conversation-card:hover {
      border-color: #FF385C;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .conversation-card.unread {
      background: #FFF8F5;
      border-color: #FF385C;
    }

    .conv-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .conv-header h3 {
      margin: 0;
      font-size: 18px;
      color: #222;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      padding: 4px 8px;
      background: #F7F7F7;
      color: #717171;
      font-size: 12px;
      font-weight: 600;
      border-radius: 4px;
      text-transform: capitalize;
    }

    .unread-badge {
      background: #FF385C;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .property-name {
      color: #717171;
      font-size: 14px;
      margin: 0 0 8px 0;
    }

    .last-message {
      color: #222;
      font-size: 14px;
      margin: 0 0 16px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .conv-actions {
      display: flex;
      gap: 12px;
    }

    .messages-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: 500px;
      overflow-y: auto;
      padding: 16px;
      background: #F7F7F7;
      border-radius: 8px;
    }

    .message-item {
      padding: 16px;
      border-radius: 12px;
      background: white;
      border: 1px solid #EBEBEB;
    }

    .message-item.my-message {
      background: #FFE8ED;
      border-color: #FF385C;
      margin-left: 40px;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .message-header strong {
      color: #222;
      font-size: 14px;
    }

    .timestamp {
      color: #717171;
      font-size: 12px;
    }

    .message-content {
      color: #222;
      margin: 0 0 8px 0;
      line-height: 1.5;
    }

    .message-footer {
      display: flex;
      justify-content: flex-end;
    }

    .status {
      font-size: 12px;
      color: #717171;
    }
  `]
})
export class MessageTestComponent implements OnInit {
  // State
  isLoading = signal(false);
  conversations = signal<any[]>([]);
  currentMessages = signal<any[]>([]);
  createResult = signal<any>(null);
  sendResult = signal<any>(null);
  unreadCount = signal<number | null>(null);

  // Form Data
  currentUserId = '';
  userRole = 'guest';
  testPropertyId = 1;
  otherUserId = '';
  firstMessage = 'Hi! I\'m interested in your property and would like to know more details.';
  quickConvId: number | null = null;
  quickMessage = '';
  viewingConvId: number | null = null;

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Try to get user ID from localStorage
    this.currentUserId = localStorage.getItem('userId') || '';
    
    if (this.currentUserId) {
      this.loadConversations();
    }
  }

  saveUserInfo(): void {
    if (!this.currentUserId) {
      alert('Please enter your User ID');
      return;
    }
    localStorage.setItem('userId', this.currentUserId);
    alert('✅ User info saved!');
  }

  quickCreateConversation(): void {
    if (!this.currentUserId) {
      alert('❌ Please save your user info first (Step 1)');
      return;
    }

    if (!this.testPropertyId || !this.otherUserId || !this.firstMessage) {
      alert('❌ Please fill all required fields');
      return;
    }

    this.isLoading.set(true);
    this.createResult.set(null);

    const dto: CreateConversationDto = {
      propertyId: this.testPropertyId.toString(),
      guestId: this.userRole === 'guest' ? this.currentUserId : this.otherUserId,
      initialMessage: this.firstMessage
    };

    this.messageService.createConversation(dto).subscribe({
      next: (response) => {
        this.createResult.set(response);
        this.isLoading.set(false);
        
        if (response.success) {
          this.quickConvId = response.data.id;
          this.loadConversations();
        }
      },
      error: (error) => {
        this.createResult.set({ 
          success: false, 
          message: error.error?.message || error.message 
        });
        this.isLoading.set(false);
      }
    });
  }

  loadConversations(): void {
    this.isLoading.set(true);
    
    this.messageService.getConversations().subscribe({
      next: (response) => {
        if (response.success) {
          this.conversations.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.isLoading.set(false);
      }
    });
  }

  openConversation(convId: number): void {
    this.router.navigate(['/messages', convId]);
  }

  viewMessages(convId: number): void {
    this.isLoading.set(true);
    this.viewingConvId = convId;
    
    this.messageService.getMessages(convId.toString()).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentMessages.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading.set(false);
      }
    });
  }

  sendQuickMessage(): void {
    if (!this.quickConvId || !this.quickMessage) return;

    this.isLoading.set(true);
    this.sendResult.set(null);

    const dto = {
      conversationId: this.quickConvId.toString(),
      content: this.quickMessage,
      messageType: MessageType.TEXT
    };

    this.messageService.sendMessage(dto).subscribe({
      next: (response) => {
        this.sendResult.set(response);
        this.isLoading.set(false);
        
        if (response.success) {
          this.quickMessage = '';
          this.loadConversations();
        }
      },
      error: (error) => {
        this.sendResult.set({ 
          success: false, 
          message: error.error?.message || error.message 
        });
        this.isLoading.set(false);
      }
    });
  }

  checkUnread(): void {
    this.isLoading.set(true);
    
    this.messageService.getUnreadCount().subscribe({
      next: (response) => {
        if (response.success) {
          this.unreadCount.set(response.count);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error checking unread:', error);
        this.isLoading.set(false);
      }
    });
  }

  getOtherUser(conversation: any): any {
    if (!conversation.participants) {
      return conversation.host?.userId === this.currentUserId ? conversation.guest : conversation.host;
    }
    return conversation.participants.find((p: any) => p.userId !== this.currentUserId);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
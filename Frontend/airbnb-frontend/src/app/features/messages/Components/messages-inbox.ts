import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../Services/message';
import { Conversation, ConversationParticipant } from '../models/message.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-inbox.html',
  styleUrls: ['./messages-inbox.css']
})
export class MessagesInboxComponent implements OnInit { // ❌ أزلنا AfterViewChecked
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  currentMode = signal<'host' | 'guest'>('guest');
  currentUserId?: string;

  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<any[]>([]);
  
  isLoading = signal(true);
  isSending = signal(false);
  newMessageText = signal('');
  
  activeFilter = signal<'all' | 'unread'>('all');

  filteredConversations = computed(() => {
    const all = this.conversations();
    if (this.activeFilter() === 'unread') {
      return all.filter(c => c.unreadCount > 0);
    }
    return all;
  });

  ngOnInit() {
    const url = this.router.url;
    this.currentMode.set(url.includes('/host/') ? 'host' : 'guest');
    this.currentUserId = this.authService.currentUser?.id;

    this.loadAndSelectConversation();
  }

  // ❌ تم حذف ngAfterViewChecked لمنع مشاكل الـ Scroll المزعجة

  loadAndSelectConversation() {
    this.isLoading.set(true);

    this.messageService.getConversations(this.currentMode()).subscribe({
      next: (res) => {
        const allConversations = res.data || [];
        this.conversations.set(allConversations);
        this.isLoading.set(false);
        this.messageService.refreshUnreadCount();

        this.checkAutoOpen(allConversations);
      },
      error: () => this.isLoading.set(false)
    });
  }

  checkAutoOpen(conversations: Conversation[]) {
    this.route.queryParams.subscribe(params => {
      const guestId = params['guestId'];
      const propertyId = params['propertyId'];
      const hostId = params['hostId'];

      if (guestId || hostId) {
        const targetConv = conversations.find(c => {
          const matchProperty = propertyId ? c.propertyId == propertyId : true;
          
          if (this.currentMode() === 'host') {
             return c.guest.userId == guestId && matchProperty;
          } else {
             return c.host.userId == hostId && matchProperty;
          }
        });

        if (targetConv) {
          this.selectConversation(targetConv);
        }
      }
    });
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    
    if (conv.unreadCount > 0) {
      this.messageService.decrementUnreadCount(conv.unreadCount);
      this.conversations.update(list => list.map(c => 
        c.id === conv.id ? { ...c, unreadCount: 0 } : c
      ));
      
      this.messageService.markConversationAsRead(conv.id).subscribe();
    }

    this.messageService.getMessages(conv.id).subscribe(res => {
      this.messages.set(res.data);
      this.scrollToBottom(); // ✅ التمرير لأسفل عند تحميل الرسائل
    });
  }
  
  sendMessage() {
    if (!this.newMessageText().trim() || !this.selectedConversation()) return;

    this.isSending.set(true);
    
    const payload = {
      conversationId: this.selectedConversation()!.id,
      content: this.newMessageText(),
      messageType: 'text'
    };

    this.messageService.sendMessage(payload).subscribe({
      next: (res: any) => {
        const newMsg = res.data;
        if (!newMsg.senderId) newMsg.senderId = this.currentUserId;
        if (!newMsg.sentAt) newMsg.sentAt = new Date();

        this.messages.update(msgs => [...msgs, newMsg]);
        this.newMessageText.set('');
        this.isSending.set(false);
        this.scrollToBottom(); // ✅ التمرير لأسفل عند إرسال رسالة جديدة
      },
      error: () => {
        alert('Failed to send message');
        this.isSending.set(false);
      }
    });
  }

  isMyMessage(msg: any): boolean {
    const conv = this.selectedConversation();
    if (!conv) return false;

    if (this.currentMode() === 'host') {
      return msg.senderId === conv.host.userId;
    } else if(this.currentMode() === 'guest'){
      return msg.senderId === conv.guest.userId;
    } else {
      return msg.senderId === this.currentUserId;
    }
  }

  getOtherParticipant(conv: Conversation): ConversationParticipant {
    return this.currentMode() === 'host' ? conv.guest : conv.host;
  }

  // ✅ الدالة المعدلة والآمنة
  scrollToBottom(): void {
    try {
      setTimeout(() => {
        // التحقق من وجود العنصر قبل استخدامه
        if (this.myScrollContainer && this.myScrollContainer.nativeElement) {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        }
      }, 100); // زيادة الوقت قليلاً لضمان اكتمال الرسم
    } catch(err) { }                 
  }
  
  setFilter(filter: 'all' | 'unread') {
    this.activeFilter.set(filter);
  }
}
// features/messages/Components/messages-inbox.ts

import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../Services/message';
// تأكدي من مسار الاستيراد الصحيح للموديل
import { Conversation, ConversationParticipant, Message } from '../models/message.model'; 
import { AuthService } from '../../auth/services/auth.service';
import { AvatarComponent } from "../../../shared/components/avatar/avatar";

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: './messages-inbox.html',
  styleUrls: ['./messages-inbox.css']
})
export class MessagesInboxComponent implements OnInit {
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // ✅ متغير لمعرفة هل المحادثة الجديدة تخص خدمة أم لا
  private isServiceDraft = false; 

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  currentMode = signal<'host' | 'guest'>('guest');
  currentUserId?: string;

  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<Message[]>([]);
  
  isLoading = signal(true);
  isSending = signal(false);
  newMessageText = signal('');
  activeFilter = signal<'all' | 'unread'>('all');

  // ✅ Computed property للترتيب والفلترة
  filteredConversations = computed(() => {
    let all = this.conversations();
    
    // الفلترة
    if (this.activeFilter() === 'unread') {
      all = all.filter(c => c.unreadCount > 0);
    }

    // الترتيب
    return all.sort((a, b) => {
      if (a.id === 0) return -1;
      if (b.id === 0) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  });

  ngOnInit() {
    const url = this.router.url;
    this.currentMode.set(url.includes('/host/') ? 'host' : 'guest');
    this.currentUserId = this.authService.currentUser?.id;

    // ✅ التقاط نوع المحادثة من الرابط عند الفتح (service أو property)
    this.route.queryParams.subscribe(params => {
       if (params['type'] === 'service') {
         this.isServiceDraft = true;
       } else {
         this.isServiceDraft = false;
       }
    });

    this.loadAndSelectConversation();
  }

  loadAndSelectConversation() {
    this.isLoading.set(true);

    this.messageService.getConversations(this.currentMode()).subscribe({
      next: (res) => {
        const allConversations: Conversation[] = res.data || [];
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
      const propertyId = params['propertyId']; // يأتي كنص من الـ URL (قد يكون رقم عقار أو رقم خدمة)
      const hostId = params['hostId'];

      if ((guestId || hostId) && propertyId) {
        
        // البحث عن محادثة موجودة
        const targetConv = conversations.find(c => {
          const matchProperty = c.propertyId == propertyId;
          if (this.currentMode() === 'host') {
             return c.guest.userId == guestId && matchProperty;
          } else {
             return c.host.userId == hostId && matchProperty;
          }
        });

        if (targetConv) {
          this.selectConversation(targetConv);
        } else {
          // إنشاء محادثة جديدة (Draft)
          this.createDraftConversation(params);
        }
      }
    });
  }

  createDraftConversation(params: any) {
    const isHostMode = this.currentMode() === 'host';
    
    const otherUser: ConversationParticipant = {
      userId: isHostMode ? params['guestId'] : params['hostId'],
      userType: isHostMode ? 'guest' : 'host',
      name: isHostMode ? (params['guestName'] || 'Guest') : (params['hostName'] || 'Host'),
      avatar: 'assets/images/placeholder-user.png', // ✅ صورة افتراضية آمنة
      isOnline: false
    };

    const currentUser: ConversationParticipant = {
      userId: this.currentUserId || '',
      userType: isHostMode ? 'host' : 'guest',
      name: 'Me',
      avatar: this.authService.currentUser?.profilePicture,
      isOnline: true
    };

    const draftConv: Conversation = {
      id: 0, 
      propertyId: Number(params['propertyId']),
      propertyTitle: params['propertyTitle'] || 'New Conversation',
      propertyImage: params['propertyImage'],
      bookingId: params['bookingId'] ? Number(params['bookingId']) : undefined,
      host: isHostMode ? currentUser : otherUser,
      guest: isHostMode ? otherUser : currentUser,
      participants: [currentUser, otherUser],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: undefined 
    };

    // ✅ تخزين النوع داخل الكائن لاستخدامه عند الإرسال
    (draftConv as any).isService = this.isServiceDraft;

    this.conversations.update(list => [draftConv, ...list]);
    this.selectConversation(draftConv);
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    this.messages.set([]); 

    if (conv.id !== 0) {
      if (conv.unreadCount > 0) {
        this.messageService.decrementUnreadCount(conv.unreadCount);
        this.conversations.update(list => list.map(c => 
          c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
        this.messageService.markConversationAsRead(conv.id.toString()).subscribe();
      }

      this.messageService.getMessages(conv.id.toString()).subscribe(res => {
        this.messages.set(res.data);
        this.scrollToBottom();
      });
    } else {
      this.scrollToBottom();
    }
  }
  
  sendMessage() {
    const selected = this.selectedConversation();
    if (!this.newMessageText().trim() || !selected) return;

    this.isSending.set(true);
    
    // حالة محادثة جديدة (Draft)
    if (selected.id === 0) {
        // ✅ تحديد هل هي خدمة أم عقار
        const isService = (selected as any).isService || this.isServiceDraft;

        
        const createPayload: any = {
            guestId: selected.guest.userId,
            initialMessage: this.newMessageText()
        };
        
         if (isService) {
          createPayload.serviceId = Number(selected.propertyId); 
        } else {
           createPayload.propertyId = Number(selected.propertyId);
        }
        console.log('📤 Creating Conversation Payload:', createPayload); 
        this.messageService.createConversation(createPayload).subscribe({
            next: (res) => {
                const realConv = res.data; 
                
                this.conversations.update(list => 
                    list.map(c => c.id === 0 ? realConv : c)
                );
                
                this.selectConversation(realConv);
                this.newMessageText.set('');
                this.isSending.set(false);
            },
            error: (err) => {
                console.error('❌ Create Error:', err);
                alert('Failed to start conversation: ' + (err.error?.title || 'Unknown error'));
                this.isSending.set(false);
            }
        });

    } else {
        // حالة محادثة موجودة (لا نحتاج للتفريق هنا لأن الـ ConversationId كافي)
        const payload = {
            conversationId: selected.id, 
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
                this.scrollToBottom();
            },
            error: () => {
                alert('Failed to send message');
                this.isSending.set(false);
            }
        });
    }
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

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.myScrollContainer && this.myScrollContainer.nativeElement) {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch(err) { }                 
  }
  
  setFilter(filter: 'all' | 'unread') {
    this.activeFilter.set(filter);
  }
}
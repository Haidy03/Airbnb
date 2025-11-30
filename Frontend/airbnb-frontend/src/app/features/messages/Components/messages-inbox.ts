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

    // الترتيب: المحادثات الجديدة (ID=0) تظهر في الأعلى دائماً
    // بما أن ID أصبح number، المقارنة الآن صحيحة ولا تسبب خطأ TS2367
    return all.sort((a, b) => {
      if (a.id === 0) return -1;
      if (b.id === 0) return 1;
      // ترتيب تنازلي حسب التاريخ للمحادثات العادية
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  });

  ngOnInit() {
    const url = this.router.url;
    this.currentMode.set(url.includes('/host/') ? 'host' : 'guest');
    this.currentUserId = this.authService.currentUser?.id;

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
      const propertyId = params['propertyId']; // يأتي كنص من الـ URL
      const hostId = params['hostId'];

      if ((guestId || hostId) && propertyId) {
        
        // البحث عن محادثة موجودة
        // نستخدم == للمقارنة بين رقم ونص (لأن propertyId في الرابط string وفي الموديل number)
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
      avatar: 'assets/images/user-placeholder.png',
      isOnline: false
    };

    const currentUser: ConversationParticipant = {
      userId: this.currentUserId || '',
      userType: isHostMode ? 'host' : 'guest',
      name: 'Me',
      avatar: this.authService.currentUser?.profilePicture,
      isOnline: true
    };

    // ✅ إصلاح الأنواع هنا (TS2322 fix)
    const draftConv: Conversation = {
      id: 0, // number
      propertyId: Number(params['propertyId']), // تحويل النص إلى رقم
      propertyTitle: params['propertyTitle'] || 'Property Listing',
      propertyImage: params['propertyImage'],
      bookingId: params['bookingId'] ? Number(params['bookingId']) : undefined, // تحويل أو undefined
      host: isHostMode ? currentUser : otherUser,
      guest: isHostMode ? otherUser : currentUser,
      participants: [currentUser, otherUser],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: undefined // ✅ استخدام undefined بدلاً من null
    };

    this.conversations.update(list => [draftConv, ...list]);
    this.selectConversation(draftConv);
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    this.messages.set([]); 

    // ✅ مقارنة سليمة (number مع number)
    if (conv.id !== 0) {
      if (conv.unreadCount > 0) {
        this.messageService.decrementUnreadCount(conv.unreadCount);
        this.conversations.update(list => list.map(c => 
          c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
        // استدعاء الميثود كـ number ولكن الـ Service تتوقع string في بعض الأحيان
        // يفضل توحيد الأنواع، هنا سنرسلها كما هي ونترك الـ Service تتعامل معها
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
    
    // ✅ مقارنة سليمة (number مع number)
    if (selected.id === 0) {
        // ✅ Payload صحيح
        const createPayload = {
            propertyId: selected.propertyId, // هذا أصبح رقم بالفعل من الـ draft
            guestId: selected.guest.userId,
            initialMessage: this.newMessageText()
        };

        // الـ Service تتوقع كائن، والأنواع الآن متوافقة
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
                console.error(err);
                alert('Failed to start conversation');
                this.isSending.set(false);
            }
        });

    } else {
        const payload = {
            conversationId: selected.id, // number
            content: this.newMessageText(),
            messageType: 'text'
        };

        this.messageService.sendMessage(payload).subscribe({
            next: (res: any) => {
                const newMsg = res.data;
                // التأكد من الحقول الاختيارية
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
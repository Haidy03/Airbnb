import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../Services/message';
import { Conversation, ConversationParticipant, Message } from '../models/message.model';
import { AuthService } from '../../auth/services/auth.service';
import { AvatarComponent } from "../../../shared/components/avatar/avatar";

import { SignalRService } from '../../../core/services/signalr.service';

@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  templateUrl: './messages-inbox.html',
  styleUrls: ['./messages-inbox.css']
})
export class MessagesInboxComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private signalRService = inject(SignalRService); // 2. حقن الخدمة
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  private isServiceDraft = false;
  private isExperienceDraft = false;

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

  filteredConversations = computed(() => {
    let all = this.conversations();
    
    if (this.activeFilter() === 'unread') {
      all = all.filter(c => c.unreadCount > 0);
    }

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

    // 3. بدء اتصال SignalR
    this.signalRService.startConnection();

    // 4. الاستماع للرسائل الجديدة لحظياً
    this.signalRService.messageReceived$.subscribe((newMessage: any) => {
      this.handleRealTimeMessage(newMessage);
    });

    this.route.queryParams.subscribe(params => {
       this.isServiceDraft = params['type'] === 'service';
       this.isExperienceDraft = params['type'] === 'experience';
    });

    this.loadAndSelectConversation();
  }

  // 5. التعامل مع الرسالة الواردة (تحديث الشات أو القائمة)
  private handleRealTimeMessage(newMessage: any) {
    const currentConv = this.selectedConversation();

    // أ. لو الرسالة تبع المحادثة المفتوحة حالياً -> ضيفها في الشات
    if (currentConv && currentConv.id === newMessage.conversationId) {
      this.messages.update(msgs => [...msgs, newMessage]);
      this.scrollToBottom();
      
      // نعتبرها مقروءة فوراً لو أنا فاتح الشات
      if (newMessage.senderId !== this.currentUserId) {
        this.messageService.markConversationAsRead(currentConv.id.toString()).subscribe();
      }
    } 
    
    // ب. تحديث القائمة الجانبية (آخر رسالة + وقت + unread)
    this.conversations.update(list => list.map(c => {
      if (c.id === newMessage.conversationId) {
        return {
          ...c,
          lastMessage: newMessage,
          updatedAt: new Date(), // عشان تطلع فوق في الترتيب
          unreadCount: (currentConv?.id === c.id) ? 0 : c.unreadCount + 1
        };
      }
      return c;
    }));
  }

  ngOnDestroy() {
    // 6. إغلاق الاتصال عند الخروج (اختياري، أو تركه مفتوحاً لو التطبيق كله محتاج شات)
    // this.signalRService.stopConnection(); 
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
      const contextId = params['contextId'] || params['propertyId']; 
      const hostId = params['hostId'];
      const type = params['type']; // ✅ قراءة النوع من الرابط

      if ((guestId || hostId) && contextId) {
        
        const targetConv = conversations.find(c => {
          
          let matchId = false;

          // ✅ التحقق بناءً على نوع الخدمة
          if (type === 'service') {
             // نفترض أن الباك إند بيرجع serviceId في الـ conversation object
             // لو مش بيرجعه، لازم تتأكدي من الـ DTO
             matchId = (c as any).serviceId == contextId;
          } 
          else if (type === 'experience') {
             matchId = (c as any).experienceId == contextId;
          } 
          else {
             // Default: Property
             // التأكد إنه مش service ولا experience عشان ميتلخبطش
             matchId = c.propertyId == contextId && !(c as any).serviceId && !(c as any).experienceId;
          }
          
          if (this.currentMode() === 'host') {
             return c.guest.userId == guestId && matchId;
          } else {
             return c.host.userId == hostId && matchId;
          }
        });

        if (targetConv) {
          this.selectConversation(targetConv);
        } else {
          const draftParams = { ...params, propertyId: contextId };
          this.createDraftConversation(draftParams);
        }
      }
    });
  }

  createDraftConversation(params: any) {
    const isHostMode = this.currentMode() === 'host';
    const passedAvatar = isHostMode ? params['guestImage'] : params['hostImage'];

    const otherUser: ConversationParticipant = {
      userId: isHostMode ? params['guestId'] : params['hostId'],
      userType: isHostMode ? 'guest' : 'host',
      name: isHostMode ? (params['guestName'] || 'Guest') : (params['hostName'] || 'Host'),
      avatar: params['guestImage'] || params['hostImage'] || 'https://placehold.co/100x100?text=User',
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
      propertyTitle: params['propertyTitle'] || params['title'] || 'New Conversation',
      propertyImage: params['propertyImage'] || 'assets/images/placeholder-property.jpg',
      bookingId: params['bookingId'] ? Number(params['bookingId']) : undefined,
      host: isHostMode ? currentUser : otherUser,
      guest: isHostMode ? otherUser : currentUser,
      participants: [currentUser, otherUser],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: undefined 
    };

    (draftConv as any).isService = this.isServiceDraft;
    (draftConv as any).isExperience = this.isExperienceDraft;

    this.conversations.update(list => [draftConv, ...list]);
    this.selectConversation(draftConv);
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    this.messages.set([]); 

    if (conv.id !== 0) {
      // 7. انضمام لغرفة المحادثة في SignalR
      this.signalRService.joinConversation(conv.id.toString());

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
        const isService = (selected as any).isService || this.isServiceDraft;
        const isExperience = (selected as any).isExperience || this.isExperienceDraft;

        const createPayload: any = {
            guestId: selected.guest.userId,
            initialMessage: this.newMessageText()
        };
        
        if (isService) {
          createPayload.serviceId = Number(selected.propertyId);
          createPayload.propertyId = null;
        } else if (isExperience) {
          createPayload.experienceId = Number(selected.propertyId);
          createPayload.propertyId = null;
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
                
                // الانضمام للمحادثة الجديدة فور إنشائها
                this.signalRService.joinConversation(realConv.id.toString());

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
        // حالة محادثة موجودة - إرسال عبر SignalR + API
        // ملاحظة: لو الباك إند بيوزع الرسالة بعد الـ API، مش محتاجين نستخدم invoke('SendMessage') هنا
        // لكن لو عايزين نستخدم الـ Hub مباشرة للإرسال:
        
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

                // 8. تحديث الواجهة فوراً (Optimistic UI)
                // الرسالة هتيجي تاني من SignalR لو السيرفر بعتها لنفس الشخص، لازم نهندل التكرار
                // أو نعتمد فقط على SignalR للاستقبال
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
    return msg.senderId === this.currentUserId;
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
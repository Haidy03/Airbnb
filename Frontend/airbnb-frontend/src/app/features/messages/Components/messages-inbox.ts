import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ for ngModel
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../Services/message';
import { Conversation, ConversationParticipant } from '../models/message.model';
import { AuthService} from '../../auth/services/auth.service';
@Component({
  selector: 'app-messages-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-inbox.html',
  styleUrls: ['./messages-inbox.css']
})
export class MessagesInboxComponent implements OnInit, AfterViewChecked {
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  currentMode = signal<'host' | 'guest'>('guest');
  currentUserId?: string;
  // Data Signals
  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  messages = signal<any[]>([]);
  
  // UI State
  isLoading = signal(true);
  isSending = signal(false);
  newMessageText = signal('');
  
  // ✅ Filter State
  activeFilter = signal<'all' | 'unread'>('all');

  // ✅ Computed List based on Filter
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
    this.loadConversations();
  }

  ngAfterViewChecked() {        
    this.scrollToBottom();        
  } 

  loadConversations() {
    this.isLoading.set(true);
    this.messageService.getConversations(this.currentMode()).subscribe({
      next: (res) => {
        this.conversations.set(res.data || []);
        this.isLoading.set(false);
        this.messageService.refreshUnreadCount(); // تحديث العداد العام
      },
      error: () => this.isLoading.set(false)
    });
  }

  setFilter(filter: 'all' | 'unread') {
    this.activeFilter.set(filter);
  }

  isMyMessage(msg: any): boolean {
    const conv = this.selectedConversation();
    if (!conv) return false;

    //  return msg.senderId === this.currentUserId;

    // إذا كنت في وضع الـ Host، فرسائلي هي التي الـ SenderId فيها هو نفس الـ HostUserId
    if (this.currentMode() === 'host') {
      return msg.senderId === conv.host.userId;
    } 
    // إذا كنت في وضع الـ Guest، فرسائلي هي التي الـ SenderId فيها هو نفس الـ GuestUserId
    else if(this.currentMode() === 'guest'){
      return msg.senderId === conv.guest.userId;
    }
    else{
      return msg.senderId === this.currentUserId;
    }

    
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    
    // ✅ تحديث حالة القراءة محلياً
    if (conv.unreadCount > 0) {
      this.messageService.decrementUnreadCount(conv.unreadCount);
      // تحديث المصفوفة المحلية لتصفير العداد لهذا المحادثة
      this.conversations.update(list => list.map(c => 
        c.id === conv.id ? { ...c, unreadCount: 0 } : c
      ));
      
      // TODO: Call API to mark as read
    }

    this.messageService.getMessages(conv.id).subscribe(res => {
      this.messages.set(res.data);
      this.scrollToBottom();
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
        // res.data هي الرسالة الجديدة من الباك إند
        const newMsg = res.data;

        // ✅ تأكيد: لو الباك إند مرجعش الـ senderId صح، نضبطه يدوياً
        // (ده عشان تظهر يمين فوراً بدون ريفرش)
        if (!newMsg.senderId) {
            newMsg.senderId = this.currentUserId;
        }
        
        // ✅ تأكيد: ضبط الوقت لو مش راجع
        if (!newMsg.sentAt) {
            newMsg.sentAt = new Date();
        }

        this.messages.update(msgs => [...msgs, newMsg]);
        this.newMessageText.set('');
        this.isSending.set(false);
        
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: () => {
        alert('Failed to send message');
        this.isSending.set(false);
      }
    });
  }

  getOtherParticipant(conv: Conversation): ConversationParticipant {
    return this.currentMode() === 'host' ? conv.guest : conv.host;
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }                 
  }

  handleEnter(event: any) {
    if (!event.shiftKey) {
      event.preventDefault(); // منع سطر جديد
      this.sendMessage();
    }
  }
}
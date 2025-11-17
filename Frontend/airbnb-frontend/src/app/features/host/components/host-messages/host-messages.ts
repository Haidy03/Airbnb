import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  id: string;
  guestId: string;
  guestName: string;
  guestAvatar: string;
  propertyTitle: string;
  lastMessage: string;
  timestamp: Date;
  isUnread: boolean;
  bookingId?: string;
}

@Component({
  selector: 'app-host-messages',
  imports: [CommonModule, FormsModule],
  templateUrl: './host-messages.html',
  styleUrl: './host-messages.css',
})
export class HostMessages implements OnInit{
  // Messages data
  messages = signal<Message[]>([]);
  filteredMessages = signal<Message[]>([]);
  
  // Filter state
  activeFilter = signal<'all' | 'unread'>('all');
  searchQuery = signal<string>('');
  
  // Loading state
  loading = signal<boolean>(false);
  
  // Selected conversation
  selectedMessage = signal<Message | null>(null);

  // Mock messages data
  private mockMessages: Message[] = [
    {
      id: 'msg-001',
      guestId: 'guest-001',
      guestName: 'Sarah Johnson',
      guestAvatar: 'https://i.pravatar.cc/150?img=1',
      propertyTitle: 'Luxury Beachfront Villa',
      lastMessage: 'Hi! I have a question about early check-in...',
      timestamp: new Date('2024-11-16T14:30:00'),
      isUnread: true,
      bookingId: 'book-001'
    },
    {
      id: 'msg-002',
      guestId: 'guest-002',
      guestName: 'Michael Chen',
      guestAvatar: 'https://i.pravatar.cc/150?img=12',
      propertyTitle: 'Modern Downtown Loft',
      lastMessage: 'Thank you for the quick response!',
      timestamp: new Date('2024-11-15T18:45:00'),
      isUnread: false,
      bookingId: 'book-002'
    },
    {
      id: 'msg-003',
      guestId: 'guest-003',
      guestName: 'Emily Rodriguez',
      guestAvatar: 'https://i.pravatar.cc/150?img=5',
      propertyTitle: 'Luxury Beachfront Villa',
      lastMessage: 'Looking forward to our stay!',
      timestamp: new Date('2024-11-14T10:20:00'),
      isUnread: true,
      bookingId: 'book-003'
    }
  ];

  ngOnInit(): void {
    this.loadMessages();
  }

  /**
   * Load messages
   */
  loadMessages(): void {
    this.loading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.messages.set(this.mockMessages);
      this.applyFilters();
      this.loading.set(false);
    }, 500);
  }

  /**
   * Set active filter
   */
  setFilter(filter: 'all' | 'unread'): void {
    this.activeFilter.set(filter);
    this.applyFilters();
  }

  /**
   * Apply filters to messages
   */
  applyFilters(): void {
    let filtered = [...this.messages()];
    
    // Apply unread filter
    if (this.activeFilter() === 'unread') {
      filtered = filtered.filter(msg => msg.isUnread);
    }
    
    // Apply search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(msg => 
        msg.guestName.toLowerCase().includes(query) ||
        msg.propertyTitle.toLowerCase().includes(query) ||
        msg.lastMessage.toLowerCase().includes(query)
      );
    }
    
    this.filteredMessages.set(filtered);
  }

  /**
   * Search messages
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.activeFilter.set('all');
    this.searchQuery.set('');
    this.applyFilters();
  }

  /**
   * Select a message conversation
   */
  selectMessage(message: Message): void {
    this.selectedMessage.set(message);
    // Mark as read
    const messages = this.messages();
    const index = messages.findIndex(m => m.id === message.id);
    if (index !== -1 && messages[index].isUnread) {
      messages[index] = { ...messages[index], isUnread: false };
      this.messages.set([...messages]);
      this.applyFilters();
    }
  }

  /**
   * Get relative time
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  /**
   * Open settings
   */
  openSettings(): void {
    console.log('Open message settings');
  }
}

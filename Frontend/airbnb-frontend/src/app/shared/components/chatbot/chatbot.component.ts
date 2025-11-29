import { Component, ElementRef, ViewChild, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  private chatService = inject(ChatService);

  // State Signals
  isOpen = signal(false);
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([
    { text: "Hi! 👋 I'm your Airbnb AI assistant. Ask me about properties, trips, or recommendations!", sender: 'ai', timestamp: new Date() }
  ]);
  
  userInput = '';
  
  // Auto-scroll reference
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  toggleChat() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMsg = this.userInput;
    this.userInput = ''; // Clear input immediately

    // 1. Add User Message
    this.addMessage(userMsg, 'user');
    this.isLoading.set(true);

    // 2. Call API
    this.chatService.sendMessage(userMsg).subscribe({
      next: (response) => {
        this.addMessage(response, 'ai');
        this.isLoading.set(false);
      },
      error: () => {
        this.addMessage("I'm having trouble connecting right now. Please try again later.", 'ai');
        this.isLoading.set(false);
      }
    });
  }

  private addMessage(text: string, sender: 'user' | 'ai') {
    this.messages.update(msgs => [...msgs, { text, sender, timestamp: new Date() }]);
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private scrollToBottom() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }
}
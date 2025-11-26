// 1. Enums (أنواع البيانات الثابتة)
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  BOOKING_REQUEST = 'booking_request',
  SYSTEM = 'system'
}

export enum UserType {
  HOST = 'host',
  GUEST = 'guest'
}

// 2. Helper Interfaces (أجزاء صغيرة)
export interface MessageAttachment {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// ✅ هذا هو الـ Interface اللي كان ناقص
export interface ConversationParticipant {
  userId: string;
  userType: string; // 'host' | 'guest'
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeenAt?: Date;
}

// 3. Main Interfaces (الأساسية)

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: MessageType;
  attachments?: MessageAttachment[];
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
}

// ✅ تعديل Conversation ليشمل Host و Guest بشكل صريح
export interface Conversation {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyImage?: string;
  bookingId?: string;
  
  // بيانات الطرفين (عشان نعرف نعرض مين حسب الـ mode)
  host: ConversationParticipant;
  guest: ConversationParticipant;
  
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 4. DTOs (للإرسال للسيرفر)
export interface SendMessageDto {
  conversationId: string;
  content: string;
  messageType: MessageType;
  attachments?: File[];
}

export interface CreateConversationDto {
  propertyId: string;
  guestId: string;
  initialMessage: string;
}
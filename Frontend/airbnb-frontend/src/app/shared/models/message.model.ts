export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: MessageType;
  attachments?: MessageAttachment[];
  isRead: boolean;
  isDelivered: boolean;
  sentAt: Date;
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

export interface Conversation {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyImage?: string;
  bookingId?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  userType: UserType;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeenAt?: Date;
}

export interface MessageAttachment {
  id: string;
  type: AttachmentType;
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  BOOKING_REQUEST = 'booking_request',
  BOOKING_CONFIRMATION = 'booking_confirmation',
  SYSTEM = 'system'
}

export enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video'
}

export enum UserType {
  HOST = 'host',
  GUEST = 'guest'
}

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
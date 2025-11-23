//using Airbnb.API.DTOs.Messages;
//using Airbnb.API.Models;
//using Airbnb.API.Repositories.Interfaces;
//using Airbnb.API.Services.Interfaces;

//namespace Airbnb.API.Services.Implementations
//{
//    public class MessageService : IMessageService
//    {
//        private readonly IMessageRepository _messageRepository;
//        private readonly IPropertyRepository _propertyRepository;
//        private readonly ILogger<MessageService> _logger;

//        public MessageService(
//            IMessageRepository messageRepository,
//            IPropertyRepository propertyRepository,
//            ILogger<MessageService> logger)
//        {
//            _messageRepository = messageRepository;
//            _propertyRepository = propertyRepository;
//            _logger = logger;
//        }

//        public async Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId)
//        {
//            var conversations = await _messageRepository.GetUserConversationsAsync(userId);
//            return conversations.Select(c => MapToConversationDto(c, userId));
//        }

//        public async Task<ConversationDto?> GetConversationByIdAsync(int conversationId, string userId)
//        {
//            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);

//            if (conversation == null)
//                return null;

//            // Check if user is participant
//            if (conversation.HostId != userId && conversation.GuestId != userId)
//                throw new UnauthorizedAccessException("You are not a participant in this conversation");

//            return MapToConversationDto(conversation, userId);
//        }

//        public async Task<ConversationDto> CreateConversationAsync(string hostId, CreateConversationDto dto)
//        {
//            // Check if conversation already exists
//            var existingConversation = await _messageRepository.GetConversationBetweenUsersAsync(
//                hostId, dto.GuestId, dto.PropertyId);

//            if (existingConversation != null)
//            {
//                // Return existing conversation
//                return MapToConversationDto(existingConversation, hostId);
//            }

//            // Verify property exists and belongs to host
//            var property = await _propertyRepository.GetByIdAsync(dto.PropertyId);
//            if (property == null)
//                throw new KeyNotFoundException("Property not found");

//            if (property.HostId != hostId)
//                throw new UnauthorizedAccessException("You are not the host of this property");

//            // Create new conversation
//            var conversation = new Conversation
//            {
//                PropertyId = dto.PropertyId,
//                HostId = hostId,
//                GuestId = dto.GuestId,
//                CreatedAt = DateTime.UtcNow
//            };

//            conversation = await _messageRepository.CreateConversationAsync(conversation);

//            // Send initial message
//            var initialMessage = new Message
//            {
//                ConversationId = conversation.Id,
//                SenderId = hostId,
//                ReceiverId = dto.GuestId,
//                Content = dto.InitialMessage,
//                MessageType = "text",
//                SentAt = DateTime.UtcNow
//            };

//            await _messageRepository.SendMessageAsync(initialMessage);

//            // Reload conversation with messages
//            conversation = await _messageRepository.GetConversationByIdAsync(conversation.Id);

//            return MapToConversationDto(conversation!, hostId);
//        }

//        public async Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(
//            int conversationId, string userId, int pageNumber = 1, int pageSize = 50)
//        {
//            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);

//            if (conversation == null)
//                throw new KeyNotFoundException("Conversation not found");

//            if (conversation.HostId != userId && conversation.GuestId != userId)
//                throw new UnauthorizedAccessException("You are not a participant in this conversation");

//            var messages = await _messageRepository.GetConversationMessagesAsync(conversationId, pageNumber, pageSize);

//            return messages.Select(MapToMessageDto).Reverse();
//        }

//        public async Task<MessageDto> SendMessageAsync(string senderId, SendMessageDto dto)
//        {
//            var conversation = await _messageRepository.GetConversationByIdAsync(dto.ConversationId);

//            if (conversation == null)
//                throw new KeyNotFoundException("Conversation not found");

//            if (conversation.HostId != senderId && conversation.GuestId != senderId)
//                throw new UnauthorizedAccessException("You are not a participant in this conversation");

//            // Determine receiver
//            var receiverId = conversation.HostId == senderId ? conversation.GuestId : conversation.HostId;

//            var message = new Message
//            {
//                ConversationId = dto.ConversationId,
//                SenderId = senderId,
//                ReceiverId = receiverId,
//                Content = dto.Content,
//                MessageType = dto.MessageType,
//                SentAt = DateTime.UtcNow,
//                IsDelivered = true
//            };

//            message = await _messageRepository.SendMessageAsync(message);

//            return MapToMessageDto(message);
//        }

//        public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
//        {
//            return await _messageRepository.MarkMessageAsReadAsync(messageId, userId);
//        }

//        public async Task<bool> MarkConversationAsReadAsync(int conversationId, string userId)
//        {
//            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);

//            if (conversation == null)
//                return false;

//            if (conversation.HostId != userId && conversation.GuestId != userId)
//                return false;

//            return await _messageRepository.MarkConversationAsReadAsync(conversationId, userId);
//        }

//        public async Task<int> GetUnreadCountAsync(string userId)
//        {
//            return await _messageRepository.GetUnreadCountAsync(userId);
//        }

//        public async Task DeleteMessageAsync(int messageId, string userId)
//        {
//            var message = await _messageRepository.GetMessageByIdAsync(messageId);

//            if (message == null)
//                throw new KeyNotFoundException("Message not found");

//            if (message.SenderId != userId)
//                throw new UnauthorizedAccessException("You can only delete your own messages");

//            await _messageRepository.DeleteMessageAsync(messageId);
//        }

//        // Helper Methods
//        private ConversationDto MapToConversationDto(Conversation conversation, string currentUserId)
//        {
//            var isHost = conversation.HostId == currentUserId;
//            var otherUser = isHost ? conversation.Guest : conversation.Host;

//            return new ConversationDto
//            {
//                Id = conversation.Id,
//                PropertyId = conversation.PropertyId,
//                PropertyTitle = conversation.Property?.Title,
//                PropertyImage = conversation.Property?.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl ??
//                               conversation.Property?.Images?.FirstOrDefault()?.ImageUrl,
//                BookingId = conversation.BookingId,
//                Host = new ConversationParticipantDto
//                {
//                    UserId = conversation.Host.Id,
//                    UserType = "host",
//                    Name = $"{conversation.Host.FirstName} {conversation.Host.LastName}",
//                    Avatar = conversation.Host.ProfileImageUrl,
//                    IsOnline = false // TODO: Implement online status
//                },
//                Guest = new ConversationParticipantDto
//                {
//                    UserId = conversation.Guest.Id,
//                    UserType = "guest",
//                    Name = $"{conversation.Guest.FirstName} {conversation.Guest.LastName}",
//                    Avatar = conversation.Guest.ProfileImageUrl,
//                    IsOnline = false
//                },
//                LastMessage = conversation.LastMessage != null ? MapToMessageDto(conversation.LastMessage) : null,
//                UnreadCount = conversation.Messages.Count(m => m.ReceiverId == currentUserId && !m.IsRead),
//                CreatedAt = conversation.CreatedAt,
//                UpdatedAt = conversation.UpdatedAt
//            };
//        }

//        private MessageDto MapToMessageDto(Message message)
//        {
//            return new MessageDto
//            {
//                Id = message.Id,
//                ConversationId = message.ConversationId,
//                SenderId = message.SenderId,
//                SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}",
//                SenderAvatar = message.Sender.ProfileImageUrl,
//                ReceiverId = message.ReceiverId,
//                ReceiverName = $"{message.Receiver.FirstName} {message.Receiver.LastName}",
//                Content = message.Content,
//                MessageType = message.MessageType,
//                IsRead = message.IsRead,
//                IsDelivered = message.IsDelivered,
//                SentAt = message.SentAt,
//                ReadAt = message.ReadAt,
//                Attachments = message.Attachments.Select(a => new MessageAttachmentDto
//                {
//                    Id = a.Id,
//                    AttachmentType = a.AttachmentType,
//                    FileUrl = a.FileUrl,
//                    FileName = a.FileName,
//                    FileSize = a.FileSize,
//                    MimeType = a.MimeType
//                }).ToList()
//            };
//        }
//    }
//}





using Airbnb.API.DTOs.Messages;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;

namespace Airbnb.API.Services.Implementations
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IPropertyRepository _propertyRepository;
        private readonly ILogger<MessageService> _logger;

        public MessageService(
            IMessageRepository messageRepository,
            IPropertyRepository propertyRepository,
            ILogger<MessageService> logger)
        {
            _messageRepository = messageRepository;
            _propertyRepository = propertyRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId)
        {
            var conversations = await _messageRepository.GetUserConversationsAsync(userId);
            return conversations.Select(c => MapToConversationDto(c, userId));
        }

        public async Task<ConversationDto?> GetConversationByIdAsync(int conversationId, string userId)
        {
            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);

            if (conversation == null)
                return null;

            // Check if user is participant
            if (conversation.HostId != userId && conversation.GuestId != userId)
                throw new UnauthorizedAccessException("You are not a participant in this conversation");

            return MapToConversationDto(conversation, userId);
        }

        public async Task<ConversationDto> CreateConversationAsync(string senderId, CreateConversationDto dto)
        {
            // Get property to determine Host and Guest
            var property = await _propertyRepository.GetByIdAsync(dto.PropertyId);
            if (property == null)
                throw new KeyNotFoundException("Property not found");

            var hostId = property.HostId;
            var guestId = dto.GuestId;

            // Check if conversation already exists
            var existingConversation = await _messageRepository.GetConversationBetweenUsersAsync(
                hostId, guestId, dto.PropertyId);

            if (existingConversation != null)
            {
                // Return existing conversation
                return MapToConversationDto(existingConversation, senderId);
            }

            // Create new conversation
            var conversation = new Conversation
            {
                PropertyId = dto.PropertyId,
                HostId = hostId,
                GuestId = guestId,
                CreatedAt = DateTime.UtcNow
            };

            conversation = await _messageRepository.CreateConversationAsync(conversation);

            // Send initial message
            var receiverId = senderId == hostId ? guestId : hostId;

            var initialMessage = new Message
            {
                ConversationId = conversation.Id,
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = dto.InitialMessage,
                MessageType = "text",
                SentAt = DateTime.UtcNow,
                IsDelivered = true
            };

            await _messageRepository.SendMessageAsync(initialMessage);

            // Reload conversation with messages
            conversation = await _messageRepository.GetConversationByIdAsync(conversation.Id);

            return MapToConversationDto(conversation!, senderId);
        }

        public async Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(
            int conversationId, string userId, int pageNumber = 1, int pageSize = 50)
        {
            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);

            if (conversation == null)
                throw new KeyNotFoundException("Conversation not found");

            if (conversation.HostId != userId && conversation.GuestId != userId)
                throw new UnauthorizedAccessException("You are not a participant in this conversation");

            var messages = await _messageRepository.GetConversationMessagesAsync(conversationId, pageNumber, pageSize);

            return messages.Select(MapToMessageDto).Reverse();
        }

        public async Task<MessageDto> SendMessageAsync(string senderId, SendMessageDto dto)
        {
            var conversation = await _messageRepository.GetConversationByIdAsync(dto.ConversationId);

            if (conversation == null)
                throw new KeyNotFoundException("Conversation not found");

            if (conversation.HostId != senderId && conversation.GuestId != senderId)
                throw new UnauthorizedAccessException("You are not a participant in this conversation");

            // Determine receiver
            var receiverId = conversation.HostId == senderId ? conversation.GuestId : conversation.HostId;

            var message = new Message
            {
                ConversationId = dto.ConversationId,
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = dto.Content,
                MessageType = dto.MessageType,
                SentAt = DateTime.UtcNow,
                IsDelivered = true
            };

            message = await _messageRepository.SendMessageAsync(message);

            return MapToMessageDto(message);
        }

        public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
        {
            return await _messageRepository.MarkMessageAsReadAsync(messageId, userId);
        }

        public async Task<bool> MarkConversationAsReadAsync(int conversationId, string userId)
        {
            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);

            if (conversation == null)
                return false;

            if (conversation.HostId != userId && conversation.GuestId != userId)
                return false;

            return await _messageRepository.MarkConversationAsReadAsync(conversationId, userId);
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _messageRepository.GetUnreadCountAsync(userId);
        }

        public async Task DeleteMessageAsync(int messageId, string userId)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);

            if (message == null)
                throw new KeyNotFoundException("Message not found");

            if (message.SenderId != userId)
                throw new UnauthorizedAccessException("You can only delete your own messages");

            await _messageRepository.DeleteMessageAsync(messageId);
        }

        // ==========================================
        // ✅ FIXED: Helper Methods with Proper UnreadCount
        // ==========================================

        private ConversationDto MapToConversationDto(Conversation conversation, string currentUserId)
        {
            var isHost = conversation.HostId == currentUserId;
            var otherUser = isHost ? conversation.Guest : conversation.Host;

            // ✅ Calculate UnreadCount based on CURRENT USER
            var unreadCount = conversation.Messages
                .Count(m => m.ReceiverId == currentUserId && !m.IsRead && m.DeletedAt == null);

            return new ConversationDto
            {
                Id = conversation.Id,
                PropertyId = conversation.PropertyId,
                PropertyTitle = conversation.Property?.Title,
                PropertyImage = conversation.Property?.Images?
                    .Where(i => i.IsPrimary)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault()
                    ?? conversation.Property?.Images?
                        .OrderBy(i => i.DisplayOrder)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault(),
                BookingId = conversation.BookingId,
                Host = new ConversationParticipantDto
                {
                    UserId = conversation.Host.Id,
                    UserType = "host",
                    Name = $"{conversation.Host.FirstName} {conversation.Host.LastName}",
                    Avatar = conversation.Host.ProfileImageUrl,
                    IsOnline = false // TODO: Implement online status with SignalR
                },
                Guest = new ConversationParticipantDto
                {
                    UserId = conversation.Guest.Id,
                    UserType = "guest",
                    Name = $"{conversation.Guest.FirstName} {conversation.Guest.LastName}",
                    Avatar = conversation.Guest.ProfileImageUrl,
                    IsOnline = false
                },
                LastMessage = conversation.LastMessage != null ? MapToMessageDto(conversation.LastMessage) : null,
                UnreadCount = unreadCount, // ✅ FIXED: Now based on current user
                CreatedAt = conversation.CreatedAt,
                UpdatedAt = conversation.UpdatedAt
            };
        }

        private MessageDto MapToMessageDto(Message message)
        {
            return new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.SenderId,
                SenderName = $"{message.Sender.FirstName} {message.Sender.LastName}",
                SenderAvatar = message.Sender.ProfileImageUrl,
                ReceiverId = message.ReceiverId,
                ReceiverName = $"{message.Receiver.FirstName} {message.Receiver.LastName}",
                Content = message.Content,
                MessageType = message.MessageType,
                IsRead = message.IsRead,
                IsDelivered = message.IsDelivered,
                SentAt = message.SentAt,
                ReadAt = message.ReadAt,
                Attachments = message.Attachments.Select(a => new MessageAttachmentDto
                {
                    Id = a.Id,
                    AttachmentType = a.AttachmentType,
                    FileUrl = a.FileUrl,
                    FileName = a.FileName,
                    FileSize = a.FileSize,
                    MimeType = a.MimeType
                }).ToList()
            };
        }
    }
}
using Airbnb.API.DTOs.Messages;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Implementations;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Airbnb.API.Hubs;


namespace Airbnb.API.Services.Implementations
{
    public class MessageService : IMessageService
    {
        private readonly IMessageRepository _messageRepository;
        private readonly IPropertyRepository _propertyRepository;
        private readonly IExperienceRepository _experienceRepository;
        private readonly IServiceRepository _serviceRepository;
        private readonly ILogger<MessageService> _logger;
        private readonly IHubContext<ChatHub> _hubContext;
        public MessageService(
            IMessageRepository messageRepository,
            IPropertyRepository propertyRepository,
            IServiceRepository serviceRepository,
            IExperienceRepository experienceRepository,
            IHubContext<ChatHub> hubContext,
        ILogger<MessageService> logger)
        {
            _messageRepository = messageRepository;
            _propertyRepository = propertyRepository;
            _serviceRepository = serviceRepository;
            _experienceRepository = experienceRepository;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId, string mode)
        {
            var allConversations = await _messageRepository.GetUserConversationsAsync(userId);

            if (!string.IsNullOrEmpty(mode) && mode.ToLower() == "host")
            {
                allConversations = allConversations.Where(c => c.HostId == userId);
            }
            else
            {
                allConversations = allConversations.Where(c => c.GuestId == userId);
            }

            return allConversations.Select(c => MapToConversationDto(c, userId));
        }

        public async Task<ConversationDto?> GetConversationByIdAsync(int conversationId, string userId)
        {
            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);

            if (conversation == null)
                return null;

            if (conversation.HostId != userId && conversation.GuestId != userId)
                throw new UnauthorizedAccessException("You are not a participant in this conversation");

            return MapToConversationDto(conversation, userId);
        }

        public async Task<ConversationDto> CreateConversationAsync(string senderId, CreateConversationDto dto)
        {
            string hostId;
            string guestId = dto.GuestId;

            // 1. Check if it's Property or Service
            if (dto.PropertyId.HasValue)
            {
                var property = await _propertyRepository.GetByIdAsync(dto.PropertyId.Value);
                if (property == null) throw new KeyNotFoundException("Property not found");
                hostId = property.HostId;
            }
            else if (dto.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetServiceByIdAsync(dto.ServiceId.Value);
                if (service == null) throw new KeyNotFoundException("Service not found");
                hostId = service.HostId;
            }
            else if (dto.ExperienceId.HasValue)
            {
                var experience = await _experienceRepository.GetByIdAsync(dto.ExperienceId.Value);
                if (experience == null) throw new KeyNotFoundException("Experience not found");
                hostId = experience.HostId;
            }
            else
            {
                throw new ArgumentException("Either PropertyId or ServiceId must be provided.");
            }

            // 2. Check Existing Conversation (Needs update in Repo to support ServiceId)
            // For now, we assume it checks PropertyId. Ideally, Repo should have GetByServiceId too.
            // If using PropertyId field for everything (temporary hack), it works.
            // If using separate fields, you need to update Repo.

            // Assuming Repo updated or using PropertyId logic for now:
            var existingConversation = await _messageRepository.GetConversationBetweenUsersAsync(
                hostId, guestId, dto.PropertyId ?? 0); // 0 or ServiceId logic needed in Repo

            if (existingConversation != null)
            {
                return MapToConversationDto(existingConversation, senderId);
            }

            // 3. Create New Conversation
            var conversation = new Conversation
            {
                PropertyId = dto.PropertyId,
                ServiceId = dto.ServiceId, 
                ExperienceId = dto.ExperienceId,
                HostId = hostId,
                GuestId = guestId,
                CreatedAt = DateTime.UtcNow
            };

            conversation = await _messageRepository.CreateConversationAsync(conversation);

            // 4. Send Initial Message
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
            var messageDto = MapToMessageDto(message);
            await _hubContext.Clients.Group(dto.ConversationId.ToString())
                             .SendAsync("ReceiveMessage", messageDto);

            return MapToMessageDto(message);
        }

        public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
        {
            return await _messageRepository.MarkMessageAsReadAsync(messageId, userId);
        }

        public async Task<bool> MarkConversationAsReadAsync(int conversationId, string userId)
        {
            var conversation = await _messageRepository.GetConversationByIdAsync(conversationId);
            if (conversation == null) return false;
            if (conversation.HostId != userId && conversation.GuestId != userId) return false;

            return await _messageRepository.MarkConversationAsReadAsync(conversationId, userId);
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _messageRepository.GetUnreadCountAsync(userId);
        }

        public async Task DeleteMessageAsync(int messageId, string userId)
        {
            var message = await _messageRepository.GetMessageByIdAsync(messageId);

            if (message == null) throw new KeyNotFoundException("Message not found");
            if (message.SenderId != userId) throw new UnauthorizedAccessException("You can only delete your own messages");

            await _messageRepository.DeleteMessageAsync(messageId);
        }

        // ==========================================
        // Helper to Support Services
        // ==========================================
        private ConversationDto MapToConversationDto(Conversation conversation, string currentUserId)
        {
            var isHost = conversation.HostId == currentUserId;
            var otherUser = isHost ? conversation.Guest : conversation.Host;

            var unreadCount = conversation.Messages?
                .Count(m => m.ReceiverId == currentUserId && !m.IsRead && m.DeletedAt == null) ?? 0;

            // Determine Title & Image (Property OR Service)
            string title = "Unknown";
            string image = "https://via.placeholder.com/150";

            if (conversation.Property != null)
            {
                title = conversation.Property.Title;
                image = conversation.Property.Images?
                    .Where(i => i.IsPrimary)
                    .Select(i => i.ImageUrl)
                    .FirstOrDefault()
                    ?? conversation.Property.Images?
                        .OrderBy(i => i.DisplayOrder)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault() ?? image;
            }
            else if (conversation.Service != null) 
            {
                title = conversation.Service.Title;
                image = conversation.Service.Images?
                    .Where(i => i.IsCover)
                    .Select(i => i.Url)
                    .FirstOrDefault()
                    ?? conversation.Service.Images?
                        .Select(i => i.Url)
                        .FirstOrDefault() ?? image;
            }
            else if (conversation.Experience != null)
            {
                title = conversation.Experience.Title;
                
                image = conversation.Experience.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                        ?? conversation.Experience.Images?.FirstOrDefault()?.ImageUrl
                        ?? image;
            }
            return new ConversationDto
            {
                Id = conversation.Id,
                PropertyId = conversation.PropertyId,
                ServiceId = conversation.ServiceId,

                PropertyTitle = title, 
                PropertyImage = image, 

                BookingId = conversation.BookingId,

                Host = new ConversationParticipantDto
                {
                    UserId = conversation.Host.Id,
                    UserType = "host",
                    Name = $"{conversation.Host.FirstName} {conversation.Host.LastName}",
                    Avatar = conversation.Host.ProfileImageUrl,
                    IsOnline = false
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
                UnreadCount = unreadCount,
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
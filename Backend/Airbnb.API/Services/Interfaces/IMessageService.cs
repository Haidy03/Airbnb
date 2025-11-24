using Airbnb.API.DTOs.Messages;

namespace Airbnb.API.Services.Interfaces
{
    public interface IMessageService
    {
        Task<IEnumerable<ConversationDto>> GetUserConversationsAsync(string userId);
        Task<ConversationDto?> GetConversationByIdAsync(int conversationId, string userId);
        Task<ConversationDto> CreateConversationAsync(string hostId, CreateConversationDto dto);
        Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(int conversationId, string userId, int pageNumber = 1, int pageSize = 50);
        Task<MessageDto> SendMessageAsync(string senderId, SendMessageDto dto);
        Task<bool> MarkMessageAsReadAsync(int messageId, string userId);
        Task<bool> MarkConversationAsReadAsync(int conversationId, string userId);
        Task<int> GetUnreadCountAsync(string userId);
        Task DeleteMessageAsync(int messageId, string userId);
    }
}
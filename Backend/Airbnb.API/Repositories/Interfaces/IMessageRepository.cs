using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IMessageRepository
    {
        Task<IEnumerable<Conversation>> GetUserConversationsAsync(string userId);
        Task<Conversation?> GetConversationByIdAsync(int conversationId);
        Task<Conversation?> GetConversationBetweenUsersAsync(string userId1, string userId2, int? propertyId = null);
        Task<Conversation> CreateConversationAsync(Conversation conversation);
        Task<IEnumerable<Message>> GetConversationMessagesAsync(int conversationId, int pageNumber = 1, int pageSize = 50);
        Task<Message> SendMessageAsync(Message message);
        Task<bool> MarkMessageAsReadAsync(int messageId, string userId);
        Task<bool> MarkConversationAsReadAsync(int conversationId, string userId);
        Task<int> GetUnreadCountAsync(string userId);
        Task<Message?> GetMessageByIdAsync(int messageId);
        Task DeleteMessageAsync(int messageId);
    }
}
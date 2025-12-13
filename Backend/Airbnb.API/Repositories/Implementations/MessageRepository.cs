using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class MessageRepository : IMessageRepository
    {
        private readonly ApplicationDbContext _context;

        public MessageRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Conversation>> GetUserConversationsAsync(string userId)
        {
            return await _context.Conversations
                .Include(c => c.Property)
                    .ThenInclude(p => p.Images)
                    .Include(c => c.Service)
                    .ThenInclude(s => s.Images)
                    .Include(c => c.Experience)
                    .ThenInclude(e => e.Images)
                .Include(c => c.Host)
                .Include(c => c.Guest)

                .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .Where(c => c.HostId == userId || c.GuestId == userId)
                .OrderByDescending(c => c.UpdatedAt)
                .ToListAsync();
        }

        public async Task<Conversation?> GetConversationByIdAsync(int conversationId)
        {
            return await _context.Conversations
                .Include(c => c.Property)
                    .ThenInclude(p => p.Images)
                    .Include(c => c.Service)
                    .ThenInclude(s => s.Images)
                .Include(c => c.Experience)
                    .ThenInclude(e => e.Images)
                .Include(c => c.Host)
                .Include(c => c.Guest)
                .Include(c => c.Messages)
                    .ThenInclude(m => m.Attachments)
                .FirstOrDefaultAsync(c => c.Id == conversationId);
        }

        public async Task<Conversation?> GetConversationBetweenUsersAsync(string userId1, string userId2, int? propertyId = null)
        {
            var query = _context.Conversations
                .Include(c => c.Property)
                .Include(c => c.Host)
                .Include(c => c.Guest)
                .Where(c => (c.HostId == userId1 && c.GuestId == userId2) ||
                           (c.HostId == userId2 && c.GuestId == userId1));

            if (propertyId.HasValue)
            {
                query = query.Where(c => c.PropertyId == propertyId.Value);
            }

            return await query.FirstOrDefaultAsync();
        }

        public async Task<Conversation> CreateConversationAsync(Conversation conversation)
        {
            await _context.Conversations.AddAsync(conversation);
            await _context.SaveChangesAsync();
            return conversation;
        }

        public async Task<IEnumerable<Message>> GetConversationMessagesAsync(int conversationId, int pageNumber = 1, int pageSize = 50)
        {
            return await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Attachments)
                .Where(m => m.ConversationId == conversationId && m.DeletedAt == null)
                .OrderByDescending(m => m.SentAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Message> SendMessageAsync(Message message)
        {
            await _context.Messages.AddAsync(message);

            // Update conversation's UpdatedAt
            var conversation = await _context.Conversations.FindAsync(message.ConversationId);
            if (conversation != null)
            {
                conversation.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Reload with related data
            return await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Attachments)
                .FirstAsync(m => m.Id == message.Id);
        }

        public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
        {
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null || message.ReceiverId != userId)
                return false;

            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> MarkConversationAsReadAsync(int conversationId, string userId)
        {
            var messages = await _context.Messages
                .Where(m => m.ConversationId == conversationId &&
                           m.ReceiverId == userId &&
                           !m.IsRead)
                .ToListAsync();

            foreach (var message in messages)
            {
                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Messages
                .Where(m => m.ReceiverId == userId
                            && !m.IsRead
                            && m.DeletedAt == null
                            && _context.Conversations.Any(c => c.Id == m.ConversationId))
                .CountAsync();
        }

        public async Task<Message?> GetMessageByIdAsync(int messageId)
        {
            return await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Attachments)
                .FirstOrDefaultAsync(m => m.Id == messageId);
        }

        public async Task DeleteMessageAsync(int messageId)
        {
            var message = await _context.Messages.FindAsync(messageId);
            if (message != null)
            {
                message.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
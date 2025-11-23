using System;

namespace Airbnb.API.DTOs.Messages
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string SenderAvatar { get; set; }
        public string ReceiverId { get; set; }
        public string ReceiverName { get; set; }
        public string Content { get; set; }
        public string MessageType { get; set; }
        public bool IsRead { get; set; }
        public bool IsDelivered { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ReadAt { get; set; }
        public List<MessageAttachmentDto> Attachments { get; set; } = new();
    }

    public class MessageAttachmentDto
    {
        public int Id { get; set; }
        public string AttachmentType { get; set; }
        public string FileUrl { get; set; }
        public string FileName { get; set; }
        public long FileSize { get; set; }
        public string? MimeType { get; set; }
    }
}
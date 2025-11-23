using System;

namespace Airbnb.API.DTOs.Messages
{
    public class ConversationDto
    {
        public int Id { get; set; }
        public int? PropertyId { get; set; }
        public string? PropertyTitle { get; set; }
        public string? PropertyImage { get; set; }
        public int? BookingId { get; set; }
        public ConversationParticipantDto Host { get; set; }
        public ConversationParticipantDto Guest { get; set; }
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class ConversationParticipantDto
    {
        public string UserId { get; set; }
        public string UserType { get; set; }
        public string Name { get; set; }
        public string? Avatar { get; set; }
        public bool IsOnline { get; set; }
        public DateTime? LastSeenAt { get; set; }
    }
}
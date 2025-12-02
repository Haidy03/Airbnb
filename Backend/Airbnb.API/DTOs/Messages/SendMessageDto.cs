using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Messages
{
    public class SendMessageDto
    {
        [Required]
        public int ConversationId { get; set; }

        [Required]
        [MaxLength(5000)]
        public string Content { get; set; }

        [MaxLength(50)]
        public string MessageType { get; set; } = "text";
    }

    public class CreateConversationDto
    {
        //[Required]
        public int? PropertyId { get; set; }
        public int? ServiceId { get; set; }
        public int? ExperienceId { get; set; }

        [Required]
        public string GuestId { get; set; }

        [Required]
        [MaxLength(5000)]
        public string InitialMessage { get; set; }
    }
}
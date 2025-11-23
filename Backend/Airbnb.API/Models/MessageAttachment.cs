using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class MessageAttachment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MessageId { get; set; }

        [ForeignKey("MessageId")]
        public virtual Message Message { get; set; }

        [Required]
        [MaxLength(50)]
        public string AttachmentType { get; set; } // image, document, video

        [Required]
        public string FileUrl { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; }

        public long FileSize { get; set; }

        [MaxLength(100)]
        public string? MimeType { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
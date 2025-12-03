using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ServiceReview
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ServiceId { get; set; }
        [ForeignKey("ServiceId")]
        public virtual Service Service { get; set; }

        [Required]
        public int ServiceBookingId { get; set; }
        [ForeignKey("ServiceBookingId")]
        public virtual ServiceBooking Booking { get; set; }

        [Required]
        public string ReviewerId { get; set; }
        [ForeignKey("ReviewerId")]
        public virtual ApplicationUser Reviewer { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // تفاصيل إضافية اختيارية لتكون متناسقة مع باقي النظام
        public int? HostRating { get; set; }
        public int? ValueRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? LocationRating { get; set; }
        public int? CleanlinessRating { get; set; }
    }
}
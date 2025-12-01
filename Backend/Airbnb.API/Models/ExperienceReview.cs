using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ExperienceReview
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ExperienceBookingId { get; set; }

        [ForeignKey("ExperienceBookingId")]
        public virtual ExperienceBooking Booking { get; set; }

        [Required]
        public int ExperienceId { get; set; }

        [ForeignKey("ExperienceId")]
        public virtual Experience Experience { get; set; }

        [Required]
        public string ReviewerId { get; set; }

        [ForeignKey("ReviewerId")]
        public virtual ApplicationUser Reviewer { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(2000)]
        public string? Comment { get; set; }

        // Detailed Ratings
        public int? HostRating { get; set; }
        public int? ValueRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? LocationRating { get; set; }
        public int? CleanlinessRating { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsApproved { get; set; } = false;
    }
}
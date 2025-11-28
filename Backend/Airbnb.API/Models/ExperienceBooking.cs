using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ExperienceBooking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ExperienceId { get; set; }

        [ForeignKey("ExperienceId")]
        public virtual Experience Experience { get; set; }

        [Required]
        public int AvailabilityId { get; set; }

        [ForeignKey("AvailabilityId")]
        public virtual ExperienceAvailability Availability { get; set; }

        [Required]
        public string GuestId { get; set; }

        [ForeignKey("GuestId")]
        public virtual ApplicationUser Guest { get; set; }

        [Required]
        public int NumberOfGuests { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerPerson { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        [Required]
        public ExperienceBookingStatus Status { get; set; } = ExperienceBookingStatus.Pending;

        [MaxLength(500)]
        public string? SpecialRequests { get; set; }

        [MaxLength(500)]
        public string? CancellationReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ConfirmedAt { get; set; }

        public DateTime? CancelledAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        // Navigation Properties
        public virtual ICollection<ExperienceReview> Reviews { get; set; } = new List<ExperienceReview>();
    }
}
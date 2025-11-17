using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class Booking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        [Required]
        public string GuestId { get; set; }

        [ForeignKey("GuestId")]
        public virtual ApplicationUser Guest { get; set; }

        // Booking Dates
        [Required]
        public DateTime CheckInDate { get; set; }

        [Required]
        public DateTime CheckOutDate { get; set; }

        public int NumberOfGuests { get; set; }
        public int NumberOfNights { get; set; }

        // Pricing
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerNight { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CleaningFee { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        // Status
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } // Pending, Confirmed, Cancelled, Completed

        [MaxLength(500)]
        public string? SpecialRequests { get; set; }

        [MaxLength(500)]
        public string? CancellationReason { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Navigation Properties
        public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
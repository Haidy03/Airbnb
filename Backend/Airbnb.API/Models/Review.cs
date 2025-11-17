using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class Review
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int BookingId { get; set; }

        [ForeignKey("BookingId")]
        public virtual Booking Booking { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        // Reviewer & Reviewee
        [Required]
        public string ReviewerId { get; set; } // Who wrote the review

        [ForeignKey("ReviewerId")]
        public virtual ApplicationUser Reviewer { get; set; }

        [Required]
        public string RevieweeId { get; set; } // Who is being reviewed

        [ForeignKey("RevieweeId")]
        public virtual ApplicationUser Reviewee { get; set; }

        // Review Type
        [Required]
        [MaxLength(50)]
        public string ReviewType { get; set; } // GuestToProperty, HostToGuest

        // Rating & Comment
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        // Detailed Ratings (Optional for property reviews)
        public int? CleanlinessRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? LocationRating { get; set; }
        public int? ValueRating { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public bool IsApproved { get; set; } = true; // Admin moderation
    }
}
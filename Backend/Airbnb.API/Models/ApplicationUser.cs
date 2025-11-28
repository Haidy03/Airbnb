using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; }

        [Required]
        [MaxLength(100)]
        public string LastName { get; set; }

        [MaxLength(500)]
        public string? Bio { get; set; }

        public string? ProfileImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsVerified { get; set; } = false;
        public DateTime? VerifiedAt { get; set; }
        public bool IsBlocked { get; set; } = false;
        public string? BlockReason { get; set; }
        public DateTime? BlockedAt { get; set; }

        // Navigation Properties
        public virtual ICollection<Property> Properties { get; set; } = new List<Property>();
        public virtual ICollection<Booking> GuestBookings { get; set; } = new List<Booking>();
        public virtual ICollection<Review> ReviewsGiven { get; set; } = new List<Review>();
        public virtual ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
        public UserVerification? Verification { get; set; }
        // Path to the ID photo (Secure storage)
        public string? IdentificationImagePath { get; set; }
        public string VerificationStatus { get; set; } = "None"; // Pending, Approved, Rejected

        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
    }
}
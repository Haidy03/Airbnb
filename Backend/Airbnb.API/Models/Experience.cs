using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace Airbnb.API.Models
{
    public class Experience
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        [MaxLength(3000)]
        public string Description { get; set; }

        [Required]
        public string HostId { get; set; }

        [ForeignKey("HostId")]
        public virtual ApplicationUser Host { get; set; }

        // Category & Type
        [Required]
        public int CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public virtual ExperienceCategory Category { get; set; }

        [Required]
        [MaxLength(50)]
        public ExperienceType Type { get; set; } // InPerson, Online, Adventure

        // Location (for in-person experiences)
        [MaxLength(200)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? Country { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        // Duration & Capacity
        [Required]
        public int DurationHours { get; set; }

        public int? DurationMinutes { get; set; }

        [Required]
        public int MinGroupSize { get; set; } = 1;

        [Required]
        public int MaxGroupSize { get; set; }

        // Pricing
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerPerson { get; set; }

        [MaxLength(50)]
        public string PricingType { get; set; } = "PerPerson"; // PerPerson, PerGroup

        // Requirements & Details
        [MaxLength(50)]
        public string? AgeRequirement { get; set; } // "18+", "All ages", "Kids friendly"

        [MaxLength(50)]
        public string? SkillLevel { get; set; } // Beginner, Intermediate, Advanced

        [MaxLength(1000)]
        public string? WhatToBring { get; set; }

        [MaxLength(1000)]
        public string? WhatIsIncluded { get; set; }

        [MaxLength(1000)]
        public string? CancellationPolicy { get; set; }

        // Status & Approval
        public ExperienceStatus Status { get; set; } = ExperienceStatus.Draft;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public string? RejectionReason { get; set; }

        // Calculated Fields
        [NotMapped]
        public double AverageRating
        {
            get
            {
                if (Reviews == null || !Reviews.Any()) return 0;
                return Reviews.Average(r => r.Rating);
            }
        }

        [NotMapped]
        public int TotalReviews
        {
            get { return Reviews?.Count ?? 0; }
        }

        // Navigation Properties
        public virtual ICollection<ExperienceImage> Images { get; set; } = new List<ExperienceImage>();
        public virtual ICollection<ExperienceLanguage> Languages { get; set; } = new List<ExperienceLanguage>();
        public virtual ICollection<ExperienceAvailability> Availabilities { get; set; } = new List<ExperienceAvailability>();
        public virtual ICollection<ExperienceBooking> Bookings { get; set; } = new List<ExperienceBooking>();
        public virtual ICollection<ExperienceReview> Reviews { get; set; } = new List<ExperienceReview>();
    }
}

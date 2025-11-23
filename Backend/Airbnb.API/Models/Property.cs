using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace Airbnb.API.Models
{
    public class Property
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; }

        [Required]
        public string HostId { get; set; }

        [ForeignKey("HostId")]
        public virtual ApplicationUser Host { get; set; }

        // Location Details
        [Required]
        [MaxLength(200)]
        public string Address { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; }

        [Required]
        [MaxLength(100)]
        public string Country { get; set; }

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        // Property Type - UPDATED to use FK relationship
        [Required]
        public int PropertyTypeId { get; set; }

        [ForeignKey("PropertyTypeId")]
        public virtual PropertyType PropertyType { get; set; }

        public string? CurrentStep { get; set; }                                    // for the stepss in the front

        public int NumberOfBedrooms { get; set; }
        public int NumberOfBathrooms { get; set; }
        public int MaxGuests { get; set; }

        // Pricing
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerNight { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CleaningFee { get; set; }

        // Rules & Info
        [MaxLength(1000)]
        public string? HouseRules { get; set; }

        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }

        public int MinimumStay { get; set; } = 1;

        // Status
        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; } = false;

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

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

        public PropertyStatus Status { get; set; } = PropertyStatus.PendingApproval;
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovedByAdminId { get; set; }
        public string? RejectionReason { get; set; }

        // Navigation Properties
        public virtual ICollection<PropertyImage> Images { get; set; } = new List<PropertyImage>();
        public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
        public virtual ICollection<PropertyAmenity> PropertyAmenities { get; set; } = new List<PropertyAmenity>();
        public virtual ICollection<PropertyAvailability> Availabilities { get; set; } = new List<PropertyAvailability>();
    }
}
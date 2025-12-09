using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class Service
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string HostId { get; set; }
        [ForeignKey("HostId")]
        public virtual ApplicationUser Host { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } 

        [Required]
        public string Description { get; set; }
        public int MaxGuests { get; set; } = 1;

        public string? TimeSlots { get; set; }
        public int DurationMinutes { get; set; } = 60;

        [Required]
        public int CategoryId { get; set; }
        [ForeignKey("CategoryId")]
        public virtual ServiceCategory Category { get; set; }

        // --- Pricing Logic ---
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerUnit { get; set; } 

        [Required]
        public ServicePricingUnit PricingUnit { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinimumCost { get; set; } = 0; 

        [Required]
        [MaxLength(10)]
        public string Currency { get; set; } = "EGP";

        // --- Location Logic ---
        public ServiceLocationType LocationType { get; set; } 

       
        public string? CoveredAreas { get; set; }

        // If OnSite: Where is it?
        public string? City { get; set; }
        public string? Address { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        // --- Media ---
        public virtual ICollection<ServiceImage> Images { get; set; } = new List<ServiceImage>();

        // --- Status ---
        public ServiceStatus Status { get; set; } = ServiceStatus.Draft;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }

        public string? RejectionReason { get; set; }
        public bool IsActive { get; set; } = true;
        public double AverageRating { get; set; } 
        public int ReviewCount { get; set; }

        public string? CancellationPolicy { get; set; }
        public string? GuestRequirements { get; set; }

        public virtual ICollection<ServiceQualification> Qualifications { get; set; } = new List<ServiceQualification>();
        public virtual ICollection<ServicePackage> Packages { get; set; } = new List<ServicePackage>();
        public virtual ICollection<ServiceReview> Reviews { get; set; } = new List<ServiceReview>();

        public virtual ICollection<ServiceAvailability> Availabilities { get; set; } = new List<ServiceAvailability>();

    }
}
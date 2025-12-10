using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ServiceBooking
    {
        [Key]
        public int Id { get; set; }

        public int ServiceId { get; set; }
        [ForeignKey("ServiceId")]
        public virtual Service Service { get; set; }
        public int NumberOfGuests { get; set; }
        public int? PackageId { get; set; } 
        [ForeignKey("PackageId")]
        public virtual ServicePackage Package { get; set; }

        public string GuestId { get; set; }
        [ForeignKey("GuestId")]
        public virtual ApplicationUser Guest { get; set; }

        public DateTime BookingDate { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        public string Status { get; set; } = "Pending"; // Pending, Confirmed, Cancelled, Completed
        public string? PaymentIntentId { get; set; } // Stripe Payment ID
    }
}
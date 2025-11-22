using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.Models
{
    public class UserVerification
    {
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        [Required]
        public string IdType { get; set; } // "NationalId", "Passport", "DriverLicense"

        [Required]
        public string IdNumber { get; set; }

        [Required]
        public string IdImageUrl { get; set; } // صورة الهوية

        public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

        public string? AdminNotes { get; set; }

        public string? RejectionReason { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReviewedAt { get; set; }

        public string? ReviewedByAdminId { get; set; }
    }
}
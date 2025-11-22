using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Admin
{
    public class RejectVerificationDto
    {
        [Required]
        [MaxLength(500)]
        public string RejectionReason { get; set; }

        public string? AdminNotes { get; set; }
    }
}

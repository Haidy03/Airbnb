using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Admin
{
    public class RejectPropertyDto
    {
        [Required]
        [MaxLength(500)]
        public string RejectionReason { get; set; }
    }
}

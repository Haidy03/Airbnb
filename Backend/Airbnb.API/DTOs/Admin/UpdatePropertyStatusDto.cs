using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Admin
{
    public class UpdatePropertyStatusDto
    {
        [Required]
        public string Status { get; set; } // "Active", "Inactive", "Suspended"

        public string? Reason { get; set; }
    }
}

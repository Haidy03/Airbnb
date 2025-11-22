using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Admin
{
    public class BlockUserDto
    {
        [Required]
        public bool IsBlocked { get; set; }

        [Required(ErrorMessage = "Block reason is required")]
        [MaxLength(500)]
        public string Reason { get; set; }
    }
}

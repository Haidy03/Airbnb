using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Admin
{
    public class SubmitVerificationDto
    {
        [Required]
        public string IdType { get; set; }

        [Required]
        public string IdNumber { get; set; }

        [Required]
        public IFormFile IdImage { get; set; }
    }
}

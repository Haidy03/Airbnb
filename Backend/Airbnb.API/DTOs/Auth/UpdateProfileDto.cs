using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Auth
{
    public class UpdateProfileDto
    {
        [Required]
        [StringLength(100, ErrorMessage = "First name cannot be longer than 100 characters.")]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "Last name cannot be longer than 100 characters.")]
        public string LastName { get; set; }

        [StringLength(500, ErrorMessage = "Bio cannot be longer than 500 characters.")]
        public string? Bio { get; set; }
        public string? ProfileImageUrl { get; set; }

        // ==========================================
        // الإضافات الجديدة 
        // ==========================================

        [Phone]
        public string? PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? Address { get; set; }

        public string? City { get; set; }

        public string? Country { get; set; }
    }
}
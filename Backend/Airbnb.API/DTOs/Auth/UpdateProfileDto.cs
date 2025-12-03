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

        [Phone]
        public string? PhoneNumber { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public string? Address { get; set; }

        public string? City { get; set; }

        public string? Country { get; set; }
        public string? AboutMe { get; set; }
        public string? WhereToGo { get; set; }
        public string? MyWork { get; set; }
        public string? SpendTime { get; set; }
        public string? Pets { get; set; }
        public string? BornDecade { get; set; }
        public string? School { get; set; }
        public string? UselessSkill { get; set; }
        public string? FunFact { get; set; }
        public string? FavoriteSong { get; set; }
        public string? ObsessedWith { get; set; }
        public string? BiographyTitle { get; set; }
        public string? Languages { get; set; }
        public string? WhereILive { get; set; }
    }
}
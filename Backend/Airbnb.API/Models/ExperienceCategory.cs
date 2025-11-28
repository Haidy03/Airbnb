using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.Models
{
    public class ExperienceCategory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Icon { get; set; }

        public bool IsActive { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;

        // Navigation Properties
        public virtual ICollection<Experience> Experiences { get; set; } = new List<Experience>();
    }
}
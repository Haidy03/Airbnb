using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ExperienceImage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ExperienceId { get; set; }

        [ForeignKey("ExperienceId")]
        public virtual Experience Experience { get; set; }

        [Required]
        public string ImageUrl { get; set; }

        public bool IsPrimary { get; set; } = false;

        public int DisplayOrder { get; set; } = 0;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
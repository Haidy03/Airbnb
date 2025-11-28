using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ExperienceAvailability
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ExperienceId { get; set; }

        [ForeignKey("ExperienceId")]
        public virtual Experience Experience { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }

        [Required]
        public TimeSpan EndTime { get; set; }

        public int AvailableSpots { get; set; }

        public bool IsAvailable { get; set; } = true;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CustomPrice { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

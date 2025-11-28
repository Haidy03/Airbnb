using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class Wishlist
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser User { get; set; }

        public int? ExperienceId { get; set; }

        [ForeignKey("ExperienceId")]
        public virtual Experience Experience { get; set; }

        public int? PropertyId { get; set; } // أو string حسب نوع الـ ID عندك
        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
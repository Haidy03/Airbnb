using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ExperienceLanguage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ExperienceId { get; set; }

        [ForeignKey("ExperienceId")]
        public virtual Experience Experience { get; set; }

        [Required]
        [MaxLength(50)]
        public string LanguageCode { get; set; } // en, ar, fr, etc.

        [Required]
        [MaxLength(100)]
        public string LanguageName { get; set; } // English, Arabic, French
    }
}
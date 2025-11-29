using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.Models
{
    public class ServiceCategory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public string? Icon { get; set; }

        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
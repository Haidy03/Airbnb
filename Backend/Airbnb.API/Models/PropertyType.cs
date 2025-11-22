using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class PropertyType
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty; // HOUSE, APARTMENT, etc.

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty; // House, Apartment, etc.

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string IconType { get; set; } = string.Empty; // house, apartment, barn, etc.

        public bool IsActive { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;

        [MaxLength(50)]
        public string? Category { get; set; } // RESIDENTIAL, UNIQUE, OUTDOOR

        // Navigation property
        public virtual ICollection<Property> Properties { get; set; } = new List<Property>();
    }
}
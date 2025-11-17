using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class Amenity
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(200)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string? Icon { get; set; } // Icon class or URL

        [MaxLength(50)]
        public string Category { get; set; } // Basic, Entertainment, Safety, etc.

        public bool IsActive { get; set; } = true;

        // Navigation Properties
        public virtual ICollection<PropertyAmenity> PropertyAmenities { get; set; } = new List<PropertyAmenity>();
    }
}
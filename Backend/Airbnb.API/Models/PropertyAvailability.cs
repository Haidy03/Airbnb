using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class PropertyAvailability
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property Property { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public bool IsAvailable { get; set; } = true;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? CustomPrice { get; set; } // Override default price

        [MaxLength(200)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
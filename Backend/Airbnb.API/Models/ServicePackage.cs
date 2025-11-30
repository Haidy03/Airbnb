using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public class ServicePackage
    {
        public int Id { get; set; }
        public int ServiceId { get; set; }
        public string Title { get; set; } // e.g. "Sun-sweat mini session"
        public string Description { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
        public string Duration { get; set; } // e.g. "30 mins", "1 hr"
        public string? ImageUrl { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Experiences
{
    public class CreateAvailabilityDto
    {
        [Required]
        public DateTime Date { get; set; }

        [Required]
        public string StartTime { get; set; } // Format: "HH:mm:ss"

        [Required]
        public string EndTime { get; set; }   // Format: "HH:mm:ss"

        [Required]
        [Range(1, 1000)]
        public int AvailableSpots { get; set; }

        public decimal? CustomPrice { get; set; }
    }
}
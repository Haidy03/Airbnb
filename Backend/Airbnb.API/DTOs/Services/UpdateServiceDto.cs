using System.ComponentModel.DataAnnotations;
using Airbnb.API.Models;

namespace Airbnb.API.DTOs.Services
{
    public class UpdateServiceDto
    {
        [Required]
        public string Title { get; set; }

        [Required]
        public string Description { get; set; }

        [Required]
        public decimal PricePerUnit { get; set; }

        public int MaxGuests { get; set; }

        public string City { get; set; }

        public ServiceLocationType LocationType { get; set; }

        public int DurationMinutes { get; set; }
        public string? AvailabilityJson { get; set; }
       // public List<string>? TimeSlots { get; set; }
    }
}
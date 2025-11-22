using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Booking
{
    public class CreateBookingDto
    {
        [Required]
        public int PropertyId { get; set; }

        [Required]
        public DateTime CheckInDate { get; set; }

        [Required]
        public DateTime CheckOutDate { get; set; }

        [Required]
        [Range(1, 20, ErrorMessage = "Guests must be between 1 and 20")]
        public int NumberOfGuests { get; set; }

        [MaxLength(500)]
        public string? SpecialRequests { get; set; }
    }
}
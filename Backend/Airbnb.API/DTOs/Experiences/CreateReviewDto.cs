using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Experiences
{
    public class CreateReviewDto
    {
        [Required]
        public int BookingId { get; set; }

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }
}
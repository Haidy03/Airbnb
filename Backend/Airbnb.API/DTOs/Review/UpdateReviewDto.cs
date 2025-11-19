using System.ComponentModel.DataAnnotations;
namespace Airbnb.API.DTOs.Review
{
    public class UpdateReviewDto
    {
        [Required(ErrorMessage = "Rating is required")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(1000, ErrorMessage = "Comment cannot exceed 1000 characters")]
        public string? Comment { get; set; }

        [Range(1, 5)]
        public int? CleanlinessRating { get; set; }

        [Range(1, 5)]
        public int? CommunicationRating { get; set; }

        [Range(1, 5)]
        public int? LocationRating { get; set; }

        [Range(1, 5)]
        public int? ValueRating { get; set; }
    }
}

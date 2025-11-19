namespace Airbnb.API.DTOs.Review
{
    public class PropertyReviewsSummaryDto
    {
        public int PropertyId { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public double? AverageCleanlinessRating { get; set; }
        public double? AverageCommunicationRating { get; set; }
        public double? AverageLocationRating { get; set; }
        public double? AverageValueRating { get; set; }
        public List<ReviewResponseDto> Reviews { get; set; } = new();
    }

    public class GuestReviewsSummaryDto
    {
        public string GuestId { get; set; }
        public string GuestName { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public List<ReviewResponseDto> Reviews { get; set; } = new();
    }

    public class CanReviewResponseDto
    {
        public bool CanReview { get; set; }
        public string? Reason { get; set; }
        public int? BookingId { get; set; }
    }
}

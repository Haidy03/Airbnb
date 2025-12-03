namespace Airbnb.API.DTOs.Review
{
    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public int BookingId { get; set; }
        public int PropertyId { get; set; }
        public int? ServiceId { get; set; }
        public string PropertyTitle { get; set; }
        public string ReviewType { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }

        // Detailed ratings
        public int? CleanlinessRating { get; set; }
        public int? CommunicationRating { get; set; }
        public int? LocationRating { get; set; }
        public int? ValueRating { get; set; }

        // Reviewer info
        public string ReviewerId { get; set; }
        public string ReviewerName { get; set; }
        public string? ReviewerProfileImage { get; set; }

        // Reviewee info
        public string RevieweeId { get; set; }
        public string RevieweeName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsApproved { get; set; }
    }
}

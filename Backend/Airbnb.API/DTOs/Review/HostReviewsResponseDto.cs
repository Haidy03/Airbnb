namespace Airbnb.API.DTOs.Review
{
    public class HostReviewsResponseDto
    {
      
        public double OverallRating { get; set; }
        public int TotalReviews { get; set; }

        
        public double CleanlinessAvg { get; set; }
        public double CommunicationAvg { get; set; }
        public double LocationAvg { get; set; }
        public double ValueAvg { get; set; }

        
        public List<ReviewResponseDto> Reviews { get; set; } = new();
    }
}
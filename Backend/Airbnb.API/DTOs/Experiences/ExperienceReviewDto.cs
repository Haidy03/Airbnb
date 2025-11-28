namespace Airbnb.API.DTOs.Experiences
{
    public class ExperienceReviewDto
    {
        public int Id { get; set; }
        public string ReviewerName { get; set; }
        public string ReviewerAvatar { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
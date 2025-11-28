namespace Airbnb.API.DTOs.Experiences
{
    public class ExperienceAvailabilityDto
    {
        public int Id { get; set; }
        public int ExperienceId { get; set; }
        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public int AvailableSpots { get; set; }
        public bool IsAvailable { get; set; }
        public decimal? CustomPrice { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

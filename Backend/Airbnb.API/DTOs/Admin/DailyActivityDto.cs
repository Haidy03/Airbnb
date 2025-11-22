namespace Airbnb.API.DTOs.Admin
{
    public class DailyActivityDto
    {
        public DateTime Date { get; set; }
        public int NewUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int Bookings { get; set; }
    }
}

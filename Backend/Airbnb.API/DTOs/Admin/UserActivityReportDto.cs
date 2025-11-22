namespace Airbnb.API.DTOs.Admin
{
    public class UserActivityReportDto
    {
        public int NewUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int NewHosts { get; set; }
        public int NewGuests { get; set; }
        public List<DailyActivityDto> DailyActivity { get; set; }
    }
}

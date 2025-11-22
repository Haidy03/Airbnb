namespace Airbnb.API.DTOs.Admin
{
    public class MonthlyRevenueDto
    {
        public string Month { get; set; }
        public decimal Revenue { get; set; }
        public int BookingsCount { get; set; }
    }
}

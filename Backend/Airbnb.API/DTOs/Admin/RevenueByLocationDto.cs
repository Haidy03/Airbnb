namespace Airbnb.API.DTOs.Admin
{
    public class RevenueByLocationDto
    {
        public string Location { get; set; }
        public decimal Revenue { get; set; }
        public int BookingsCount { get; set; }
    }
}

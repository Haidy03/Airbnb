namespace Airbnb.API.DTOs.Admin
{
    public class RevenueReportDto
    {
        public string Period { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal PlatformFees { get; set; }
        public decimal HostPayouts { get; set; }
        public int TotalBookings { get; set; }
        public decimal AverageBookingValue { get; set; }
        public List<RevenueByLocationDto> RevenueByLocation { get; set; }
    }
}

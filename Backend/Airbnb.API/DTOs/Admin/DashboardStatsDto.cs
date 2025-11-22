namespace Airbnb.API.DTOs.Admin
{
    public class DashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalHosts { get; set; }
        public int TotalGuests { get; set; }
        public int ActiveUsers { get; set; }
        public int BlockedUsers { get; set; }
        public int PendingVerifications { get; set; }

        public int TotalProperties { get; set; }
        public int ActiveProperties { get; set; }
        public int PendingProperties { get; set; }

        public int TotalBookings { get; set; }
        public int ActiveBookings { get; set; }
        public int CompletedBookings { get; set; }
        public int CancelledBookings { get; set; }

        public decimal TotalRevenue { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public decimal PlatformFees { get; set; }

        public int TotalReviews { get; set; }
        public double AverageRating { get; set; }

        public int OpenDisputes { get; set; }
        public int ResolvedDisputes { get; set; }

        public List<MonthlyRevenueDto> RevenueByMonth { get; set; }
        public List<PropertyTypeStatsDto> PropertyTypeStats { get; set; }
        public List<BookingStatusStatsDto> BookingStatusStats { get; set; }
    }
}

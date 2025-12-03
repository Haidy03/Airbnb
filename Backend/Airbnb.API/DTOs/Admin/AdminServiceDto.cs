namespace Airbnb.API.DTOs.Admin
{
    public class AdminServiceDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string CategoryName { get; set; }
        public decimal PricePerUnit { get; set; }
        public string PricingUnit { get; set; }
        public string HostName { get; set; }
        public string Status { get; set; }
        public string? ImageUrl { get; set; }
        public int TotalBookings { get; set; }
        public decimal TotalRevenue { get; set; }
        public double? AverageRating { get; set; }
        public int ReviewsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? RejectionReason { get; set; }
    }
}

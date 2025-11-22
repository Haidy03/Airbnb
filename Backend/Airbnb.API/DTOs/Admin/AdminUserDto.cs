namespace Airbnb.API.DTOs.Admin
{
    public class AdminUserDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; }
        public bool IsVerified { get; set; }
        public bool IsBlocked { get; set; }
        public string? BlockReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }

        // Stats
        public int TotalBookings { get; set; }
        public int TotalProperties { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal TotalEarned { get; set; }
        public int ReviewsCount { get; set; }
        public double? AverageRating { get; set; }
    }
}

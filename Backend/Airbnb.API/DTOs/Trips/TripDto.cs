namespace Airbnb.API.DTOs.Booking
{
    public class TripDto
    {
        public int Id { get; set; } // BookingId
        public string Type { get; set; } // "Property" or "Experience"

        public string Title { get; set; }
        public string ImageUrl { get; set; }
        public string HostName { get; set; }

        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; } // For Experience, same as CheckIn or EndTime

        public decimal TotalPrice { get; set; }
        public string Status { get; set; } // Confirmed, Completed, Cancelled, etc.

        public bool CanReview { get; set; } // ✅ الحل السحري للتحكم في زر التقييم
        public bool IsReviewed { get; set; }
    }
}
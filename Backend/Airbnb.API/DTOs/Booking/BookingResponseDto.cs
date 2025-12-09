namespace Airbnb.API.DTOs.Booking
{
    public class BookingResponseDto
    {
        public int Id { get; set; }
        public string Type { get; set; } = "Property";
        public int? PropertyId { get; set; }
        public int? ExperienceId { get; set; }
        public string ExperienceImage { get; set; } = string.Empty;
        public string ItemTitle { get; set; }
        public string PropertyTitle
        {
            get => ItemTitle;
            set => ItemTitle = value;
        }
        public string PropertyImage { get; set; } = string.Empty;

        public string GuestId { get; set; } = string.Empty;
        public string GuestName { get; set; } = string.Empty;
        public string HostName { get; set; } = string.Empty;
        public string GuestEmail { get; set; } = string.Empty;
        public string? GuestPhone { get; set; }
        public DateTime GuestJoinedDate { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int NumberOfGuests { get; set; }
        public int NumberOfNights { get; set; }

        public decimal PricePerNight { get; set; }
        public decimal CleaningFee { get; set; }
        public decimal TotalPrice { get; set; }
        public string Location { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? SpecialRequests { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }
}

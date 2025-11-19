namespace Airbnb.API.DTOs.Calendar
{
    /// <summary>
    /// Calendar day availability and pricing
    /// </summary>
    public class CalendarDayDto
    {
        public DateTime Date { get; set; }
        public bool IsAvailable { get; set; }
        public decimal Price { get; set; }
        public decimal? OriginalPrice { get; set; } // If custom price is set
        public bool HasBooking { get; set; }
        public int? BookingId { get; set; }
        public string? BookingStatus { get; set; }
        public string? GuestName { get; set; }
        public bool IsCheckIn { get; set; }
        public bool IsCheckOut { get; set; }
        public bool IsBlocked { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Calendar availability response
    /// </summary>
    public class CalendarAvailabilityDto
    {
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<CalendarDayDto> Days { get; set; } = new();
        public CalendarSettingsDto Settings { get; set; } = new();
    }

    /// <summary>
    /// Calendar settings for a property
    /// </summary>
    public class CalendarSettingsDto
    {
        public int PropertyId { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public int MinimumNights { get; set; }
        public int MaximumNights { get; set; }
        public int AdvanceNotice { get; set; } // Days
        public int PreparationTime { get; set; } // Days between bookings
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
    }

    /// <summary>
    /// Update availability for specific dates
    /// </summary>
    public class UpdateAvailabilityDto
    {
        public int PropertyId { get; set; }
        public DateTime Date { get; set; }
        public bool IsAvailable { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Update pricing for specific dates
    /// </summary>
    public class UpdatePricingDto
    {
        public int PropertyId { get; set; }
        public DateTime Date { get; set; }
        public decimal Price { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Bulk update availability for date range
    /// </summary>
    public class BulkUpdateAvailabilityDto
    {
        public int PropertyId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsAvailable { get; set; }
        public decimal? CustomPrice { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Update calendar settings
    /// </summary>
    public class UpdateCalendarSettingsDto
    {
        public int PropertyId { get; set; }
        public decimal? BasePrice { get; set; }
        public decimal? WeekendPrice { get; set; }
        public int? MinimumNights { get; set; }
        public int? MaximumNights { get; set; }
        public int? AdvanceNotice { get; set; }
        public int? PreparationTime { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
    }
}
namespace Airbnb.API.DTOs.Search
{
    public class PropertyDetailsDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }

        // Location
        public string Address { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        // Details
        public int MaxGuests { get; set; }
        public int NumberOfBedrooms { get; set; }
        public int NumberOfBathrooms { get; set; }
        public string PropertyType { get; set; }

        // Rules & Time
        public string? HouseRules { get; set; }
        public string CheckInTime { get; set; } // Formatted string (e.g., "14:00")
        public string CheckOutTime { get; set; }
        public int MinimumStay { get; set; }

        // Price
        public decimal PricePerNight { get; set; }
        public decimal? CleaningFee { get; set; }

        // Host Info (Flattened DTO to avoid circular refs)
        public HostSummaryDto Host { get; set; }

        // Collections
        public List<string> Images { get; set; }
        public List<AmenityDto> Amenities { get; set; }
        public List<ReviewSummaryDto> Reviews { get; set; }
    }

    public class HostSummaryDto
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? ProfileImageUrl { get; set; }
        public DateTime JoinedAt { get; set; }
    }

    public class AmenityDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Icon { get; set; }
        public string Category { get; set; }
    }

    public class ReviewSummaryDto
    {
        public int Id { get; set; }
        public string ReviewerName { get; set; }
        public string? ReviewerImage { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
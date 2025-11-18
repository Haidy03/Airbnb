namespace Airbnb.API.DTOs.Properties
{
    public class PropertyResponseDto
    {
        public int Id { get; set; }
        public string HostId { get; set; } = string.Empty;
        public string HostName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PropertyType { get; set; } = string.Empty;

        // Location
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? PostalCode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        // Capacity
        public int NumberOfBedrooms { get; set; }
        public int NumberOfBathrooms { get; set; }
        public int MaxGuests { get; set; }

        // Pricing
        public decimal PricePerNight { get; set; }
        public decimal? CleaningFee { get; set; }

        // Rules
        public string? HouseRules { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
        public int MinimumStay { get; set; }

        // Status
        public bool IsActive { get; set; }
        public bool IsApproved { get; set; }

        // Stats
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int TotalBookings { get; set; }

        // Images
        public List<PropertyImageDto> Images { get; set; } = new();

        // Amenities
        public List<AmenityDto> Amenities { get; set; } = new();

        // Timestamps
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PropertyImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class AmenityDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Icon { get; set; }
    }
}


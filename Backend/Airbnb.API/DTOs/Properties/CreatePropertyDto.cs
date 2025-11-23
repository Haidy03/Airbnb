namespace Airbnb.API.DTOs.Properties
{
    public class CreatePropertyDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // UPDATED: Use PropertyTypeId instead of string
        public int PropertyTypeId { get; set; }

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
        public int MinimumStay { get; set; } = 1;

        // Amenities
        public List<int> AmenityIds { get; set; } = new();

        public bool HasExteriorCamera { get; set; } = false;
        public bool HasNoiseMonitor { get; set; } = false;
        public bool HasWeapons { get; set; } = false;
    }
}
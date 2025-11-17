namespace Airbnb.API.DTOs.Properties
{
    public class UpdatePropertyDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? PropertyType { get; set; }

        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? PostalCode { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public int? NumberOfBedrooms { get; set; }
        public int? NumberOfBathrooms { get; set; }
        public int? MaxGuests { get; set; }

        public decimal? PricePerNight { get; set; }
        public decimal? CleaningFee { get; set; }

        public string? HouseRules { get; set; }
        public TimeSpan? CheckInTime { get; set; }
        public TimeSpan? CheckOutTime { get; set; }
        public int? MinimumStay { get; set; }

        public List<int>? AmenityIds { get; set; }
    }
}

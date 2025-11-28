namespace Airbnb.API.DTOs.Experiences
{
    public class ExperienceDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string HostId { get; set; }
        public string HostName { get; set; }
        public string? HostAvatar { get; set; }
        public bool IsHostVerified { get; set; }

        public string CategoryName { get; set; }
        public string CategoryIcon { get; set; }
        public string Type { get; set; } // InPerson, Online, Adventure

        public string? City { get; set; }
        public string? Country { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public int DurationHours { get; set; }
        public int? DurationMinutes { get; set; }
        public string FormattedDuration => $"{DurationHours}h {DurationMinutes}min";

        public int MinGroupSize { get; set; }
        public int MaxGroupSize { get; set; }

        public decimal PricePerPerson { get; set; }
        public string PricingType { get; set; }

        public string? AgeRequirement { get; set; }
        public string? SkillLevel { get; set; }
        public string? WhatToBring { get; set; }
        public string? WhatIsIncluded { get; set; }
        public string? CancellationPolicy { get; set; }

        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int TotalBookings { get; set; }

        public List<ExperienceImageDto> Images { get; set; } = new();
        public List<LanguageDto> Languages { get; set; } = new();

        public string Status { get; set; }
        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class ExperienceImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public bool IsPrimary { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class LanguageDto
    {
        public string LanguageCode { get; set; }
        public string LanguageName { get; set; }
    }
}
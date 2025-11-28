namespace Airbnb.API.DTOs.Experiences
{
    public class UpdateExperienceDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? CategoryId { get; set; }
        public string? Type { get; set; }

        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public int? DurationHours { get; set; }
        public int? DurationMinutes { get; set; }

        public int? MinGroupSize { get; set; }
        public int? MaxGroupSize { get; set; }

        public decimal? PricePerPerson { get; set; }
        public string? PricingType { get; set; }

        public string? AgeRequirement { get; set; }
        public string? SkillLevel { get; set; }
        public string? WhatToBring { get; set; }
        public string? WhatIsIncluded { get; set; }
        public string? CancellationPolicy { get; set; }

        public List<string>? LanguageCodes { get; set; }
    }
}

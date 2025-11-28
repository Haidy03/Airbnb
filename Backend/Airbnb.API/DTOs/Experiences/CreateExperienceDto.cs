using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Experiences
{
    public class CreateExperienceDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        [MaxLength(3000)]
        public string Description { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        public string Type { get; set; } // InPerson, Online, Adventure

        // Location (required for InPerson/Adventure)
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        [Required]
        public int DurationHours { get; set; }
        public int? DurationMinutes { get; set; }

        [Required]
        [Range(1, 100)]
        public int MinGroupSize { get; set; }

        [Required]
        [Range(1, 100)]
        public int MaxGroupSize { get; set; }

        [Required]
        [Range(0.01, 999999)]
        public decimal PricePerPerson { get; set; }

        public string PricingType { get; set; } = "PerPerson";

        public string? AgeRequirement { get; set; }
        public string? SkillLevel { get; set; }
        public string? WhatToBring { get; set; }
        public string? WhatIsIncluded { get; set; }
        public string? CancellationPolicy { get; set; }

        public List<string>? LanguageCodes { get; set; }
    }
}
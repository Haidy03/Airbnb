namespace Airbnb.API.DTOs.Experiences
{
    public class ExperienceSearchDto
    {
        public string? Location { get; set; }
        public DateTime? Date { get; set; }
        public int? Guests { get; set; }

        public int? CategoryId { get; set; }
        public string? Type { get; set; } // InPerson, Online, Adventure

        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        public string? Language { get; set; }
        public string? TimeOfDay { get; set; } // Morning, Afternoon, Evening

        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        public string? SortBy { get; set; } // Price, Rating, Popular
    }

    public class ExperienceSearchResultDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string HostName { get; set; }
        public string? HostAvatar { get; set; }

        public string CategoryName { get; set; }
        public string Type { get; set; }

        public string? City { get; set; }
        public string? Country { get; set; }

        public int DurationHours { get; set; }
        public int? DurationMinutes { get; set; }

        public decimal PricePerPerson { get; set; }

        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }

        public string? PrimaryImage { get; set; }

        public bool IsAvailable { get; set; }
    }
}
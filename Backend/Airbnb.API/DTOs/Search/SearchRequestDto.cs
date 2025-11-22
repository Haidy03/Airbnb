using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Search
{
    public class SearchRequestDto
    {
        // --- Pagination ---
        [Range(1, int.MaxValue, ErrorMessage = "PageIndex must be at least 1")]
        public int PageIndex { get; set; } = 1;
        [Range(1, 50, ErrorMessage = "PageSize must be between 1 and 50")]
        public int PageSize { get; set; } = 12; // Load 12 items at a time

        // --- Basic Search ---
        public string? Location { get; set; } // City or Country
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        [Range(1, 20, ErrorMessage = "Guest count must be realistic")]
        public int? GuestCount { get; set; }

        // --- Advanced Filters ---
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? PropertyType { get; set; }

        // List of Amenity IDs (e.g., user wants Wifi [1] and Pool [5])
        public List<int>? AmenityIds { get; set; }

        // --- Sorting ---
        public string? SortBy { get; set; } // "price_asc", "price_desc", "rating", "newest"
    }
}
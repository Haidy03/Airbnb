namespace Airbnb.API.DTOs.Search
{
    public class PropertySearchResultDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public decimal PricePerNight { get; set; }
        public double Rating { get; set; }
        public int TotalReviews { get; set; }
        public string ImageUrl { get; set; } // The primary image
        public bool IsGuestFavorite { get; set; } // Bonus: If rating > 4.8
    }

    // Wrapper for pagination metadata
    public class PagedResult<T>
    {
        public IEnumerable<T> Items { get; set; }
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }
}
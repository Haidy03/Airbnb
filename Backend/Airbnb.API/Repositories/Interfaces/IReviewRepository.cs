using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IReviewRepository
    {
        // Basic CRUD
        Task<Review?> GetByIdAsync(int id);
        Task<Review> AddAsync(Review review);
        Task<Review> UpdateAsync(Review review);
        Task<bool> DeleteAsync(int id);

        // Query methods
        Task<IEnumerable<Review>> GetAllAsync();
        Task<IEnumerable<Review>> GetReviewsByPropertyAsync(int propertyId, int page = 1, int pageSize = 10);
        Task<IEnumerable<Review>> GetReviewsByGuestAsync(string guestId);
        Task<IEnumerable<Review>> GetReviewsByReviewerAsync(string reviewerId);
        Task<Review?> GetReviewByBookingAsync(int bookingId, string reviewerId, string reviewType);

        // Statistics
        Task<double> GetAverageRatingByPropertyAsync(int propertyId);
        Task<int> GetTotalReviewsCountByPropertyAsync(int propertyId);
        Task<Dictionary<string, double>> GetDetailedRatingsAverageAsync(int propertyId);

        // Validation
        Task<bool> HasUserReviewedBookingAsync(int bookingId, string userId, string reviewType);
        Task<bool> ExistsAsync(int reviewId);

        // Complex queries
        Task<IEnumerable<Review>> GetReviewsWithUserInfoAsync(int propertyId, int page = 1, int pageSize = 10);
        Task<IEnumerable<Review>> GetUserReviewsAsync(string userId);
        Task<bool> ReviewExistsForBookingAsync(int bookingId);

    }
}

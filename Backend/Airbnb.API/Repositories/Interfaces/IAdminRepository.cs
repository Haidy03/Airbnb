using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IAdminRepository
    {
        // Users
        Task<List<ApplicationUser>> GetAllUsersAsync(string? role = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10);
        Task<ApplicationUser?> GetUserByIdAsync(string userId);
        Task<string?> GetUserRoleAsync(string userId);
        Task<bool> UpdateUserAsync(ApplicationUser user);
        Task<bool> DeleteUserAsync(ApplicationUser user);

        // Verifications
        Task<List<UserVerification>> GetAllVerificationsAsync(VerificationStatus? status = null);
        Task<UserVerification?> GetVerificationByIdAsync(int verificationId);
        Task<UserVerification?> GetVerificationByUserIdAsync(string userId);
        Task<bool> CreateVerificationAsync(UserVerification verification);
        Task<bool> UpdateVerificationAsync(UserVerification verification);

        // Properties
        Task<List<Property>> GetAllPropertiesAsync(PropertyStatus? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10);
        Task<Property?> GetPropertyByIdAsync(int propertyId);
        Task<bool> UpdatePropertyAsync(Property property);
        Task<bool> DeletePropertyAsync(Property property);

        // Bookings
        Task<List<Booking>> GetAllBookingsAsync(BookingStatus? status = null, DateTime? startDate = null, DateTime? endDate = null, int pageNumber = 1, int pageSize = 10);
        Task<Booking?> GetBookingByIdAsync(int bookingId);
        Task<bool> UpdateBookingAsync(Booking booking);
        // Reviews
        Task<List<Review>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 10);
        Task<List<Review>> GetFlaggedReviewsAsync();
        Task<Review?> GetReviewByIdAsync(int reviewId);
        Task<bool> DeleteReviewAsync(Review review);

        // Statistics
        Task<int> GetTotalUsersCountAsync();
        Task<int> GetUsersCountByRoleAsync(string roleName);
        Task<int> GetActiveUsersCountAsync();
        Task<int> GetBlockedUsersCountAsync();
        Task<int> GetTotalPropertiesCountAsync();
        Task<int> GetPropertiesCountByStatusAsync(PropertyStatus status);
        Task<int> GetTotalBookingsCountAsync();
        Task<int> GetBookingsCountByStatusAsync(BookingStatus status);
        Task<decimal> GetTotalRevenueAsync();
        Task<decimal> GetRevenueByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<int> GetTotalReviewsCountAsync();
        Task<double> GetAverageRatingAsync();
    }
}
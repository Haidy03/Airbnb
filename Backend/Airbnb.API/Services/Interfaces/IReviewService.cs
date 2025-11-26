using Airbnb.API.DTOs.Review;

namespace Airbnb.API.Services.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewResponseDto> CreateReviewAsync(string userId, CreateReviewDto dto);
        Task<ReviewResponseDto> UpdateReviewAsync(string userId, int reviewId, UpdateReviewDto dto);
        Task<bool> DeleteReviewAsync(string userId, int reviewId);
        Task<ReviewResponseDto?> GetReviewByIdAsync(int reviewId);
        Task<PropertyReviewsSummaryDto> GetPropertyReviewsAsync(int propertyId, int page = 1, int pageSize = 10);
        Task<GuestReviewsSummaryDto> GetGuestReviewsAsync(string guestId);
        Task<CanReviewResponseDto> CanUserReviewAsync(string userId, int bookingId);
        Task<List<ReviewResponseDto>> GetUserReviewsAsync(string userId);

        Task<HostReviewsResponseDto> GetHostReviewsAsync(string hostId);
    }
}

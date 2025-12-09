using Airbnb.API.DTOs.Review;
using Airbnb.API.DTOs.Services;
using Airbnb.API.DTOs.Admin;
using Airbnb.API.Models;

namespace Airbnb.API.Services.Interfaces
{
    public interface IServicesService
    {
        Task<List<ServiceCardDto>> GetFeaturedServicesAsync();
        Task<List<ServiceCardDto>> GetServicesByCategoryAsync(string categoryName);
        Task<bool> CreateServiceAsync(string hostId, CreateServiceDto dto);
        Task<ServiceDetailsDto> GetServiceByIdAsync(int id);
        Task<List<ServiceCategory>> GetAllCategoriesAsync();
        

        Task<List<HostServiceDto>> GetHostServicesAsync(string hostId);
        Task<List<ServiceCardDto>> GetPendingServicesForAdminAsync();
        Task<bool> UpdateServiceStatusAsync(int serviceId, bool isApproved, string? reason); 
        Task<int> BookServiceAsync(string guestId, BookServiceDto dto);

        Task<bool> DeleteServiceAsync(int id, string hostId);
        Task<bool> ToggleServiceStatusAsync(int id, string hostId);
        Task<ServiceDetailsDto> GetHostServiceDetailsAsync(int id, string hostId);
        Task<bool> UpdateServiceAsync(int id, string hostId, UpdateServiceDto dto);


        Task<ReviewResponseDto> AddReviewAsync(string userId, CreateReviewDto dto);
        Task<List<ReviewResponseDto>> GetReviewsByServiceIdAsync(int serviceId);
        Task<ReviewResponseDto> UpdateServiceReviewAsync(int reviewId, string userId, UpdateReviewDto dto);
        Task DeleteReviewAsync(int reviewId, string userId);
        Task<ReviewResponseDto?> GetServiceReviewDtoByIdAsync(int reviewId);
        Task<bool> CancelBookingAsync(int bookingId, string userId);
        Task<string> UploadServiceImageAsync(int serviceId, string hostId, IFormFile file);
        Task<bool> DeleteServiceImageAsync(int imageId, string hostId);
        Task<bool> SetCoverImageAsync(int imageId, string hostId);
        Task<List<string>> GetBlockedSlotsAsync(int serviceId, DateTime date);

    }
}
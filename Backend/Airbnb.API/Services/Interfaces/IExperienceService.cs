using Airbnb.API.DTOs.Experiences;
using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;

namespace Airbnb.API.Services.Interfaces
{
    public interface IExperienceService
    {
        Task<ExperienceDto> CreateExperienceAsync(string hostId, CreateExperienceDto dto);
        Task<ExperienceDto> UpdateExperienceAsync(int id, string hostId, UpdateExperienceDto dto);
        Task<ExperienceDto?> GetExperienceByIdAsync(int id);
        Task<IEnumerable<ExperienceDto>> GetHostExperiencesAsync(string hostId);
        Task<bool> DeleteExperienceAsync(int id, string hostId);

        Task<PagedResult<ExperienceSearchResultDto>> SearchExperiencesAsync(ExperienceSearchDto dto);
        Task<List<ExperienceSearchResultDto>> GetFeaturedExperiencesAsync(int count = 8);
        Task<List<ExperienceCategory>> GetCategoriesAsync();

        Task<ExperienceImageDto> UploadImageAsync(int experienceId, string hostId, IFormFile file);
        Task<bool> DeleteImageAsync(int imageId, string hostId);
        Task<bool> SetPrimaryImageAsync(int imageId, string hostId);

        Task<ExperienceBookingDto> BookExperienceAsync(int experienceId, string guestId, BookExperienceDto dto);
        Task<List<ExperienceBookingDto>> GetGuestBookingsAsync(string guestId);
        Task<bool> CancelBookingAsync(int bookingId, string userId);

        Task<bool> SubmitForApprovalAsync(int id, string hostId);
        Task<bool> ActivateExperienceAsync(int id, string hostId);
        Task<ExperienceAvailability> AddAvailabilityAsync(int experienceId, string hostId, CreateAvailabilityDto dto);
        Task<List<ExperienceAvailabilityDto>> GetAvailabilitiesAsync(int experienceId, DateTime? startDate, DateTime? endDate);
        Task<bool> ApproveExperienceAsync(int id);
        Task<ExperienceReviewDto> AddReviewAsync(string guestId, CreateReviewDto dto);
        Task<List<ExperienceReviewDto>> GetReviewsByExperienceIdAsync(int experienceId);

    }
}
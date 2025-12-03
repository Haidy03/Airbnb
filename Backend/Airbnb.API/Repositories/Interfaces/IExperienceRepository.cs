using Airbnb.API.DTOs.Experiences;
using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IExperienceRepository
    {
        Task<Experience?> GetByIdAsync(int id);
        Task<Experience?> GetByIdWithDetailsAsync(int id);
        Task<IEnumerable<Experience>> GetAllAsync();
        Task<IEnumerable<Experience>> GetByHostIdAsync(string hostId);
        Task<Experience> AddAsync(Experience experience);
        Task UpdateAsync(Experience experience);
        Task DeleteAsync(int id);
        IQueryable<Experience> GetQueryable();
        Task<PagedResult<ExperienceSearchResultDto>> SearchExperiencesAsync(ExperienceSearchDto dto);
        Task<List<ExperienceSearchResultDto>> GetFeaturedExperiencesAsync(int count);
        Task<List<ExperienceCategory>> GetCategoriesAsync();

        Task<ExperienceImage?> GetImageByIdAsync(int imageId);
        Task DeleteImageAsync(int imageId);
        Task SetPrimaryImageAsync(int imageId, int experienceId);

        Task<List<ExperienceAvailability>> GetAvailabilitiesAsync(int experienceId, DateTime? startDate, DateTime? endDate);
        Task<ExperienceAvailability?> GetAvailabilityByIdAsync(int availabilityId);
        Task AddAvailabilityAsync(ExperienceAvailability availability);
        Task UpdateAvailabilityAsync(ExperienceAvailability availability);
        Task DeleteAvailabilityAsync(int availabilityId);

        Task<ExperienceBooking?> GetBookingByIdAsync(int bookingId);
        Task<List<ExperienceBooking>> GetBookingsByGuestIdAsync(string guestId);
        Task<List<ExperienceBooking>> GetBookingsByHostIdAsync(string hostId);
        Task<ExperienceBooking> AddBookingAsync(ExperienceBooking booking);
        Task UpdateBookingAsync(ExperienceBooking booking);
        Task<bool> ReviewExistsAsync(int bookingId);

        Task AddReviewAsync(ExperienceReview review);

        Task<List<ExperienceReview>> GetReviewsByExperienceIdAsync(int experienceId);
        Task<ApplicationUser> GetUserByIdAsync(string userId);


        Task<ExperienceReview?> GetReviewByIdAsync(int reviewId);
        Task UpdateReviewAsync(ExperienceReview review);
        Task DeleteReviewAsync(int reviewId);
        Task<List<ExperienceReview>> GetReviewsByHostIdAsync(string hostId);
    }
}
using Airbnb.API.DTOs.Calendar;

namespace Airbnb.API.Services.Interfaces
{
    public interface ICalendarService
    {
        Task<CalendarAvailabilityDto> GetAvailabilityAsync(
            int propertyId,
            string hostId,
            DateTime startDate,
            DateTime endDate);

        Task<bool> UpdateAvailabilityAsync(UpdateAvailabilityDto dto, string hostId);

        Task<bool> UpdatePricingAsync(UpdatePricingDto dto, string hostId);

        Task<int> BulkUpdateAvailabilityAsync(BulkUpdateAvailabilityDto dto, string hostId);

        Task<CalendarSettingsDto> GetCalendarSettingsAsync(int propertyId, string hostId);

        Task<bool> UpdateCalendarSettingsAsync(UpdateCalendarSettingsDto dto, string hostId);
    }
}
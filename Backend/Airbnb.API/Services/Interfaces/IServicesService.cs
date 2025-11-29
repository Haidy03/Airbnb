using Airbnb.API.DTOs.Services;

namespace Airbnb.API.Services.Interfaces
{
    public interface IServicesService
    {
        Task<List<ServiceCardDto>> GetFeaturedServicesAsync();
        Task<List<ServiceCardDto>> GetServicesByCategoryAsync(string categoryName);
        Task<bool> CreateServiceAsync(string hostId, CreateServiceDto dto);
        Task<ServiceDetailsDto> GetServiceByIdAsync(int id);
        // Task<ServiceDetailsDto> GetServiceDetailsAsync(int id); // للمستقبل
    }
}
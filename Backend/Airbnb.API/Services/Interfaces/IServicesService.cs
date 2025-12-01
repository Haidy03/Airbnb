using Airbnb.API.DTOs.Services;
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
        Task<bool> UpdateServiceStatusAsync(int serviceId, bool isApproved, string? reason); // للآدمن
        Task<int> BookServiceAsync(string guestId, BookServiceDto dto);
    }
}
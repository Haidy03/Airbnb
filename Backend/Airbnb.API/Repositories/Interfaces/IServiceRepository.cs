using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IServiceRepository
    {
        Task<List<Service>> GetFeaturedServicesAsync();
        Task<List<Service>> GetServicesByCategoryAsync(string categoryName);
        Task<Service?> GetServiceByIdAsync(int id);
        Task AddServiceAsync(Service service);
        Task<List<ServiceCategory>> GetAllCategoriesAsync();
    }
}
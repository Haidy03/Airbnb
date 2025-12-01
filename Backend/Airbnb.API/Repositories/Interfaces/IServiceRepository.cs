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

        Task<List<Service>> GetServicesByHostIdAsync(string hostId);

        Task<List<Service>> GetPendingServicesAsync();
        Task<bool> UpdateServiceStatusAsync(int serviceId, ServiceStatus status, string? rejectionReason = null);

        Task<ServicePackage?> GetPackageByIdAsync(int packageId);
        Task AddServiceBookingAsync(ServiceBooking booking);
        Task DeleteServiceAsync(Service service);
        Task<Service?> GetServiceByIdForHostAsync(int id);
        Task<List<ServiceBooking>> GetServiceBookingsByGuestIdAsync(string guestId);
    }
}
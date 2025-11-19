using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IPropertyRepository
    {
        Task<Property?> GetByIdAsync(int id);
        Task<Property?> GetByIdWithDetailsAsync(int id);
        Task<IEnumerable<Property>> GetAllAsync();
        Task<IEnumerable<Property>> GetByHostIdAsync(string hostId);
        Task<Property> AddAsync(Property property);
        Task UpdateAsync(Property property);
        Task DeleteAsync(int id);
        Task<bool> ExistsAsync(int id);
        Task<bool> IsHostOwnerAsync(int propertyId, string hostId);
        Task<PagedResult<PropertySearchResultDto>> SearchPropertiesAsync(SearchRequestDto searchDto);
        Task<List<PropertySearchResultDto>> GetFeaturedPropertiesAsync(int count);
    }
}

using AirbnbApi.DTOs;
using AirbnbApi.Repositories;

namespace AirbnbApi.Services
{
    public interface IPropertyTypeService
    {
        Task<IEnumerable<PropertyTypeDto>> GetAllActivePropertyTypesAsync();
        Task<IEnumerable<PropertyTypeDto>> GetPropertyTypesByCategoryAsync(string category);
        Task<PropertyTypeDto?> GetPropertyTypeByCodeAsync(string code);
    }
}
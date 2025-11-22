using Airbnb.API.Models;


namespace AirbnbApi.Repositories
{
    public interface IPropertyTypeRepository
    {
        Task<IEnumerable<PropertyType>> GetAllActiveAsync();
        Task<IEnumerable<PropertyType>> GetByCategoryAsync(string category);
        Task<PropertyType?> GetByCodeAsync(string code);
        Task<PropertyType?> GetByIdAsync(int id);
    }
}
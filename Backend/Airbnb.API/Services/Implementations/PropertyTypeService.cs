using AirbnbApi.DTOs;
using AirbnbApi.Repositories;
using AirbnbApi.Services;

namespace Airbnb.API.Services.Implementations
{
    public class PropertyTypeService : IPropertyTypeService
    {
        private readonly IPropertyTypeRepository _repository;

        public PropertyTypeService(IPropertyTypeRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<PropertyTypeDto>> GetAllActivePropertyTypesAsync()
        {
            var propertyTypes = await _repository.GetAllActiveAsync();
            return propertyTypes.Select(MapToDto);
        }

        public async Task<IEnumerable<PropertyTypeDto>> GetPropertyTypesByCategoryAsync(string category)
        {
            var propertyTypes = await _repository.GetByCategoryAsync(category);
            return propertyTypes.Select(MapToDto);
        }

        public async Task<PropertyTypeDto?> GetPropertyTypeByCodeAsync(string code)
        {
            var propertyType = await _repository.GetByCodeAsync(code);
            return propertyType != null ? MapToDto(propertyType) : null;
        }

        private PropertyTypeDto MapToDto(Models.PropertyType entity)
        {
            return new PropertyTypeDto
            {
                Id = entity.Id,
                Code = entity.Code,
                Name = entity.Name,
                Description = entity.Description,
                IconType = entity.IconType,
                Category = entity.Category,
                DisplayOrder = entity.DisplayOrder
            };
        }
    }
}

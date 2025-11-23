using Airbnb.API.DTOs.Properties;

namespace Airbnb.API.Services.Interfaces
{
    public interface IPropertyService
    {
        Task<PropertyResponseDto> CreatePropertyAsync(string hostId, CreatePropertyDto dto);
        Task<PropertyResponseDto> UpdatePropertyAsync(int id, string hostId, UpdatePropertyDto dto);
        Task<PropertyResponseDto?> GetPropertyByIdAsync(int id);
        Task<IEnumerable<PropertyResponseDto>> GetHostPropertiesAsync(string hostId);
        Task<bool> DeletePropertyAsync(int id, string hostId);
        Task<bool> TogglePropertyStatusAsync(int id, string hostId);
        Task<PropertyImageDto> UploadPropertyImageAsync(int propertyId, string hostId, IFormFile file);
        Task<bool> DeletePropertyImageAsync(int imageId, string hostId);
        Task<bool> SetPrimaryImageAsync(int imageId, string hostId);
   

        Task<bool> PublishPropertyAsync(int id, string hostId);
        Task<bool> UnpublishPropertyAsync(int id, string hostId);
        Task<bool> ActivatePropertyAsync(int id, string hostId);
    }
}

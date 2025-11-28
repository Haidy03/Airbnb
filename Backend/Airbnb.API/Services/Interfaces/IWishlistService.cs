using Airbnb.API.DTOs.Search; // هنستخدم نفس DTO البحث للعرض

namespace Airbnb.API.Services.Interfaces
{
    public interface IWishlistService
    {
        Task<IEnumerable<PropertySearchResultDto>> GetUserWishlistAsync(string userId);
        Task<bool> ToggleWishlistAsync(string userId, int propertyId);
    }
}
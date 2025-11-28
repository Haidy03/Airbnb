using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IWishlistRepository
    {
        Task<IEnumerable<Property>> GetUserWishlistAsync(string userId);
        Task AddAsync(Wishlist wishlist);
        Task RemoveAsync(string userId, int propertyId);
        Task<bool> IsInWishlistAsync(string userId, int propertyId);
    }
}
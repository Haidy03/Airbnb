using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using AutoMapper;

namespace Airbnb.API.Services.Implementations
{
    public class WishlistService : IWishlistService
    {
        private readonly IWishlistRepository _wishlistRepo;
        private readonly IMapper _mapper;

        public WishlistService(IWishlistRepository wishlistRepo, IMapper mapper)
        {
            _wishlistRepo = wishlistRepo;
            _mapper = mapper;
        }

        public async Task<IEnumerable<PropertySearchResultDto>> GetUserWishlistAsync(string userId)
        {
            var properties = await _wishlistRepo.GetUserWishlistAsync(userId);
            return _mapper.Map<IEnumerable<PropertySearchResultDto>>(properties);
        }

        public async Task<bool> ToggleWishlistAsync(string userId, int propertyId)
        {
            var exists = await _wishlistRepo.IsInWishlistAsync(userId, propertyId);
            if (exists)
            {
                await _wishlistRepo.RemoveAsync(userId, propertyId);
                return false; 
            }
            else
            {
                await _wishlistRepo.AddAsync(new Wishlist { UserId = userId, PropertyId = propertyId });
                return true; 
            }
        }
    }
}
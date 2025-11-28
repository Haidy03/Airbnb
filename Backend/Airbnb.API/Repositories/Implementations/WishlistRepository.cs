using Airbnb.API.Data;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class WishlistRepository : IWishlistRepository
    {
        private readonly ApplicationDbContext _context;

        public WishlistRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Property>> GetUserWishlistAsync(string userId)
        {
            return await _context.Wishlists
                .Where(w => w.UserId == userId)
                .Include(w => w.Property)
                .ThenInclude(p => p.Images) // الصور مهمة ولازم تفضل موجودة
                .Select(w => w.Property)
                .ToListAsync();
        }

        public async Task AddAsync(Wishlist wishlist)
        {
            await _context.Wishlists.AddAsync(wishlist);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveAsync(string userId, int propertyId)
        {
            var item = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.PropertyId == propertyId);

            if (item != null)
            {
                _context.Wishlists.Remove(item);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsInWishlistAsync(string userId, int propertyId)
        {
            return await _context.Wishlists.AnyAsync(w => w.UserId == userId && w.PropertyId == propertyId);
        }
    }
}
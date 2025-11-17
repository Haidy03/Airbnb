using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class PropertyRepository: IPropertyRepository
    {
        private readonly ApplicationDbContext _context;

        public PropertyRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Property?> GetByIdAsync(int id)
        {
            return await _context.Properties.FindAsync(id);
        }

        public async Task<Property?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Properties
                .Include(p => p.Host)
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities)
                    .ThenInclude(pa => pa.Amenity)
                .Include(p => p.Reviews)
                .Include(p => p.Bookings)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Property>> GetAllAsync()
        {
            return await _context.Properties
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities)
                    .ThenInclude(pa => pa.Amenity)
                .ToListAsync();
        }

        public async Task<IEnumerable<Property>> GetByHostIdAsync(string hostId)
        {
            return await _context.Properties
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities)
                    .ThenInclude(pa => pa.Amenity)
                .Include(p => p.Reviews)
                .Include(p => p.Bookings)
                .Where(p => p.HostId == hostId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Property> AddAsync(Property property)
        {
            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();
            return property;
        }

        public async Task UpdateAsync(Property property)
        {
            property.UpdatedAt = DateTime.UtcNow;
            _context.Properties.Update(property);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var property = await GetByIdAsync(id);
            if (property != null)
            {
                _context.Properties.Remove(property);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Properties.AnyAsync(p => p.Id == id);
        }

        public async Task<bool> IsHostOwnerAsync(int propertyId, string hostId)
        {
            return await _context.Properties
                .AnyAsync(p => p.Id == propertyId && p.HostId == hostId);
        }
    }
}

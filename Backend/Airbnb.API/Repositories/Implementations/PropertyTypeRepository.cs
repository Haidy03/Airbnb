using Airbnb.API.Models;
using Microsoft.EntityFrameworkCore;

namespace AirbnbApi.Repositories
{
    public class PropertyTypeRepository : IPropertyTypeRepository
    {
        private readonly ApplicationDbContext _context;

        public PropertyTypeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PropertyType>> GetAllActiveAsync()
        {
            return await _context.PropertyTypes
                .Where(pt => pt.IsActive)
                .OrderBy(pt => pt.DisplayOrder)
                .ToListAsync();
        }

        public async Task<IEnumerable<PropertyType>> GetByCategoryAsync(string category)
        {
            return await _context.PropertyTypes
                .Where(pt => pt.IsActive && pt.Category == category)
                .OrderBy(pt => pt.DisplayOrder)
                .ToListAsync();
        }

        public async Task<PropertyType?> GetByCodeAsync(string code)
        {
            return await _context.PropertyTypes
                .FirstOrDefaultAsync(pt => pt.Code == code);
        }

        public async Task<PropertyType?> GetByIdAsync(int id)
        {
            return await _context.PropertyTypes
                .FindAsync(id);
        }
    }
}
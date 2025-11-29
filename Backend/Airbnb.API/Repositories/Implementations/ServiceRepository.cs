using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class ServiceRepository : IServiceRepository
    {
        private readonly ApplicationDbContext _context;

        public ServiceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Service>> GetFeaturedServicesAsync()
        {
            return await _context.Services
                .Include(s => s.Category)
                .Include(s => s.Host)
                .Include(s => s.Images)
                .Where(s => s.Status == ServiceStatus.Active)
                .OrderByDescending(s => s.AverageRating)
                .Take(10)
                .ToListAsync();
        }

        public async Task<List<Service>> GetServicesByCategoryAsync(string categoryName)
        {
            return await _context.Services
                .Include(s => s.Category)
                .Include(s => s.Host)
                .Include(s => s.Images)
                .Where(s => s.Status == ServiceStatus.Active && s.Category.Name == categoryName)
                .ToListAsync();
        }

        public async Task<Service?> GetServiceByIdAsync(int id)
        {
            return await _context.Services
                .Include(s => s.Category)
                .Include(s => s.Host)
                .Include(s => s.Images)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task AddServiceAsync(Service service)
        {
            await _context.Services.AddAsync(service);
            await _context.SaveChangesAsync();
        }
    }
}
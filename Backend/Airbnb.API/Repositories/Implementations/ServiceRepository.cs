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
        public async Task<List<ServiceCategory>> GetAllCategoriesAsync()
        {
            return await _context.ServiceCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();
        }

        public async Task<List<Service>> GetServicesByHostIdAsync(string hostId)
        {
            return await _context.Services
                .Include(s => s.Category)
                .Include(s => s.Images)
                .Include(s => s.Host)
                .Where(s => s.HostId == hostId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Service>> GetPendingServicesAsync()
        {
            return await _context.Services
                .Include(s => s.Category)
                .Include(s => s.Host)
                .Include(s => s.Images)
                .Where(s => s.Status == ServiceStatus.PendingApproval)
                .ToListAsync();
        }

        public async Task<bool> UpdateServiceStatusAsync(int serviceId, ServiceStatus status, string? rejectionReason = null)
        {
            var service = await _context.Services.FindAsync(serviceId);
            if (service == null) return false;

            service.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task AddServiceBookingAsync(ServiceBooking booking)
        {
            await _context.ServiceBookings.AddAsync(booking);
            await _context.SaveChangesAsync();
        }

        public async Task<ServicePackage?> GetPackageByIdAsync(int packageId)
        {
            return await _context.ServicePackages.FindAsync(packageId);
        }

        public async Task<Service?> GetServiceByIdForHostAsync(int id)
        {
            return await _context.Services
                .Include(s => s.Category)
                .Include(s => s.Images)
                .Include(s => s.Host) 
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task DeleteServiceAsync(Service service)
        {
            _context.Services.Remove(service);
            await _context.SaveChangesAsync();
        }
        public async Task<List<ServiceBooking>> GetServiceBookingsByGuestIdAsync(string guestId)
        {
            return await _context.ServiceBookings
                .Include(b => b.Service).ThenInclude(s => s.Images)
                .Include(b => b.Service).ThenInclude(s => s.Host)
                .Where(b => b.GuestId == guestId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }
        public async Task UpdateServiceAsync(Service service)
        {
            _context.Services.Update(service);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ServiceBooking>> GetServiceBookingsByHostIdAsync(string hostId)
        {
            return await _context.ServiceBookings
                .Include(b => b.Service).ThenInclude(s => s.Images)
                .Include(b => b.Guest)
                .Where(b => b.Service.HostId == hostId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();
        }


        //reviews rahma

        public async Task<ServiceBooking?> GetServiceBookingByIdAsync(int bookingId)
        {
            return await _context.ServiceBookings
                .Include(b => b.Service) // نحتاج الخدمة عشان نعرف الـ ID بتاعها
                .Include(b => b.Guest)   // نحتاج الجيست عشان نتأكد من الهوية
                .FirstOrDefaultAsync(b => b.Id == bookingId);
        }

        public async Task AddServiceReviewAsync(ServiceReview review)
        {
            await _context.ServiceReviews.AddAsync(review);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ServiceReviewExistsAsync(int bookingId)
        {
            return await _context.ServiceReviews.AnyAsync(r => r.ServiceBookingId == bookingId);
        }

        public async Task<List<ServiceReview>> GetReviewsByServiceIdAsync(int serviceId)
        {
            return await _context.ServiceReviews
                .Include(r => r.Reviewer) // عشان نعرض اسم وصورة اللي عمل ريفيو
                .Where(r => r.ServiceId == serviceId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<ServiceReview?> GetServiceReviewByIdAsync(int reviewId)
        {
            return await _context.ServiceReviews
                .Include(r => r.Reviewer)
                .Include(r => r.Service)
                .FirstOrDefaultAsync(r => r.Id == reviewId);
        }

        public async Task DeleteServiceReviewAsync(ServiceReview review)
        {
            _context.ServiceReviews.Remove(review);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateServiceReviewAsync(ServiceReview review)
        {
            _context.ServiceReviews.Update(review);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateServiceBookingAsync(ServiceBooking booking)
        {
            _context.ServiceBookings.Update(booking);
            await _context.SaveChangesAsync();
        }
    }
}
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class BookingRepository : IBookingRepository
    {
        private readonly ApplicationDbContext _context;

        public BookingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Booking?> GetByIdAsync(int id)
        {
            return await _context.Bookings
                .Include(b => b.Property)
                    .ThenInclude(p => p.Images)
                .Include(b => b.Guest)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        public async Task<IEnumerable<Booking>> GetAllAsync()
        {
            return await _context.Bookings
                .Include(b => b.Property)
                .Include(b => b.Guest)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetByPropertyIdAsync(int propertyId)
        {
            return await _context.Bookings
                .Include(b => b.Guest)
                .Where(b => b.PropertyId == propertyId)
                .OrderByDescending(b => b.CheckInDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetByHostIdAsync(string hostId)
        {
            return await _context.Bookings
                .Include(b => b.Property)
                    .ThenInclude(p => p.Images)
                .Include(b => b.Guest)
                .Where(b => b.Property.HostId == hostId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Booking>> GetByGuestIdAsync(string guestId)
        {
            return await _context.Bookings
                .Include(b => b.Property)
                    .ThenInclude(p => p.Images)
                .Where(b => b.GuestId == guestId)
                .OrderByDescending(b => b.CheckInDate)
                .ToListAsync();
        }

        public async Task<Booking> AddAsync(Booking booking)
        {
            await _context.Bookings.AddAsync(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        public async Task UpdateAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetTotalBookingsByPropertyIdAsync(int propertyId)
        {
            return await _context.Bookings
                .Where(b => b.PropertyId == propertyId)
                .CountAsync();
        }
    }
}

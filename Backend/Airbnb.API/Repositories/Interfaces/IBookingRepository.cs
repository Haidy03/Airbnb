using Airbnb.API.Models;

namespace Airbnb.API.Repositories.Interfaces
{
    public interface IBookingRepository
    {
        Task<Booking?> GetByIdAsync(int id);
        Task<IEnumerable<Booking>> GetAllAsync();
        Task<IEnumerable<Booking>> GetByPropertyIdAsync(int propertyId);
        Task<IEnumerable<Booking>> GetByHostIdAsync(string hostId);
        Task<IEnumerable<Booking>> GetByGuestIdAsync(string guestId);
        Task<Booking> AddAsync(Booking booking);
        Task UpdateAsync(Booking booking);
        Task<int> GetTotalBookingsByPropertyIdAsync(int propertyId);
        Task<bool> IsDateRangeAvailableAsync(int propertyId, DateTime checkIn, DateTime checkOut);
    }
}

using Airbnb.API.DTOs.Booking;

namespace Airbnb.API.Services.Interfaces
{
    public interface IBookingService
    {
        Task<IEnumerable<BookingResponseDto>> GetHostBookingsAsync(string hostId);
        Task<IEnumerable<BookingResponseDto>> GetPropertyBookingsAsync(int propertyId, string hostId);
        Task<BookingResponseDto?> GetBookingByIdAsync(int id, string hostId);
        Task<bool> ApproveBookingAsync(int id, string hostId);
        Task<bool> DeclineBookingAsync(int id, string hostId);
        Task<bool> CancelBookingAsync(int id, string hostId);
    }
}

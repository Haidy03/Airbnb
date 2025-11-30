using Airbnb.API.DTOs.Booking;

namespace Airbnb.API.Services.Interfaces
{
    public interface IBookingService
    {
        // --- Guest Methods (NEW) ---
        Task<BookingResponseDto> CreateBookingAsync(string guestId, CreateBookingDto createDto);
        //Task<IEnumerable<BookingResponseDto>> GetGuestBookingsAsync(string guestId);
        Task<List<TripDto>> GetGuestBookingsAsync(string guestId);

        // --- Host Methods (You already had these) ---
        Task<IEnumerable<BookingResponseDto>> GetHostBookingsAsync(string hostId);
        Task<IEnumerable<BookingResponseDto>> GetPropertyBookingsAsync(int propertyId, string hostId);
        Task<BookingResponseDto?> GetBookingByIdAsync(int id, string userId); // Changed param name to userId to be generic
        Task<bool> ApproveBookingAsync(int id, string hostId);
        Task<bool> DeclineBookingAsync(int id, string hostId);

        // --- Shared (Updated to allow Guest OR Host) ---
        Task<bool> CancelBookingAsync(int id, string userId);
        Task<bool> ConfirmBookingAfterPaymentAsync(int id, string guestId);
    }
}
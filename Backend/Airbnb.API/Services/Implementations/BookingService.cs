using Airbnb.API.DTOs.Booking;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;

namespace Airbnb.API.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IPropertyRepository _propertyRepository;
        private readonly ILogger<BookingService> _logger;

        public BookingService(
            IBookingRepository bookingRepository,
            IPropertyRepository propertyRepository,
            ILogger<BookingService> logger)
        {
            _bookingRepository = bookingRepository;
            _propertyRepository = propertyRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<BookingResponseDto>> GetHostBookingsAsync(string hostId)
        {
            var bookings = await _bookingRepository.GetByHostIdAsync(hostId);

            return bookings.Select(MapToResponseDto).ToList();
        }

        public async Task<IEnumerable<BookingResponseDto>> GetPropertyBookingsAsync(int propertyId, string hostId)
        {
            // Verify host owns the property
            var isOwner = await _propertyRepository.IsHostOwnerAsync(propertyId, hostId);

            if (!isOwner)
                throw new UnauthorizedAccessException("You are not authorized to view bookings for this property");

            var bookings = await _bookingRepository.GetByPropertyIdAsync(propertyId);

            return bookings.Select(MapToResponseDto).ToList();
        }

        public async Task<BookingResponseDto?> GetBookingByIdAsync(int id, string hostId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);

            if (booking == null)
                return null;

            // Verify host owns the property
            if (booking.Property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to view this booking");

            return MapToResponseDto(booking);
        }

        public async Task<bool> ApproveBookingAsync(int id, string hostId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);

            if (booking == null)
                return false;

            if (booking.Property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to approve this booking");

            if (booking.Status != BookingStatus.Pending)
                throw new InvalidOperationException("Only pending bookings can be approved");

            booking.Status = BookingStatus.Confirmed;
            booking.ConfirmedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);

            _logger.LogInformation("Booking {BookingId} approved by host {HostId}", id, hostId);

            return true;
        }

        public async Task<bool> DeclineBookingAsync(int id, string hostId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);

            if (booking == null)
                return false;

            if (booking.Property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to decline this booking");

            if (booking.Status != BookingStatus.Pending)
                throw new InvalidOperationException("Only pending bookings can be declined");

            booking.Status = BookingStatus.Rejected;
            booking.CancelledAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);

            _logger.LogInformation("Booking {BookingId} declined by host {HostId}", id, hostId);

            return true;
        }

        public async Task<bool> CancelBookingAsync(int id, string hostId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);

            if (booking == null)
                return false;

            if (booking.Property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to cancel this booking");

            if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed)
                throw new InvalidOperationException("This booking cannot be cancelled");

            booking.Status = BookingStatus.Cancelled;
            booking.CancelledAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);

            _logger.LogInformation("Booking {BookingId} cancelled by host {HostId}", id, hostId);

            return true;
        }

        private BookingResponseDto MapToResponseDto(Booking booking)
        {
            return new BookingResponseDto
            {
                Id = booking.Id,
                PropertyId = booking.PropertyId,
                PropertyTitle = booking.Property.Title,
                PropertyImage = booking.Property.Images.FirstOrDefault(img => img.IsPrimary)?.ImageUrl
                    ?? booking.Property.Images.FirstOrDefault()?.ImageUrl
                    ?? "",
                GuestId = booking.GuestId,
                GuestName = $"{booking.Guest.FirstName} {booking.Guest.LastName}".Trim(),
                GuestEmail = booking.Guest.Email ?? "",
                GuestPhone = booking.Guest.PhoneNumber,
                CheckInDate = booking.CheckInDate,
                CheckOutDate = booking.CheckOutDate,
                NumberOfGuests = booking.NumberOfGuests,
                NumberOfNights = booking.NumberOfNights,
                PricePerNight = booking.PricePerNight,
                CleaningFee = booking.CleaningFee,
                TotalPrice = booking.TotalPrice,
                Status = booking.Status.ToString(),
                SpecialRequests = booking.SpecialRequests,
                CreatedAt = booking.CreatedAt,
                ConfirmedAt = booking.ConfirmedAt
            };
        }
    }
}
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

        // ==========================================
        // GUEST METHODS (NEW)
        // ==========================================
        public async Task<BookingResponseDto> CreateBookingAsync(string guestId, CreateBookingDto createDto)
        {
            // 1. Validate Dates
            if (createDto.CheckInDate >= createDto.CheckOutDate)
                throw new ArgumentException("Check-out date must be after check-in date.");

            if (createDto.CheckInDate < DateTime.Today)
                throw new ArgumentException("Cannot book dates in the past.");

            // 2. Get Property
            var property = await _propertyRepository.GetByIdAsync(createDto.PropertyId);
            if (property == null) throw new KeyNotFoundException("Property not found.");

            // 3. Prevent Host from booking own property
            if (property.HostId == guestId)
                throw new InvalidOperationException("You cannot book your own property.");

            // 4. Conflict Check
            var isAvailable = await _bookingRepository.IsDateRangeAvailableAsync(
                createDto.PropertyId, createDto.CheckInDate, createDto.CheckOutDate);

            if (!isAvailable)
                throw new InvalidOperationException("Dates are already booked.");

            // 5. Calculate Price
            var nights = (createDto.CheckOutDate - createDto.CheckInDate).Days;
            var totalPrice = (property.PricePerNight * nights) + (property.CleaningFee ?? 0);

            // 6. Create Entity
            var booking = new Booking
            {
                PropertyId = createDto.PropertyId,
                GuestId = guestId,
                CheckInDate = createDto.CheckInDate,
                CheckOutDate = createDto.CheckOutDate,
                NumberOfGuests = createDto.NumberOfGuests,
                NumberOfNights = nights,
                PricePerNight = property.PricePerNight,
                CleaningFee = property.CleaningFee ?? 0,
                TotalPrice = totalPrice,
                Status = BookingStatus.Pending,
                SpecialRequests = createDto.SpecialRequests,
                CreatedAt = DateTime.UtcNow
            };

            var savedBooking = await _bookingRepository.AddAsync(booking);

            // Re-fetch to get included data (Guest/Property) for the DTO
            var completeBooking = await _bookingRepository.GetByIdAsync(savedBooking.Id);
            return MapToResponseDto(completeBooking);
        }

        public async Task<IEnumerable<BookingResponseDto>> GetGuestBookingsAsync(string guestId)
        {
            var bookings = await _bookingRepository.GetByGuestIdAsync(guestId);
            return bookings.Select(MapToResponseDto).ToList();
        }

        // ==========================================
        // HOST METHODS (EXISTING)
        // ==========================================
        public async Task<IEnumerable<BookingResponseDto>> GetHostBookingsAsync(string hostId)
        {
            var bookings = await _bookingRepository.GetByHostIdAsync(hostId);
            return bookings.Select(MapToResponseDto).ToList();
        }

        public async Task<IEnumerable<BookingResponseDto>> GetPropertyBookingsAsync(int propertyId, string hostId)
        {
            var isOwner = await _propertyRepository.IsHostOwnerAsync(propertyId, hostId);
            if (!isOwner) throw new UnauthorizedAccessException("Not your property");

            var bookings = await _bookingRepository.GetByPropertyIdAsync(propertyId);
            return bookings.Select(MapToResponseDto).ToList();
        }

        public async Task<BookingResponseDto?> GetBookingByIdAsync(int id, string userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null) return null;

            // Allow if user is Guest OR Host
            if (booking.GuestId != userId && booking.Property.HostId != userId)
                throw new UnauthorizedAccessException("You are not authorized to view this booking");

            return MapToResponseDto(booking);
        }

        public async Task<bool> ApproveBookingAsync(int id, string hostId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null) return false;

            if (booking.Property.HostId != hostId) throw new UnauthorizedAccessException();
            if (booking.Status != BookingStatus.Pending) throw new InvalidOperationException("Only pending bookings can be approved");

            booking.Status = BookingStatus.Confirmed;
            booking.ConfirmedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);
            _logger.LogInformation("Booking {Id} approved", id);
            return true;
        }

        public async Task<bool> DeclineBookingAsync(int id, string hostId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null) return false;

            if (booking.Property.HostId != hostId) throw new UnauthorizedAccessException();
            if (booking.Status != BookingStatus.Pending) throw new InvalidOperationException("Only pending bookings can be declined");

            booking.Status = BookingStatus.Rejected;
            booking.CancelledAt = DateTime.UtcNow; // Or CompletedAt depending on logic, but CancelledAt fits rejected

            await _bookingRepository.UpdateAsync(booking);
            return true;
        }

        // ==========================================
        // SHARED METHODS (UPDATED)
        // ==========================================
        public async Task<bool> CancelBookingAsync(int id, string userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null) return false;

            // Allow Guest OR Host to cancel
            if (booking.GuestId != userId && booking.Property.HostId != userId)
                throw new UnauthorizedAccessException("You are not authorized to cancel this booking");

            if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed)
                throw new InvalidOperationException("Cannot cancel finished/cancelled booking");

            booking.Status = BookingStatus.Cancelled;
            booking.CancelledAt = DateTime.UtcNow;

            // If cancelled by Host vs Guest, you might want to log who did it, but for MVP this is fine.

            await _bookingRepository.UpdateAsync(booking);
            return true;
        }

        // ==========================================
        // HELPER
        // ==========================================
        private BookingResponseDto MapToResponseDto(Booking booking)
        {
            // Safety check for nulls just in case
            if (booking == null) return null;

            return new BookingResponseDto
            {
                Id = booking.Id,
                PropertyId = booking.PropertyId,
                PropertyTitle = booking.Property?.Title ?? "",
                PropertyImage = booking.Property?.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                    ?? booking.Property?.Images?.FirstOrDefault()?.ImageUrl
                    ?? "",

                GuestId = booking.GuestId,
                GuestName = booking.Guest != null ? $"{booking.Guest.FirstName} {booking.Guest.LastName}".Trim() : "",
                GuestEmail = booking.Guest?.Email ?? "",
                GuestPhone = booking.Guest?.PhoneNumber,

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
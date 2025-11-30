using Airbnb.API.DTOs.Booking;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using AutoMapper;

namespace Airbnb.API.Services.Implementations
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IPropertyRepository _propertyRepository;
        private readonly ILogger<BookingService> _logger;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;

        public BookingService(
            IBookingRepository bookingRepository,
            IPropertyRepository propertyRepository,
            IEmailService emailService,
            IMapper mapper,
            ILogger<BookingService> logger)
        {
            _bookingRepository = bookingRepository;
            _propertyRepository = propertyRepository;
            _emailService = emailService;
            _mapper = mapper;
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
                Status = property.IsInstantBook ? BookingStatus.Confirmed : BookingStatus.Pending,
                SpecialRequests = createDto.SpecialRequests,
                CreatedAt = DateTime.UtcNow
            };

            var savedBooking = await _bookingRepository.AddAsync(booking);

            // Re-fetch to get included data (Guest/Property) for the DTO
            var completeBooking = await _bookingRepository.GetByIdAsync(savedBooking.Id);

            // ============================================================
            // SEND EMAIL TO HOST
            // ============================================================

            try
            {
                var hostEmail = completeBooking.Property.Host.Email;
                var subject = $"New Booking Request: {completeBooking.Property.Title}";
                var body = $@"
                    <h3>You have a new request!</h3>
                    <p><strong>Guest:</strong> {completeBooking.Guest.FirstName}</p>
                    <p><strong>Dates:</strong> {completeBooking.CheckInDate.ToShortDateString()} to {completeBooking.CheckOutDate.ToShortDateString()}</p>
                    <p><strong>Total:</strong> ${completeBooking.TotalPrice}</p>
                    <p>Please go to your dashboard to Approve or Decline.</p>";

                await _emailService.SendEmailAsync(hostEmail, subject, body);
            }
            catch (Exception ex)
            {
                // Don't crash the booking if email fails, just log it
                _logger.LogWarning($"Failed to send email to host: {ex.Message}");
            }


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

            // ✅ التغيير هنا: بدلاً من Confirmed، نجعله AwaitingPayment
            booking.Status = BookingStatus.AwaitingPayment;

            // لا نضع ConfirmedAt الآن، سنضعه بعد الدفع
            // booking.ConfirmedAt = DateTime.UtcNow; 

            await _bookingRepository.UpdateAsync(booking);

            // ✅ إرسال إيميل للزائر يطلب الدفع
            try
            {
                var guestEmail = booking.Guest.Email;
                var subject = "Booking Approved! Please complete payment";
                var paymentLink = $"http://localhost:4200/trips"; // توجيه لصفحة رحلاته للدفع
                var body = $@"
            <h3>Good news! {booking.Property.Host.FirstName} accepted your request.</h3>
            <p>To confirm your reservation at <strong>{booking.Property.Title}</strong>, please complete the payment.</p>
            <p><a href='{paymentLink}'>Click here to Pay</a></p>";

                await _emailService.SendEmailAsync(guestEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to send email: {ex.Message}");
            }

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


            // ============================================================
            // SEND EMAIL TO GUEST
            // ============================================================
            try
            {
                var guestEmail = booking.Guest.Email;
                var subject = "Booking Confirmed! 🏖️";
                var body = $@"
                    <h3>Your trip is confirmed!</h3>
                    <p>You are going to <strong>{booking.Property.Title}</strong>.</p>
                    <p><strong>Dates:</strong> {booking.CheckInDate.ToShortDateString()} to {booking.CheckOutDate.ToShortDateString()}</p>
                    <p>Host contact: {booking.Property.Host.Email}</p>
                    <p>Have a great trip!</p>";

                await _emailService.SendEmailAsync(guestEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to send email to guest: {ex.Message}");
            }

            _logger.LogInformation("Booking {Id} approved", id);
            return true;
        }

        public async Task<bool> ConfirmBookingAfterPaymentAsync(int id, string guestId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);

            if (booking == null) return false;

            // التأكد من أن المستخدم هو صاحب الحجز
            if (booking.GuestId != guestId)
                throw new UnauthorizedAccessException("Not authorized to confirm this booking");

            // التأكد من أن الحالة تسمح بالتأكيد (يجب أن تكون بانتظار الدفع)
            if (booking.Status != BookingStatus.AwaitingPayment)
                return false;

            booking.Status = BookingStatus.Confirmed;
            booking.ConfirmedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);

            // (اختياري) إرسال إيميل تأكيد نهائي

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
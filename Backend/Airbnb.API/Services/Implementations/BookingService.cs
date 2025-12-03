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
        private readonly IExperienceRepository _experienceRepository;
        private readonly IServiceRepository _serviceRepository;
        private readonly IReviewRepository _reviewRepository;
        private readonly ILogger<BookingService> _logger;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;

        public BookingService(
            IBookingRepository bookingRepository,
            IPropertyRepository propertyRepository,
            IExperienceRepository experienceRepository,
            IServiceRepository serviceRepository, // ✅ Inject Here
            IReviewRepository reviewRepository,
            IEmailService emailService,
            IMapper mapper,
            ILogger<BookingService> logger)
        {
            _bookingRepository = bookingRepository;
            _propertyRepository = propertyRepository;
            _experienceRepository = experienceRepository;
            _serviceRepository = serviceRepository; // ✅ Assign Here
            _reviewRepository = reviewRepository;
            _emailService = emailService;
            _mapper = mapper;
            _logger = logger;
        }

        // ==========================================
        // GUEST METHODS
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

            var completeBooking = await _bookingRepository.GetByIdAsync(savedBooking.Id);

            // Send Email
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
                _logger.LogWarning($"Failed to send email to host: {ex.Message}");
            }

            return MapToResponseDto(completeBooking);
        }

        public async Task<List<TripDto>> GetGuestBookingsAsync(string guestId)
        {
            var allTrips = new List<TripDto>();

            // -------------------------------------------------------
            // 1. Properties
            // -------------------------------------------------------
            var propertyBookings = await _bookingRepository.GetBookingsByGuestIdAsync(guestId);

            foreach (var b in propertyBookings)
            {
                bool hasReview = await _reviewRepository.ReviewExistsForBookingAsync(b.Id);
                bool canReview = b.Status == BookingStatus.Completed && !hasReview;

                allTrips.Add(new TripDto
                {
                    Id = b.Id,
                    PropertyId = b.PropertyId, // ✅✅ 1. تم إضافة رقم الوحدة هنا
                    ExperienceId = null,
                    Type = "Property", // ✅ تحديد النوع
                    Title = b.Property.Title,
                    ImageUrl = b.Property.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                               ?? b.Property.Images.FirstOrDefault()?.ImageUrl,
                    HostName = $"{b.Property.Host.FirstName} {b.Property.Host.LastName}",
                    CheckInDate = b.CheckInDate,
                    CheckOutDate = b.CheckOutDate,
                    TotalPrice = b.TotalPrice,
                    Status = b.Status.ToString(),


                    // ✅ إعدادات التقييم
                    IsReviewed = hasReview,
                    CanReview = canReview
                });
            }

            // -------------------------------------------------------
            // 2. Experiences
            // -------------------------------------------------------
            var experienceBookings = await _experienceRepository.GetBookingsByGuestIdAsync(guestId);

            foreach (var eb in experienceBookings)
            {
                bool hasExpReview = await _experienceRepository.ReviewExistsAsync(eb.Id);
                bool canExpReview = eb.Status == ExperienceBookingStatus.Completed && !hasExpReview;

                allTrips.Add(new TripDto
                {
                    Id = eb.Id,
                    ExperienceId = eb.ExperienceId, // ✅✅ 2. تم إضافة رقم التجربة هنا
                    PropertyId = null,
                    Type = "Experience", // ✅ تحديد النوع
                    Title = eb.Experience.Title,
                    ImageUrl = eb.Experience.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                               ?? eb.Experience.Images.FirstOrDefault()?.ImageUrl,
                    HostName = "Experience Host",
                    CheckInDate = eb.Availability.Date,
                    CheckOutDate = eb.Availability.Date,
                    TotalPrice = eb.TotalPrice,
                    Status = eb.Status.ToString(),
                    IsReviewed = hasExpReview,
                    CanReview = canExpReview
                });
            }

            // -------------------------------------------------------
            // ✅ 3. Services (NEW)
            // -------------------------------------------------------
            var serviceBookings = await _serviceRepository.GetServiceBookingsByGuestIdAsync(guestId);

            foreach (var sb in serviceBookings)
            {
                // يمكن إضافة منطق الريفيو للخدمات مستقبلاً
                bool hasReview = await _serviceRepository.ServiceReviewExistsAsync(sb.Id);
                bool canReviewService = sb.Status == "Completed" && !hasReview;

                allTrips.Add(new TripDto
                {
                    Id = sb.Id,
                    ServiceId = sb.ServiceId, // مهم للفرونت
                    Type = "Service",         // ✅ النوع الجديد
                    Title = sb.Service.Title,

                    // التعامل الآمن مع الصور
                    ImageUrl = sb.Service.Images != null && sb.Service.Images.Any()
                        ? (sb.Service.Images.FirstOrDefault(i => i.IsCover)?.Url ?? sb.Service.Images.FirstOrDefault()?.Url)
                        : "assets/placeholder.jpg",

                    HostName = sb.Service.Host != null
                        ? $"{sb.Service.Host.FirstName} {sb.Service.Host.LastName}"
                        : "Service Host",

                    CheckInDate = sb.BookingDate, // تاريخ ووقت الحجز
                    CheckOutDate = sb.BookingDate.AddHours(1), // وقت افتراضي للعرض

                    TotalPrice = sb.TotalPrice,
                    Status = sb.Status, // Confirmed, PendingPayment, etc.

                    IsReviewed = hasReview,
                    CanReview = canReviewService
                });
            }

            // 4. Sort all by date
            return allTrips.OrderByDescending(t => t.CheckInDate).ToList();
        }

        // ==========================================
        // HOST METHODS
        // ==========================================
        public async Task<IEnumerable<BookingResponseDto>> GetHostBookingsAsync(string hostId)
        {
            var allBookings = new List<BookingResponseDto>();

            // 1. Properties (الكود القديم)
            var propBookings = await _bookingRepository.GetByHostIdAsync(hostId);
            allBookings.AddRange(propBookings.Select(MapToResponseDto));

            // 2. Experiences (الجديد)
            // (تأكدي من وجود دالة GetBookingsByHostIdAsync في ExperienceRepo)
            var expBookings = await _experienceRepository.GetBookingsByHostIdAsync(hostId);
            allBookings.AddRange(expBookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                Type = "Experience", // ✅ إضافة النوع
                ItemTitle = b.Experience.Title, // استخدمي خاصية موحدة
                PropertyImage = b.Experience.Images.FirstOrDefault(i => i.IsPrimary)?.ImageUrl ?? "",
                GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
                CheckInDate = b.Availability.Date, // وقت التجربة
                CheckOutDate = b.Availability.Date.AddHours(b.Experience.DurationHours),
                Status = b.Status.ToString(),
                TotalPrice = b.TotalPrice,
                NumberOfGuests = b.NumberOfGuests
            }));

            var serviceBookings = await _serviceRepository.GetServiceBookingsByHostIdAsync(hostId);

            allBookings.AddRange(serviceBookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                Type = "Service", // ✅ إضافة النوع
                ItemTitle = b.Service.Title,
                PropertyImage = b.Service.Images.FirstOrDefault(i => i.IsCover)?.Url ?? "",
                GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
                CheckInDate = b.BookingDate,
                CheckOutDate = b.BookingDate.AddHours(1), // افتراضي
                Status = b.Status,
                TotalPrice = b.TotalPrice,
                NumberOfGuests = b.NumberOfGuests
            }));

            return allBookings.OrderBy(b => b.CheckInDate).ToList();
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

            booking.Status = BookingStatus.AwaitingPayment;
            await _bookingRepository.UpdateAsync(booking);

            try
            {
                var guestEmail = booking.Guest.Email;
                var subject = "Booking Approved! Please complete payment";
                var paymentLink = $"http://localhost:4200/trips";
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
            booking.CancelledAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);

            try
            {
                var guestEmail = booking.Guest.Email;
                var subject = "Booking Update";
                var body = $"<p>Your booking request for <strong>{booking.Property.Title}</strong> was declined.</p>";
                await _emailService.SendEmailAsync(guestEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"Failed to send email to guest: {ex.Message}");
            }

            return true;
        }

        public async Task<bool> ConfirmBookingAfterPaymentAsync(int id, string guestId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null) return false;

            if (booking.GuestId != guestId)
                throw new UnauthorizedAccessException("Not authorized to confirm this booking");

            if (booking.Status != BookingStatus.AwaitingPayment)
                return false;

            booking.Status = BookingStatus.Confirmed;
            booking.ConfirmedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateAsync(booking);
            return true;
        }

        public async Task<bool> CancelBookingAsync(int id, string userId)
        {
            var booking = await _bookingRepository.GetByIdAsync(id);
            if (booking == null) return false;

            if (booking.GuestId != userId && booking.Property.HostId != userId)
                throw new UnauthorizedAccessException("Not authorized");

            // ✅ التحقق من شرط الـ 24 ساعة (للجيست فقط)
            // إذا كان المستخدم هو الجيست، وتاريخ الحجز باقي عليه أقل من 24 ساعة
            if (booking.GuestId == userId && booking.CheckInDate < DateTime.UtcNow.AddHours(24))
            {
                throw new InvalidOperationException("Cannot cancel less than 24 hours before check-in.");
            }

            booking.Status = BookingStatus.Cancelled;

            await _bookingRepository.UpdateAsync(booking);
            return true;
        }

        private BookingResponseDto MapToResponseDto(Booking booking)
        {
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
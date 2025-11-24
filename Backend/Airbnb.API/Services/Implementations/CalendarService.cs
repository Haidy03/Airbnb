using Airbnb.API.DTOs.Calendar;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Services.Implementations
{
    public class CalendarService : ICalendarService
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CalendarService> _logger;

        public CalendarService(
            IPropertyRepository propertyRepository,
            IBookingRepository bookingRepository,
            ApplicationDbContext context,
            ILogger<CalendarService> logger)
        {
            _propertyRepository = propertyRepository;
            _bookingRepository = bookingRepository;
            _context = context;
            _logger = logger;
        }

        public async Task<CalendarAvailabilityDto> GetAvailabilityAsync(
            int propertyId,
            string hostId,
            DateTime startDate,
            DateTime endDate)
        {

            startDate = startDate.Date;  // Strip time component
            endDate = endDate.Date;

            // Verify property ownership
            var property = await _propertyRepository.GetByIdWithDetailsAsync(propertyId);
            if (property == null)
                throw new KeyNotFoundException("Property not found");

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("Not authorized");

            // Get bookings for this period
            var bookings = await _bookingRepository.GetByPropertyIdAsync(propertyId);
            var periodBookings = bookings.Where(b =>
                (b.CheckInDate >= startDate && b.CheckInDate <= endDate) ||
                (b.CheckOutDate >= startDate && b.CheckOutDate <= endDate) ||
                (b.CheckInDate <= startDate && b.CheckOutDate >= endDate)
            ).ToList();

            // Get custom availability/pricing
            var availabilities = await _context.PropertyAvailabilities
                .Where(pa => pa.PropertyId == propertyId &&
                            pa.Date >= startDate &&
                            pa.Date <= endDate)
                .ToListAsync();

            // Build calendar days
            var days = new List<CalendarDayDto>();
            var currentDate = startDate.Date;

            while (currentDate <= endDate.Date)
            {
                var dayAvailability = availabilities.FirstOrDefault(a => a.Date.Date == currentDate);

                // Check if day has booking
                var dayBooking = periodBookings.FirstOrDefault(b =>
                    b.CheckInDate.Date <= currentDate &&
                    b.CheckOutDate.Date > currentDate &&
                    (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending)
                );

                var isCheckIn = periodBookings.Any(b => b.CheckInDate.Date == currentDate);
                var isCheckOut = periodBookings.Any(b => b.CheckOutDate.Date == currentDate);

                // Determine price
                var isWeekend = currentDate.DayOfWeek == DayOfWeek.Friday ||
                               currentDate.DayOfWeek == DayOfWeek.Saturday;

                var basePrice = property.PricePerNight;
                var price = dayAvailability?.CustomPrice ?? basePrice;

                days.Add(new CalendarDayDto
                {
                    Date = currentDate,
                    IsAvailable = dayAvailability?.IsAvailable ?? (dayBooking == null),
                    Price = price,
                    OriginalPrice = dayAvailability?.CustomPrice.HasValue == true ? basePrice : null,
                    HasBooking = dayBooking != null,
                    BookingId = dayBooking?.Id,
                    BookingStatus = dayBooking?.Status.ToString(),
                    GuestName = dayBooking?.Guest?.FirstName + " " + dayBooking?.Guest?.LastName,
                    IsCheckIn = isCheckIn,
                    IsCheckOut = isCheckOut,
                    IsBlocked = dayAvailability?.IsAvailable == false,
                    Notes = dayAvailability?.Notes
                });

                currentDate = currentDate.AddDays(1);
            }

            return new CalendarAvailabilityDto
            {
                PropertyId = propertyId,
                PropertyTitle = property.Title,
                StartDate = startDate,
                EndDate = endDate,
                Days = days,
                Settings = new CalendarSettingsDto
                {
                    PropertyId = propertyId,
                    BasePrice = property.PricePerNight,
                    WeekendPrice = property.CleaningFee, // You might want a separate weekend price field
                    MinimumNights = property.MinimumStay,
                    MaximumNights = 365,
                    AdvanceNotice = 0,
                    PreparationTime = 1,
                    CheckInTime = property.CheckInTime,
                    CheckOutTime = property.CheckOutTime
                }
            };
        }

        public async Task<bool> UpdateAvailabilityAsync(UpdateAvailabilityDto dto, string hostId)
        {
            // Verify ownership
            var isOwner = await _propertyRepository.IsHostOwnerAsync(dto.PropertyId, hostId);
            if (!isOwner)
                throw new UnauthorizedAccessException("Not authorized");

            // Find or create availability record
            var availability = await _context.PropertyAvailabilities
                .FirstOrDefaultAsync(pa =>
                    pa.PropertyId == dto.PropertyId &&
                    pa.Date.Date == dto.Date.Date);

            if (availability == null)
            {
                availability = new PropertyAvailability
                {
                    PropertyId = dto.PropertyId,
                    Date = dto.Date.Date,
                    IsAvailable = dto.IsAvailable,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow
                };
                _context.PropertyAvailabilities.Add(availability);
            }
            else
            {
                availability.IsAvailable = dto.IsAvailable;
                availability.Notes = dto.Notes;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdatePricingAsync(UpdatePricingDto dto, string hostId)
        {
            // Verify ownership
            var isOwner = await _propertyRepository.IsHostOwnerAsync(dto.PropertyId, hostId);
            if (!isOwner)
                throw new UnauthorizedAccessException("Not authorized");

            // Find or create availability record
            var availability = await _context.PropertyAvailabilities
                .FirstOrDefaultAsync(pa =>
                    pa.PropertyId == dto.PropertyId &&
                    pa.Date.Date == dto.Date.Date);

            if (availability == null)
            {
                availability = new PropertyAvailability
                {
                    PropertyId = dto.PropertyId,
                    Date = dto.Date.Date,
                    IsAvailable = true,
                    CustomPrice = dto.Price,
                    Notes = dto.Notes,
                    CreatedAt = DateTime.UtcNow
                };
                _context.PropertyAvailabilities.Add(availability);
            }
            else
            {
                availability.CustomPrice = dto.Price;
                availability.Notes = dto.Notes;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> BulkUpdateAvailabilityAsync(BulkUpdateAvailabilityDto dto, string hostId)
        {
            // Verify ownership
            var isOwner = await _propertyRepository.IsHostOwnerAsync(dto.PropertyId, hostId);
            if (!isOwner)
                throw new UnauthorizedAccessException("Not authorized");

            int updatedCount = 0;
            var currentDate = dto.StartDate.Date;

            while (currentDate <= dto.EndDate.Date)
            {
                var availability = await _context.PropertyAvailabilities
                    .FirstOrDefaultAsync(pa =>
                        pa.PropertyId == dto.PropertyId &&
                        pa.Date.Date == currentDate);

                if (availability == null)
                {
                    availability = new PropertyAvailability
                    {
                        PropertyId = dto.PropertyId,
                        Date = currentDate,
                        IsAvailable = dto.IsAvailable,
                        CustomPrice = dto.CustomPrice,
                        Notes = dto.Notes,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.PropertyAvailabilities.Add(availability);
                }
                else
                {
                    availability.IsAvailable = dto.IsAvailable;
                    if (dto.CustomPrice.HasValue)
                        availability.CustomPrice = dto.CustomPrice;
                    availability.Notes = dto.Notes;
                }

                updatedCount++;
                currentDate = currentDate.AddDays(1);
            }

            await _context.SaveChangesAsync();
            return updatedCount;
        }

        public async Task<CalendarSettingsDto> GetCalendarSettingsAsync(int propertyId, string hostId)
        {
            var property = await _propertyRepository.GetByIdAsync(propertyId);
            if (property == null)
                throw new KeyNotFoundException("Property not found");

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("Not authorized");

            return new CalendarSettingsDto
            {
                PropertyId = propertyId,
                BasePrice = property.PricePerNight,
                WeekendPrice = property.CleaningFee,
                MinimumNights = property.MinimumStay,
                MaximumNights = 365,
                AdvanceNotice = 0,
                PreparationTime = 1,
                CheckInTime = property.CheckInTime,
                CheckOutTime = property.CheckOutTime
            };
        }

        public async Task<bool> UpdateCalendarSettingsAsync(UpdateCalendarSettingsDto dto, string hostId)
        {
            var property = await _propertyRepository.GetByIdAsync(dto.PropertyId);
            if (property == null)
                throw new KeyNotFoundException("Property not found");

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("Not authorized");

            // Update settings
            if (dto.BasePrice.HasValue)
                property.PricePerNight = dto.BasePrice.Value;

            if (dto.MinimumNights.HasValue)
                property.MinimumStay = dto.MinimumNights.Value;

            if (dto.CheckInTime.HasValue)
                property.CheckInTime = dto.CheckInTime;

            if (dto.CheckOutTime.HasValue)
                property.CheckOutTime = dto.CheckOutTime;

            property.UpdatedAt = DateTime.UtcNow;

            await _propertyRepository.UpdateAsync(property);
            return true;
        }
    }
}
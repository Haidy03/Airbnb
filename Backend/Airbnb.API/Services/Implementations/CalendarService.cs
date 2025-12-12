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
               b.Status != BookingStatus.Cancelled && 
               b.Status != BookingStatus.Rejected &&  
               (
                   (b.CheckInDate >= startDate && b.CheckInDate <= endDate) ||
                   (b.CheckOutDate >= startDate && b.CheckOutDate <= endDate) ||
                   (b.CheckInDate <= startDate && b.CheckOutDate >= endDate)
               )
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
                var isActuallyAvailable = dayAvailability != null
                                        ? dayAvailability.IsAvailable
                                        : (dayBooking == null);
                days.Add(new CalendarDayDto
                {
                    Date = currentDate,
                    IsAvailable = isActuallyAvailable,
                    Price = price,
                    OriginalPrice = dayAvailability?.CustomPrice.HasValue == true ? basePrice : null,
                    HasBooking = dayBooking != null,
                    BookingId = dayBooking?.Id,
                    BookingStatus = dayBooking?.Status.ToString(),
                    GuestName = dayBooking?.Guest?.FirstName + " " + dayBooking?.Guest?.LastName,
                    IsCheckIn = isCheckIn,
                    IsCheckOut = isCheckOut,
                    IsBlocked = !isActuallyAvailable,
                    Notes = dayAvailability?.Notes,
                    SpecificCheckInTime = dayAvailability?.SpecificCheckInTime,
                    SpecificCheckOutTime = dayAvailability?.SpecificCheckOutTime
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
                    CleaningFee = property.CleaningFee, // You might want a separate weekend price field
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
            TimeSpan? ParseTime(string? timeStr)
            {
                if (string.IsNullOrEmpty(timeStr)) return null;
                return TimeSpan.TryParse(timeStr, out var ts) ? ts : null;
            }

            if (availability == null)
            {
                availability = new PropertyAvailability
                {
                    PropertyId = dto.PropertyId,
                    Date = dto.Date.Date,
                    IsAvailable = dto.IsAvailable,
                    Notes = dto.Notes,
                    SpecificCheckInTime = ParseTime(dto.CheckInTime),
                    SpecificCheckOutTime = ParseTime(dto.CheckOutTime),
                    CreatedAt = DateTime.UtcNow
                };
                _context.PropertyAvailabilities.Add(availability);
            }
            else
            {
                availability.IsAvailable = dto.IsAvailable;
                availability.Notes = dto.Notes;
                availability.SpecificCheckInTime = ParseTime(dto.CheckInTime);
                availability.SpecificCheckOutTime = ParseTime(dto.CheckOutTime);
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

        public async Task<List<string>> GetBlockedDatesAsync(int propertyId)
        {
            var today = DateTime.UtcNow.Date;

            // 1. Get dates manually blocked by the host (IsAvailable = false)
            var manualBlockedDates = await _context.PropertyAvailabilities
                .Where(pa => pa.PropertyId == propertyId
                             && pa.IsAvailable == false
                             && pa.Date >= today)
                .Select(pa => pa.Date)
                .ToListAsync();

            // 2. Get dates occupied by CONFIRMED bookings
            // We fetch bookings that end after today
            var bookings = await _bookingRepository.GetByPropertyIdAsync(propertyId);
            var confirmedBookings = bookings
                .Where(b => (b.Status == BookingStatus.Confirmed) && b.CheckOutDate > today)
                .ToList();

            var allBlockedDates = new HashSet<DateTime>(manualBlockedDates);

            foreach (var booking in confirmedBookings)
            {
                // Loop through every night of the booking
                // Note: We go from CheckIn up to (but not including) CheckOut
                // because the checkout day is technically available for the next guest to check in
                for (var day = booking.CheckInDate.Date; day < booking.CheckOutDate.Date; day = day.AddDays(1))
                {
                    if (day >= today)
                    {
                        allBlockedDates.Add(day);
                    }
                }
            }

            // Return as list of strings "yyyy-MM-dd"
            return allBlockedDates
                .OrderBy(d => d)
                .Select(d => d.ToString("yyyy-MM-dd"))
                .ToList();
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
                CleaningFee = property.CleaningFee,
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
            if (dto.CleaningFee.HasValue)
                property.CleaningFee = dto.CleaningFee.Value;

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
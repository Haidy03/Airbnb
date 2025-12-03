using Airbnb.API.DTOs.Booking;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Host
{
    [Route("api/host/[controller]")]
    [ApiController]
    // [Authorize] // ⚠️ Uncomment في Production
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly ILogger<BookingController> _logger;

        public BookingController(
            IBookingService bookingService,
            ILogger<BookingController> logger)
        {
            _bookingService = bookingService;
            _logger = logger;
        }

        private string GetHostId()
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return string.IsNullOrEmpty(hostId) ? "test-host-12345" : hostId;
        }

        /// <summary>
        /// Get ALL bookings for host's properties
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllBookings()
        {
            try
            {
                var hostId = GetHostId();
                var bookings = await _bookingService.GetHostBookingsAsync(hostId);

                return Ok(new
                {
                    success = true,
                    data = bookings,
                    count = bookings.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all bookings");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get TODAY's bookings
        /// </summary>
        [HttpGet("today")]
        public async Task<IActionResult> GetTodayBookings()
        {
            try
            {
                var hostId = GetHostId();
                var allBookings = await _bookingService.GetHostBookingsAsync(hostId);

                var today = DateTime.Now.Date;

                _logger.LogInformation("Checking for TODAY: {Today}", today.ToString("yyyy-MM-dd"));

                var todayBookings = allBookings.Where(b =>
                {
                    var checkIn = b.CheckInDate.Date;
                    var checkOut = b.CheckOutDate.Date;

                    bool isToday = (checkIn == today || checkOut == today);
                    bool isValidStatus = b.Status != "Cancelled" && b.Status != "Rejected";

                    if (isToday)
                    {
                        _logger.LogInformation(
                            "Found TODAY booking: ID={Id}, CheckIn={CheckIn}, CheckOut={CheckOut}, Status={Status}",
                            b.Id, checkIn.ToString("yyyy-MM-dd"), checkOut.ToString("yyyy-MM-dd"), b.Status
                        );
                    }

                    return isToday && isValidStatus;
                }).ToList();

                _logger.LogInformation("Total TODAY bookings: {Count}", todayBookings.Count);

                return Ok(new
                {
                    success = true,
                    data = todayBookings,
                    count = todayBookings.Count,
                    debug = new
                    {
                        todayDate = today.ToString("yyyy-MM-dd"),
                        totalBookings = allBookings.Count(),
                        filteredCount = todayBookings.Count
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting today's bookings");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get UPCOMING bookings - FINAL FIX
        /// </summary>
        [HttpGet("upcoming")]
        public async Task<IActionResult> GetUpcomingBookings()
        {
            try
            {
                var hostId = GetHostId();
                var allBookings = await _bookingService.GetHostBookingsAsync(hostId);

                var today = DateTime.Now.Date;
                var next30Days = today.AddDays(30);

                _logger.LogInformation("Checking UPCOMING: {Today} to {End}",
                    today.ToString("yyyy-MM-dd"),
                    next30Days.ToString("yyyy-MM-dd"));

                var upcomingBookings = allBookings.Where(b =>
                {
                    var checkIn = b.CheckInDate.Date;

                    bool isUpcoming = checkIn > today && checkIn <= next30Days;
                    bool isValidStatus = b.Status == "Confirmed" || b.Status == "Pending";

                    if (isUpcoming && isValidStatus)
                    {
                        _logger.LogInformation(
                            "Found UPCOMING booking: ID={Id}, CheckIn={CheckIn}, Status={Status}",
                            b.Id, checkIn.ToString("yyyy-MM-dd"), b.Status
                        );
                    }

                    return isUpcoming && isValidStatus;
                })
                .OrderBy(b => b.CheckInDate)
                .ToList();

                _logger.LogInformation("Total UPCOMING bookings: {Count}", upcomingBookings.Count);

                return Ok(new
                {
                    success = true,
                    data = upcomingBookings,
                    count = upcomingBookings.Count,
                    debug = new
                    {
                        todayDate = today.ToString("yyyy-MM-dd"),
                        endDate = next30Days.ToString("yyyy-MM-dd"),
                        totalBookings = allBookings.Count(),
                        filteredCount = upcomingBookings.Count
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting upcoming bookings");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Get PENDING bookings (awaiting approval)
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingBookings()
        {
            try
            {
                var hostId = GetHostId();
                var allBookings = await _bookingService.GetHostBookingsAsync(hostId);

                var pendingBookings = allBookings
                    .Where(b => b.Status == "Pending")
                    .OrderBy(b => b.CreatedAt)
                    .ToList();

                return Ok(new
                {
                    success = true,
                    data = pendingBookings,
                    count = pendingBookings.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending bookings");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get booking details by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBookingById(int id)
        {
            try
            {
                var hostId = GetHostId();
                var booking = await _bookingService.GetBookingByIdAsync(id, hostId);

                if (booking == null)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new { success = true, data = booking });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Approve a pending booking
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveBooking(int id)
        {
            try
            {
                var hostId = GetHostId();
                var success = await _bookingService.ApproveBookingAsync(id, hostId);

                if (!success)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new
                {
                    success = true,
                    message = "Booking approved successfully"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error approving booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Decline a pending booking
        /// </summary>
        [HttpPost("{id}/decline")]
        public async Task<IActionResult> DeclineBooking(int id)
        {
            try
            {
                var hostId = GetHostId();
                var success = await _bookingService.DeclineBookingAsync(id, hostId);

                if (!success)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new
                {
                    success = true,
                    message = "Booking declined successfully"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error declining booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Cancel a booking (by host)
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            try
            {
                var hostId = GetHostId();
                var success = await _bookingService.CancelBookingAsync(id, hostId);

                if (!success)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new
                {
                    success = true,
                    message = "Booking cancelled successfully"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get bookings for specific property
        /// </summary>
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetPropertyBookings(int propertyId)
        {
            try
            {
                var hostId = GetHostId();
                var bookings = await _bookingService.GetPropertyBookingsAsync(propertyId, hostId);

                return Ok(new
                {
                    success = true,
                    data = bookings,
                    count = bookings.Count()
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bookings for property {PropertyId}", propertyId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }
}
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Host
{
    [ApiController]
    [Route("api/host/[controller]")] // Maps to: api/host/booking
    [Authorize] // Only logged-in users
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

        // 1. Get all bookings for this host's properties
        // GET: api/host/booking
        [HttpGet]
        public async Task<IActionResult> GetMyBookings()
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
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
                _logger.LogError(ex, "Error getting host bookings");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // 2. Get a specific booking detail
        // GET: api/host/booking/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBookingById(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // We reuse the service method. It checks if the user (hostId) is allowed to see it.
                var booking = await _bookingService.GetBookingByIdAsync(id, hostId);

                if (booking == null)
                    return NotFound(new { success = false, message = "Booking not found or access denied" });

                return Ok(new
                {
                    success = true,
                    data = booking
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking {BookingId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // 3. Get bookings for a specific property
        // GET: api/host/booking/property/{propertyId}
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetPropertyBookings(int propertyId)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
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

        // 4. Approve a booking
        // POST: api/host/booking/{id}/approve
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveBooking(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _bookingService.ApproveBookingAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new { success = true, message = "Booking approved successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // 5. Decline a booking
        // POST: api/host/booking/{id}/decline
        [HttpPost("{id}/decline")]
        public async Task<IActionResult> DeclineBooking(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _bookingService.DeclineBookingAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new { success = true, message = "Booking declined successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // 6. Cancel a booking (Host cancels a confirmed trip)
        // POST: api/host/booking/{id}/cancel
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _bookingService.CancelBookingAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new { success = true, message = "Booking cancelled successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
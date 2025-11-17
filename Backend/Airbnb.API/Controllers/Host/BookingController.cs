using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Host
{
    [ApiController]
    [Route("api/host/[controller]")]
    [Authorize]
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

        /// <summary>
        /// Get all bookings for the authenticated host
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyBookings()
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

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

        /// <summary>
        /// Get a specific booking by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBookingById(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                var booking = await _bookingService.GetBookingByIdAsync(id, hostId);

                if (booking == null)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new
                {
                    success = true,
                    data = booking
                });
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
        /// Get all bookings for a specific property
        /// </summary>
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetPropertyBookings(int propertyId)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

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

        /// <summary>
        /// Approve a pending booking
        /// </summary>
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveBooking(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                var result = await _bookingService.ApproveBookingAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Booking not found" });

                _logger.LogInformation("Booking {BookingId} approved by host {HostId}", id, hostId);

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
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                var result = await _bookingService.DeclineBookingAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Booking not found" });

                _logger.LogInformation("Booking {BookingId} declined by host {HostId}", id, hostId);

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
        /// Cancel a confirmed booking
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized(new { success = false, message = "User not authenticated" });

                var result = await _bookingService.CancelBookingAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Booking not found" });

                _logger.LogInformation("Booking {BookingId} cancelled by host {HostId}", id, hostId);

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
    }
}
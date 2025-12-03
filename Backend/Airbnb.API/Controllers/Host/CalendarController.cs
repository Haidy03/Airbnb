using Airbnb.API.DTOs.Calendar;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Host
{
    [ApiController]
    [Route("api/host/[controller]")]
   // [Authorize]
    public class CalendarController : ControllerBase
    {
        private readonly ICalendarService _calendarService;
        private readonly ILogger<CalendarController> _logger;

        public CalendarController(
            ICalendarService calendarService,
            ILogger<CalendarController> logger)
        {
            _calendarService = calendarService;
            _logger = logger;
        }

        /// <summary>
        /// Get calendar availability for a property
        /// </summary>
        [HttpGet("availability/{propertyId}")]
        public async Task<IActionResult> GetAvailability(
            int propertyId,
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    hostId = "test-host-12345";
                }

                var availability = await _calendarService.GetAvailabilityAsync(
                    propertyId,
                    hostId,
                    startDate,
                    endDate
                );

                return Ok(new
                {
                    success = true,
                    data = availability
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting availability for property {PropertyId}", propertyId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update availability for specific dates
        /// </summary>
        [HttpPost("availability")]
        public async Task<IActionResult> UpdateAvailability([FromBody] UpdateAvailabilityDto dto)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    hostId = "test-host-12345";
                }

                var result = await _calendarService.UpdateAvailabilityAsync(dto, hostId);

                if (!result)
                    return BadRequest(new { success = false, message = "Failed to update availability" });

                return Ok(new
                {
                    success = true,
                    message = "Availability updated successfully"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating availability");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update pricing for specific dates
        /// </summary>
        [HttpPost("pricing")]
        public async Task<IActionResult> UpdatePricing([FromBody] UpdatePricingDto dto)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    hostId = "test-host-12345"; 
                }

                var result = await _calendarService.UpdatePricingAsync(dto, hostId);

                if (!result)
                    return BadRequest(new { success = false, message = "Failed to update pricing" });

                return Ok(new
                {
                    success = true,
                    message = "Pricing updated successfully"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating pricing");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Bulk update availability for date range
        /// </summary>
        [HttpPost("availability/bulk")]
        public async Task<IActionResult> BulkUpdateAvailability([FromBody] BulkUpdateAvailabilityDto dto)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    hostId = "test-host-12345";
                }

                var result = await _calendarService.BulkUpdateAvailabilityAsync(dto, hostId);

                return Ok(new
                {
                    success = true,
                    message = $"Updated {result} dates",
                    datesUpdated = result
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk updating availability");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get calendar settings for a property
        /// </summary>
        [HttpGet("settings/{propertyId}")]
        public async Task<IActionResult> GetCalendarSettings(int propertyId)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    hostId = "test-host-12345";
                }

                var settings = await _calendarService.GetCalendarSettingsAsync(propertyId, hostId);

                return Ok(new
                {
                    success = true,
                    data = settings
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting calendar settings");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update calendar settings
        /// </summary>
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateCalendarSettings([FromBody] UpdateCalendarSettingsDto dto)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    hostId = "test-host-12345";
                }

                var result = await _calendarService.UpdateCalendarSettingsAsync(dto, hostId);

                if (!result)
                    return BadRequest(new { success = false, message = "Failed to update settings" });

                return Ok(new
                {
                    success = true,
                    message = "Settings updated successfully"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating calendar settings");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        [HttpGet("availability/{propertyId}/blocked")]
        [AllowAnonymous] 
        public async Task<IActionResult> GetBlockedDates(int propertyId)
        {
            try
            {
                var blockedDates = await _calendarService.GetBlockedDatesAsync(propertyId);
                return Ok(blockedDates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting blocked dates for property {PropertyId}", propertyId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

    }
}
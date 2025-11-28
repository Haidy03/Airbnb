using Airbnb.API.DTOs.Experiences;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExperiencesController : ControllerBase
    {
        private readonly IExperienceService _experienceService;
        private readonly ILogger<ExperiencesController> _logger;

        public ExperiencesController(
            IExperienceService experienceService,
            ILogger<ExperiencesController> logger)
        {
            _experienceService = experienceService;
            _logger = logger;
        }

        // Helper method to get current user ID
        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        // ==========================================
        // PUBLIC ENDPOINTS (Browse Experiences)
        // ==========================================

        /// <summary>
        /// Search and filter experiences
        /// GET: api/experiences/search
        /// </summary>
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchExperiences([FromQuery] ExperienceSearchDto dto)
        {
            try
            {
                var result = await _experienceService.SearchExperiencesAsync(dto);

                return Ok(new
                {
                    success = true,
                    data = result.Items,
                    totalCount = result.TotalCount,
                    pageNumber = result.PageIndex,
                    pageSize = result.PageSize,
                    totalPages = (int)Math.Ceiling(result.TotalCount / (double)result.PageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching experiences");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get featured experiences (homepage)
        /// GET: api/experiences/featured
        /// </summary>
        [HttpGet("featured")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFeaturedExperiences([FromQuery] int count = 8)
        {
            try
            {
                var experiences = await _experienceService.GetFeaturedExperiencesAsync(count);

                return Ok(new
                {
                    success = true,
                    data = experiences,
                    count = experiences.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting featured experiences");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // أضف هذه الدالة داخل الكلاس

        /// <summary>
        /// Add availability slot (Host only)
        /// POST: api/experiences/{id}/availability
        /// </summary>
        [HttpPost("{id}/availability")]
        [Authorize]
        public async Task<IActionResult> AddAvailability(int id, [FromBody] CreateAvailabilityDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _experienceService.AddAvailabilityAsync(id, userId, dto);

                return Ok(new { success = true, data = result, message = "Availability added successfully" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Experience not found" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding availability to experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error: " + ex.Message });
            }
        }

        /// <summary>
        /// Get availability slots for an experience
        /// GET: api/experiences/{id}/availability
        /// </summary>
        [HttpGet("{id}/availability")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailability(int id, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var availabilities = await _experienceService.GetAvailabilitiesAsync(id, startDate, endDate);

                return Ok(new
                {
                    success = true,
                    data = availabilities
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting availability for experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
        /// <summary>
        /// Get all experience categories
        /// GET: api/experiences/categories
        /// </summary>
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var categories = await _experienceService.GetCategoriesAsync();

                return Ok(new
                {
                    success = true,
                    data = categories,
                    count = categories.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting categories");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get experience by ID (public details)
        /// GET: api/experiences/{id}
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetExperience(int id)
        {
            try
            {
                var experience = await _experienceService.GetExperienceByIdAsync(id);

                if (experience == null)
                    return NotFound(new { success = false, message = "Experience not found" });

                return Ok(new { success = true, data = experience });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // HOST ENDPOINTS (Manage Experiences)
        // ==========================================

        /// <summary>
        /// Get all experiences for current host
        /// GET: api/experiences/host/my-experiences
        /// </summary>
        [HttpGet("host/my-experiences")]
        [Authorize]
        public async Task<IActionResult> GetMyExperiences()
        {
            try
            {
                var userId = GetCurrentUserId();
                var experiences = await _experienceService.GetHostExperiencesAsync(userId);

                return Ok(new
                {
                    success = true,
                    data = experiences,
                    count = experiences.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host experiences");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create new experience
        /// POST: api/experiences
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateExperience([FromBody] CreateExperienceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var userId = GetCurrentUserId();
                var experience = await _experienceService.CreateExperienceAsync(userId, dto);

                return CreatedAtAction(
                    nameof(GetExperience),
                    new { id = experience.Id },
                    new { success = true, data = experience, message = "Experience created successfully" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating experience");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update experience
        /// PUT: api/experiences/{id}
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateExperience(int id, [FromBody] UpdateExperienceDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var experience = await _experienceService.UpdateExperienceAsync(id, userId, dto);

                return Ok(new { success = true, data = experience, message = "Experience updated successfully" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Experience not found" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete experience
        /// DELETE: api/experiences/{id}
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteExperience(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _experienceService.DeleteExperienceAsync(id, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Experience not found" });

                return Ok(new { success = true, message = "Experience deleted successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Submit experience for approval
        /// POST: api/experiences/{id}/submit
        /// </summary>
        [HttpPost("{id}/submit")]
        [Authorize]
        public async Task<IActionResult> SubmitForApproval(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _experienceService.SubmitForApprovalAsync(id, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Experience not found" });

                return Ok(new { success = true, message = "Experience submitted for approval" });
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
                _logger.LogError(ex, "Error submitting experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Activate experience (after approval)
        /// POST: api/experiences/{id}/activate
        /// </summary>
        [HttpPost("{id}/activate")]
        [Authorize]
        public async Task<IActionResult> ActivateExperience(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _experienceService.ActivateExperienceAsync(id, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Experience not found" });

                return Ok(new { success = true, message = "Experience activated successfully" });
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
                _logger.LogError(ex, "Error activating experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // IMAGE MANAGEMENT
        // ==========================================

        /// <summary>
        /// Upload experience image
        /// POST: api/experiences/{id}/images
        /// </summary>
        [HttpPost("{id}/images")]
        [Authorize]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            try
            {
                var userId = GetCurrentUserId();
                var image = await _experienceService.UploadImageAsync(id, userId, file);

                return Ok(new { success = true, data = image, message = "Image uploaded successfully" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Experience not found" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image for experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete experience image
        /// DELETE: api/experiences/images/{imageId}
        /// </summary>
        [HttpDelete("images/{imageId}")]
        [Authorize]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _experienceService.DeleteImageAsync(imageId, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Image not found" });

                return Ok(new { success = true, message = "Image deleted successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image {ImageId}", imageId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Set primary image
        /// PATCH: api/experiences/images/{imageId}/primary
        /// </summary>
        [HttpPatch("images/{imageId}/primary")]
        [Authorize]
        public async Task<IActionResult> SetPrimaryImage(int imageId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _experienceService.SetPrimaryImageAsync(imageId, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Image not found" });

                return Ok(new { success = true, message = "Primary image updated successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image {ImageId}", imageId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // BOOKING ENDPOINTS (Guest)
        // ==========================================

        /// <summary>
        /// Book an experience
        /// POST: api/experiences/{id}/book
        /// </summary>
        [HttpPost("{id}/book")]
        [Authorize]
        public async Task<IActionResult> BookExperience(int id, [FromBody] BookExperienceDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var userId = GetCurrentUserId();
                var booking = await _experienceService.BookExperienceAsync(id, userId, dto);

                return Ok(new { success = true, data = booking, message = "Experience booked successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error booking experience {ExperienceId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get guest bookings
        /// GET: api/experiences/bookings/my-bookings
        /// </summary>
        [HttpGet("bookings/my-bookings")]
        [Authorize]
        public async Task<IActionResult> GetMyBookings()
        {
            try
            {
                var userId = GetCurrentUserId();
                var bookings = await _experienceService.GetGuestBookingsAsync(userId);

                return Ok(new
                {
                    success = true,
                    data = bookings,
                    count = bookings.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting guest bookings");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Cancel booking
        /// DELETE: api/experiences/bookings/{bookingId}
        /// </summary>
        [HttpDelete("bookings/{bookingId}")]
        [Authorize]
        public async Task<IActionResult> CancelBooking(int bookingId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _experienceService.CancelBookingAsync(bookingId, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Booking not found" });

                return Ok(new { success = true, message = "Booking cancelled successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling booking {BookingId}", bookingId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        #region Reviews

        /// <summary>
        /// Add a review for an experience
        /// POST: api/experiences/reviews
        /// </summary>
        [HttpPost("reviews")]
        [Authorize]
        public async Task<IActionResult> AddReview([FromBody] CreateReviewDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var review = await _experienceService.AddReviewAsync(userId, dto);
                return Ok(new { success = true, data = review, message = "Review added successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding review");
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// GET: api/experiences/{id}/reviews
        /// </summary>
        [HttpGet("{id}/reviews")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviews(int id)
        {
            var reviews = await _experienceService.GetReviewsByExperienceIdAsync(id);
            return Ok(new { success = true, data = reviews });
        }

        #endregion
    }
}
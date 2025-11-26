using Airbnb.API.DTOs.Review;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Review
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        /// <summary>
        /// Create a new review
        /// </summary>
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ReviewResponseDto>> CreateReview([FromBody] CreateReviewDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var review = await _reviewService.CreateReviewAsync(userId, dto);
                return CreatedAtAction(nameof(GetReviewById), new { id = review.Id }, review);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing review
        /// </summary>
        [Authorize]
        [HttpPut("{id}")]
        public async Task<ActionResult<ReviewResponseDto>> UpdateReview(int id, [FromBody] UpdateReviewDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var review = await _reviewService.UpdateReviewAsync(userId, id, dto);
                return Ok(review);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a review
        /// </summary>
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized(new { message = "User not authenticated" });

                var result = await _reviewService.DeleteReviewAsync(userId, id);

                if (!result)
                    return NotFound(new { message = "Review not found" });

                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get review by ID
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ReviewResponseDto>> GetReviewById(int id)
        {
            var review = await _reviewService.GetReviewByIdAsync(id);

            if (review == null)
                return NotFound(new { message = "Review not found" });

            return Ok(review);
        }

        /// <summary>
        /// Get all reviews for a property with pagination
        /// </summary>
        [HttpGet("property/{propertyId}")]
        public async Task<ActionResult<PropertyReviewsSummaryDto>> GetPropertyReviews(
            int propertyId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 50) pageSize = 10;

                var reviews = await _reviewService.GetPropertyReviewsAsync(propertyId, page, pageSize);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all reviews for a guest
        /// </summary>
        [HttpGet("guest/{guestId}")]
        public async Task<ActionResult<GuestReviewsSummaryDto>> GetGuestReviews(string guestId)
        {
            try
            {
                var reviews = await _reviewService.GetGuestReviewsAsync(guestId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Check if user can review a booking
        /// </summary>
        [Authorize]
        [HttpGet("can-review/{bookingId}")]
        public async Task<ActionResult<CanReviewResponseDto>> CanReview(int bookingId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var result = await _reviewService.CanUserReviewAsync(userId, bookingId);
            return Ok(result);
        }

        /// <summary>
        /// Get all reviews given or received by current user
        /// </summary>
        [Authorize]
        [HttpGet("my-reviews")]
        public async Task<ActionResult<List<ReviewResponseDto>>> GetMyReviews()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var reviews = await _reviewService.GetUserReviewsAsync(userId);
            return Ok(reviews);
        }



        /// <summary>
        /// Get aggregated reviews for the current host
        /// </summary>
        // تأكدي أن [HttpGet("host")] مكتوبة هكذا
        [Authorize]
        [HttpGet("host")]
        public async Task<ActionResult<HostReviewsResponseDto>> GetHostReviews()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                // ... باقي الكود
                var result = await _reviewService.GetHostReviewsAsync(userId);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}

using Airbnb.API.DTOs.Services;
using Airbnb.API.Services.Interfaces;
using Airbnb.API.DTOs.Review;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicesController : ControllerBase
    {
        private readonly IServicesService _servicesService; 
        public ServicesController(IServicesService servicesService)
        {
            _servicesService = servicesService;
        }

        // GET: api/Services/featured
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedServices()
        {
            var result = await _servicesService.GetFeaturedServicesAsync();
            return Ok(new { success = true, data = result });
        }

        // GET: api/Services/category/Chefs
        [HttpGet("category/{categoryName}")]
        public async Task<IActionResult> GetServicesByCategory(string categoryName)
        {
            var result = await _servicesService.GetServicesByCategoryAsync(categoryName);
            return Ok(new { success = true, data = result });
        }

        // POST: api/Services
        [HttpPost]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> CreateService([FromForm] CreateServiceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _servicesService.CreateServiceAsync(userId, dto);

            return Ok(new { success = true, message = "Service created successfully and pending approval." });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetServiceDetails(int id)
        {
            var service = await _servicesService.GetServiceByIdAsync(id);
            if (service == null) return NotFound(new { success = false, message = "Service not found" });

            return Ok(new { success = true, data = service });
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories()
        {
           var categories = await _servicesService.GetAllCategoriesAsync();
            return Ok(new { success = true, data = categories });
        }

        [HttpGet("my-services")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> GetMyServices()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _servicesService.GetHostServicesAsync(userId);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("book")]
        [Authorize] // Guests and Hosts can book
        public async Task<IActionResult> BookService([FromBody] BookServiceDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var bookingId = await _servicesService.BookServiceAsync(userId, dto);

                return Ok(new
                {
                    success = true,
                    message = "Service booking created successfully",
                    bookingId = bookingId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("host/{id}")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> GetHostServiceDetails(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var service = await _servicesService.GetHostServiceDetailsAsync(id, userId);

            if (service == null) return NotFound(new { message = "Service not found or unauthorized" });
            return Ok(new { success = true, data = service });
        }

        // DELETE: api/Services/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> DeleteService(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _servicesService.DeleteServiceAsync(id, userId);

            if (!result) return NotFound(new { message = "Service not found or unauthorized" });
            return Ok(new { success = true, message = "Service deleted successfully" });
        }

        // PATCH: api/Services/{id}/toggle-status
        [HttpPatch("{id}/toggle-status")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _servicesService.ToggleServiceStatusAsync(id, userId);

                if (!result) return NotFound(new { message = "Service not found" });
                return Ok(new { success = true, message = "Service status updated" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("booking/{id}/confirm-payment")]
        public async Task<IActionResult> ConfirmServicePayment(int id)
        {
            return Ok(new { success = true, message = "Service payment confirmed" });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] UpdateServiceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var success = await _servicesService.UpdateServiceAsync(id, userId, dto);

            if (!success) return NotFound(new { message = "Service not found or unauthorized" });

            return Ok(new { success = true, message = "Service updated successfully" });
        }

        [HttpPost("reviews")]
        [Authorize]
        public async Task<IActionResult> AddReview([FromBody] CreateReviewDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _servicesService.AddReviewAsync(userId, dto);
            return Ok(new { success = true, data = result });
        }

        
        [HttpGet("{id}/reviews")]
        public async Task<IActionResult> GetServiceReviews(int id)
        {
            var reviews = await _servicesService.GetReviewsByServiceIdAsync(id);
            return Ok(new { success = true, data = reviews });
        }

        
        [HttpGet("reviews/{reviewId}")]
        public async Task<IActionResult> GetReviewById(int reviewId)
        {
            var review = await _servicesService.GetServiceReviewDtoByIdAsync(reviewId);

            if (review == null) return NotFound(new { message = "Review not found" });

            return Ok(new { success = true, data = review });
        }

        [HttpDelete("reviews/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _servicesService.DeleteReviewAsync(id, userId);
            return Ok(new { success = true, message = "Review deleted" });
        }

        [HttpPut("reviews/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _servicesService.UpdateServiceReviewAsync(id, userId, dto);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("bookings/{bookingId}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelBooking(int bookingId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _servicesService.CancelBookingAsync(bookingId, userId);

                if (!result) return NotFound(new { message = "Booking not found" });

                return Ok(new { success = true, message = "Booking cancelled successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("{id}/images")]
        [Authorize]
        public async Task<IActionResult> UploadImage(int id, IFormFile file)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var url = await _servicesService.UploadServiceImageAsync(id, userId, file);
                return Ok(new { success = true, url });
            }
            catch (UnauthorizedAccessException) { return Forbid(); }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpDelete("images/{imageId}")]
        [Authorize]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _servicesService.DeleteServiceImageAsync(imageId, userId);
                return result ? Ok(new { success = true }) : NotFound();
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

        [HttpPatch("images/{imageId}/cover")]
        [Authorize]
        public async Task<IActionResult> SetCover(int imageId)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var result = await _servicesService.SetCoverImageAsync(imageId, userId);
                return result ? Ok(new { success = true }) : NotFound();
            }
            catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
        }

    }
}
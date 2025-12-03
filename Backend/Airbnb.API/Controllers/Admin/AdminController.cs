using Airbnb.API.DTOs.Admin;
using Airbnb.API.DTOs.Booking;
using Airbnb.API.DTOs.Experiences;
using Airbnb.API.DTOs.Review;
using Airbnb.API.Models;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.Controllers
{
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;
        private readonly IExperienceService _experienceService;
        private readonly IServicesService _servicesService;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger, IExperienceService experienceService, IServicesService servicesService)
        {
            _adminService = adminService;
            _experienceService = experienceService;
            _logger = logger;
            _servicesService = servicesService;
        }

        #region Dashboard & Analytics

        /// <summary>
        /// Get dashboard statistics
        /// </summary>
        [HttpGet("dashboard/stats")]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
        {
            try
            {
                var stats = await _adminService.GetDashboardStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                return StatusCode(500, "Error retrieving dashboard statistics");
            }
        }

        /// <summary>
        /// Get revenue report
        /// </summary>
        [HttpGet("analytics/revenue")]
        public async Task<ActionResult<RevenueReportDto>> GetRevenueReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var report = await _adminService.GetRevenueReportAsync(startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue report");
                return StatusCode(500, "Error retrieving revenue report");
            }
        }

        /// <summary>
        /// Get user activity report
        /// </summary>
        [HttpGet("analytics/user-activity")]
        public async Task<ActionResult<UserActivityReportDto>> GetUserActivityReport(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var report = await _adminService.GetUserActivityReportAsync(startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activity report");
                return StatusCode(500, "Error retrieving user activity report");
            }
        }

        /// <summary>
        /// Get occupancy report
        /// </summary>
        [HttpGet("analytics/occupancy")]
        public async Task<ActionResult<OccupancyReportDto>> GetOccupancyReport()
        {
            try
            {
                var report = await _adminService.GetOccupancyReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting occupancy report");
                return StatusCode(500, "Error retrieving occupancy report");
            }
        }

        #endregion

        #region User Management

        /// <summary>
        /// Get all users with optional filters
        /// </summary>
        [HttpGet("users")]
        public async Task<ActionResult<List<AdminUserDto>>> GetAllUsers(
            [FromQuery] string? role = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var users = await _adminService.GetAllUsersAsync(role, searchTerm, pageNumber, pageSize);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "Error retrieving users");
            }
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        [HttpGet("users/{userId}")]
        public async Task<ActionResult<AdminUserDto>> GetUserById(string userId)
        {
            try
            {
                var user = await _adminService.GetUserByIdAsync(userId);
                if (user == null)
                    return NotFound("User not found");

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user {userId}");
                return StatusCode(500, "Error retrieving user");
            }
        }

        /// <summary>
        /// Update user status (Active/Inactive)
        /// </summary>
        [HttpPut("users/{userId}/status")]
        public async Task<ActionResult> UpdateUserStatus(string userId, [FromBody] UpdateUserStatusDto dto)
        {
            try
            {
                var result = await _adminService.UpdateUserStatusAsync(userId, dto);
                if (!result)
                    return NotFound("User not found");

                return Ok(new { message = "User status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user status {userId}");
                return StatusCode(500, "Error updating user status");
            }
        }

        /// <summary>
        /// Block user
        /// </summary>
        [HttpPost("users/{userId}/block")]
        public async Task<ActionResult> BlockUser(string userId, [FromBody] BlockUserDto dto)
        {
            try
            {
                var result = await _adminService.BlockUserAsync(userId, dto);
                if (!result)
                    return NotFound("User not found");

                return Ok(new { message = "User blocked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error blocking user {userId}");
                return StatusCode(500, "Error blocking user");
            }
        }

        /// <summary>
        /// Unblock user
        /// </summary>
        [HttpPost("users/{userId}/unblock")]
        public async Task<ActionResult> UnblockUser(string userId)
        {
            try
            {
                var result = await _adminService.UnblockUserAsync(userId);
                if (!result)
                    return NotFound("User not found");

                return Ok(new { message = "User unblocked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error unblocking user {userId}");
                return StatusCode(500, "Error unblocking user");
            }
        }

        /// <summary>
        /// Delete user
        /// </summary>
        [HttpDelete("users/{userId}")]
        public async Task<ActionResult> DeleteUser(string userId)
        {
            try
            {
                var result = await _adminService.DeleteUserAsync(userId);
                if (!result)
                    return NotFound("User not found");

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user {userId}");
                return StatusCode(500, "Error deleting user");
            }
        }

        #endregion

        #region  Services Management
        /// <summary>
        /// Get services pending approval
        /// </summary>
        [HttpGet("services/pending")]
        public async Task<IActionResult> GetPendingServices()
        {
            try
            {
                var result = await _servicesService.GetPendingServicesForAdminAsync();
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending services");
                return StatusCode(500, "Error retrieving pending services");
            }
        }

        /// <summary>
        /// Approve a service
        /// </summary>
        [HttpPost("services/{id}/approve")]
        public async Task<IActionResult> ApproveService(int id)
        {
            try
            {
                var result = await _servicesService.UpdateServiceStatusAsync(id, true, null);

                if (!result)
                    return NotFound(new { success = false, message = "Service not found" });

                return Ok(new { success = true, message = "Service approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving service {id}");
                return StatusCode(500, "Error approving service");
            }
        }

        /// <summary>
        /// Reject a service
        /// </summary>
        [HttpPost("services/{id}/reject")]
        public async Task<IActionResult> RejectService(int id, [FromBody] RejectServiceDto dto)
        {
            try
            {
                var result = await _servicesService.UpdateServiceStatusAsync(id, false, dto.Reason);

                if (!result)
                    return NotFound(new { success = false, message = "Service not found" });

                return Ok(new { success = true, message = "Service rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting service {id}");
                return StatusCode(500, "Error rejecting service");
            }
        }

        #endregion
        

        #region Property Management

        /// <summary>
        /// Get all properties with optional filters
        /// </summary>
        [HttpGet("properties")]
        public async Task<ActionResult<List<AdminPropertyDto>>> GetAllProperties(
            [FromQuery] string? status = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var properties = await _adminService.GetAllPropertiesAsync(status, searchTerm, pageNumber, pageSize);
                return Ok(properties);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting properties");
                return StatusCode(500, "Error retrieving properties");
            }
        }

        /// <summary>
        /// Get property by ID
        /// </summary>
        [HttpGet("properties/{propertyId}")]
        public async Task<ActionResult<AdminPropertyDto>> GetPropertyById(int propertyId)
        {
            try
            {
                var property = await _adminService.GetPropertyByIdAsync(propertyId);
                if (property == null)
                    return NotFound("Property not found");

                return Ok(property);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting property {propertyId}");
                return StatusCode(500, "Error retrieving property");
            }
        }

        /// <summary>
        /// Approve property
        /// </summary>
        [HttpPost("properties/{propertyId}/approve")]
        public async Task<ActionResult> ApproveProperty(
            int propertyId,
            [FromBody] ApprovePropertyDto dto)
        {
            try
            {
                var adminId = User.FindFirst("userId")?.Value;
                var result = await _adminService.ApprovePropertyAsync(propertyId, adminId, dto);

                if (!result)
                    return NotFound("Property not found");

                return Ok(new { message = "Property approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving property {propertyId}");
                return StatusCode(500, "Error approving property");
            }
        }

        /// <summary>
        /// Reject property
        /// </summary>
        [HttpPost("properties/{propertyId}/reject")]
        public async Task<ActionResult> RejectProperty(
            int propertyId,
            [FromBody] RejectPropertyDto dto)
        {
            try
            {
                var adminId = User.FindFirst("userId")?.Value;
                var result = await _adminService.RejectPropertyAsync(propertyId, adminId, dto);

                if (!result)
                    return NotFound("Property not found");

                return Ok(new { message = "Property rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting property {propertyId}");
                return StatusCode(500, "Error rejecting property");
            }
        }

        /// <summary>
        /// Update property status
        /// </summary>
        [HttpPut("properties/{propertyId}/status")]
        public async Task<ActionResult> UpdatePropertyStatus(
            int propertyId,
            [FromBody] UpdatePropertyStatusDto dto)
        {
            try
            {
                var result = await _adminService.UpdatePropertyStatusAsync(propertyId, dto);
                if (!result)
                    return NotFound("Property not found");

                return Ok(new { message = "Property status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating property status {propertyId}");
                return StatusCode(500, "Error updating property status");
            }
        }

        /// <summary>
        /// Delete property
        /// </summary>
        [HttpDelete("properties/{propertyId}")]
        public async Task<ActionResult> DeleteProperty(int propertyId)
        {
            try
            {
                var result = await _adminService.DeletePropertyAsync(propertyId);
                if (!result)
                    return NotFound("Property not found");

                return Ok(new { message = "Property deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting property {propertyId}");
                return StatusCode(500, "Error deleting property");
            }
        }

        #endregion

        #region Experiences Management

        /// <summary>
        /// Get all experiences with filters (Matches Properties Logic)
        /// </summary>
        [HttpGet("experiences")]
        public async Task<ActionResult<List<ExperienceDto>>> GetAllExperiences(
            [FromQuery] string? status = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // ✅ التعديل هنا: استدعاء دالة تقبل الفلاتر مثل Properties
                var experiences = await _experienceService.GetAllExperiencesAsync(status, searchTerm, pageNumber, pageSize);
                return Ok(experiences);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting experiences");
                return StatusCode(500, "Error retrieving experiences");
            }
        }

        [HttpPut("experiences/{id}/status")]
        public async Task<IActionResult> UpdateExperienceStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                if (dto.Status == "PendingApproval")
                {
                    // الآن الدالة دي هتكون موجودة في السيرفس
                    var result = await _experienceService.UpdateStatusAsync(id, ExperienceStatus.PendingApproval);
                    if (result) return Ok(new { message = "Status updated successfully" });
                }

                return BadRequest(new { message = "Invalid status transition" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating experience status {id}");
                return StatusCode(500, "Error updating status");
            }
        }

        [HttpPost("experiences/{id}/approve")]
        public async Task<IActionResult> ApproveExperience(int id)
        {
            try
            {
                var result = await _experienceService.ApproveExperienceAsync(id);

                if (!result)
                    return NotFound(new { success = false, message = "Experience not found" });

                return Ok(new { success = true, message = "Experience approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving experience {id}");
                return StatusCode(500, "Error approving experience");
            }
        }

        [HttpPost("experiences/{id}/reject")]
        public async Task<IActionResult> RejectExperience(int id, [FromBody] RejectExperienceDto dto)
        {
            try
            {
                // ✅ التعديل: إضافة دالة الرفض
                var result = await _experienceService.RejectExperienceAsync(id, dto.RejectionReason);

                if (!result)
                    return NotFound(new { success = false, message = "Experience not found" });

                return Ok(new { success = true, message = "Experience rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting experience {id}");
                return StatusCode(500, "Error rejecting experience");
            }
        }

        #endregion

        #region Bookings Management

        /// <summary>
        /// Get all bookings with optional filters
        /// </summary>
        [HttpGet("bookings")]
        public async Task<ActionResult<List<BookingResponseDto>>> GetAllBookings(
            [FromQuery] string? status = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var bookings = await _adminService.GetAllBookingsAsync(status, startDate, endDate, pageNumber, pageSize);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bookings");
                return StatusCode(500, "Error retrieving bookings");
            }
        }

        /// <summary>
        /// Cancel booking
        /// </summary>
        [HttpPost("bookings/{bookingId}/cancel")]
        public async Task<ActionResult> CancelBooking(int bookingId, [FromBody] CancelBookingDto dto)
        {
            try
            {
                var result = await _adminService.CancelBookingAsync(bookingId, dto.Reason);
                if (!result)
                    return NotFound("Booking not found");

                return Ok(new { message = "Booking cancelled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling booking {bookingId}");
                return StatusCode(500, "Error cancelling booking");
            }
        }

        /// <summary>
        /// Refund booking
        /// </summary>
        [HttpPost("bookings/{bookingId}/refund")]
        public async Task<ActionResult> RefundBooking(int bookingId, [FromBody] RefundBookingDto dto)
        {
            try
            {
                var result = await _adminService.RefundBookingAsync(bookingId, dto.RefundAmount, dto.Reason);
                if (!result)
                    return NotFound("Booking not found");

                return Ok(new { message = "Booking refunded successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error refunding booking {bookingId}");
                return StatusCode(500, "Error refunding booking");
            }
        }

        #endregion

        #region Reviews Management

        /// <summary>
        /// Get all reviews
        /// </summary>
        [HttpGet("reviews")]
        public async Task<ActionResult<List<ReviewResponseDto>>> GetAllReviews(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var reviews = await _adminService.GetAllReviewsAsync(pageNumber, pageSize);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reviews");
                return StatusCode(500, "Error retrieving reviews");
            }
        }

        /// <summary>
        /// Get flagged reviews
        /// </summary>
        [HttpGet("reviews/flagged")]
        public async Task<ActionResult<List<ReviewResponseDto>>> GetFlaggedReviews()
        {
            try
            {
                var reviews = await _adminService.GetFlaggedReviewsAsync();
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting flagged reviews");
                return StatusCode(500, "Error retrieving flagged reviews");
            }
        }

        /// <summary>
        /// Delete review
        /// </summary>
        [HttpDelete("reviews/{reviewId}")]
        public async Task<ActionResult> DeleteReview(int reviewId, [FromQuery] string reason)
        {
            try
            {
                var result = await _adminService.DeleteReviewAsync(reviewId, reason);
                if (!result)
                    return NotFound("Review not found");

                return Ok(new { message = "Review deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting review {reviewId}");
                return StatusCode(500, "Error deleting review");
            }
        }

        #endregion

        #region Settings & Profile

        [HttpGet("settings")]
        public async Task<ActionResult<PlatformSettingsDto>> GetSettings()
        {
            var settings = await _adminService.GetPlatformSettingsAsync();
            return Ok(settings);
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] PlatformSettingsDto dto)
        {
            var result = await _adminService.UpdatePlatformSettingsAsync(dto);
            if (!result) return StatusCode(500, "Failed to save settings");
            return Ok(new { message = "Settings saved successfully" });
        }

        [HttpGet("profile")]
        public async Task<ActionResult<AdminUserDto>> GetProfile()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var profile = await _adminService.GetAdminProfileAsync(userId);
            return Ok(profile);
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateAdminProfileDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var result = await _adminService.UpdateAdminProfileAsync(userId, dto);

            if (!result) return BadRequest("Failed to update profile");
            return Ok(new { message = "Profile updated successfully" });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var result = await _adminService.ChangeAdminPasswordAsync(userId, dto);

            if (!result) return BadRequest(new { message = "Failed to change password. Check current password." });
            return Ok(new { message = "Password changed successfully" });
        }

        #endregion



        // داخل AdminController region Services Management
        //last one

        [HttpGet("services")]
        public async Task<ActionResult<List<AdminServiceDto>>> GetAllServices(
            [FromQuery] string? status = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var services = await _adminService.GetAllServicesAsync(status, searchTerm, pageNumber, pageSize);
                return Ok(services);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting services");
                return StatusCode(500, "Error retrieving services");
            }
        }

        [HttpPut("services/{id}/status")]
        public async Task<IActionResult> UpdateServiceStatusGeneric(int id, [FromBody] UpdateStatusDto dto)
        {
            try
            {
                var result = await _adminService.UpdateServiceStatusAsync(id, dto);
                if (!result) return NotFound(new { message = "Service not found" });
                return Ok(new { message = "Service status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating service status {id}");
                return StatusCode(500, "Error updating service status");
            }
        }

        [HttpDelete("services/{id}")]
        public async Task<IActionResult> DeleteService(int id)
        {
            try
            {
                var result = await _adminService.DeleteServiceAsync(id);
                if (!result) return NotFound(new { message = "Service not found" });
                return Ok(new { message = "Service deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting service {id}");
                return StatusCode(500, "Error deleting service");
            }
        }
    }


    // DTOs for missing actions
    public class RejectExperienceDto
    {
        [Required]
        public string RejectionReason { get; set; }
    }
    public class CancelBookingDto
    {
        [Required]
        public string Reason { get; set; }
    }

    public class RefundBookingDto
    {
        [Required]
        public decimal RefundAmount { get; set; }

        [Required]
        public string Reason { get; set; }
    }
    public class UpdateStatusDto
    {
        public string Status { get; set; }
    }

    // ✅ Helper DTO for Rejection (Add inside namespace or DTOs folder)
    public class RejectServiceDto
    {
        public string Reason { get; set; }
    }
}
using Airbnb.API.DTOs.Admin;
using Airbnb.API.DTOs.Booking;
using Airbnb.API.DTOs.Review;
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

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
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

        #region Verification Management

        /// <summary>
        /// Get pending verifications
        /// </summary>
        [HttpGet("verifications/pending")]
        public async Task<ActionResult<List<VerificationRequestDto>>> GetPendingVerifications()
        {
            try
            {
                var verifications = await _adminService.GetPendingVerificationsAsync();
                return Ok(verifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending verifications");
                return StatusCode(500, "Error retrieving verifications");
            }
        }

        /// <summary>
        /// Get all verifications with optional status filter
        /// </summary>
        [HttpGet("verifications")]
        public async Task<ActionResult<List<VerificationRequestDto>>> GetAllVerifications(
            [FromQuery] string? status = null)
        {
            try
            {
                var verifications = await _adminService.GetAllVerificationsAsync(status);
                return Ok(verifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting verifications");
                return StatusCode(500, "Error retrieving verifications");
            }
        }

        /// <summary>
        /// Get verification by ID
        /// </summary>
        [HttpGet("verifications/{verificationId}")]
        public async Task<ActionResult<VerificationRequestDto>> GetVerificationById(int verificationId)
        {
            try
            {
                var verification = await _adminService.GetVerificationByIdAsync(verificationId);
                if (verification == null)
                    return NotFound("Verification not found");

                return Ok(verification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting verification {verificationId}");
                return StatusCode(500, "Error retrieving verification");
            }
        }

        /// <summary>
        /// Approve verification
        /// </summary>
        [HttpPost("verifications/{verificationId}/approve")]
        public async Task<ActionResult> ApproveVerification(
            int verificationId,
            [FromBody] ApproveVerificationDto dto)
        {
            try
            {
                var adminId = User.FindFirst("userId")?.Value;
                var result = await _adminService.ApproveVerificationAsync(verificationId, adminId, dto);

                if (!result)
                    return NotFound("Verification not found");

                return Ok(new { message = "Verification approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error approving verification {verificationId}");
                return StatusCode(500, "Error approving verification");
            }
        }

        /// <summary>
        /// Reject verification
        /// </summary>
        [HttpPost("verifications/{verificationId}/reject")]
        public async Task<ActionResult> RejectVerification(
            int verificationId,
            [FromBody] RejectVerificationDto dto)
        {
            try
            {
                var adminId = User.FindFirst("userId")?.Value;
                var result = await _adminService.RejectVerificationAsync(verificationId, adminId, dto);

                if (!result)
                    return NotFound("Verification not found");

                return Ok(new { message = "Verification rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error rejecting verification {verificationId}");
                return StatusCode(500, "Error rejecting verification");
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
    }

    // DTOs for missing actions
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
}

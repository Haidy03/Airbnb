//using Airbnb.API.DTOs.Admin;
//using Airbnb.API.DTOs.Booking;
//using Airbnb.API.DTOs.Review;

//namespace Airbnb.API.Services.Interfaces
//{
//    public interface IAdminService
//    {
//        // Dashboard & Analytics
//        Task<DashboardStatsDto> GetDashboardStatsAsync();
//        Task<RevenueReportDto> GetRevenueReportAsync(DateTime startDate, DateTime endDate);
//        Task<UserActivityReportDto> GetUserActivityReportAsync(DateTime startDate, DateTime endDate);
//        Task<OccupancyReportDto> GetOccupancyReportAsync();

//        // User Management
//        Task<List<AdminUserDto>> GetAllUsersAsync(string? role = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10);
//        Task<AdminUserDto> GetUserByIdAsync(string userId);
//        Task<bool> UpdateUserStatusAsync(string userId, UpdateUserStatusDto dto);
//        Task<bool> BlockUserAsync(string userId, BlockUserDto dto);
//        Task<bool> UnblockUserAsync(string userId);
//        Task<bool> DeleteUserAsync(string userId);

//        // Verification Management
//        Task<List<VerificationRequestDto>> GetPendingVerificationsAsync();
//        Task<List<VerificationRequestDto>> GetAllVerificationsAsync(string? status = null);
//        Task<VerificationRequestDto> GetVerificationByIdAsync(int verificationId);
//        Task<bool> ApproveVerificationAsync(int verificationId, string adminId, ApproveVerificationDto dto);
//        Task<bool> RejectVerificationAsync(int verificationId, string adminId, RejectVerificationDto dto);

//        // Property Management
//        Task<List<AdminPropertyDto>> GetAllPropertiesAsync(string? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10);
//        Task<AdminPropertyDto> GetPropertyByIdAsync(int propertyId);
//        Task<bool> ApprovePropertyAsync(int propertyId, string adminId, ApprovePropertyDto dto);
//        Task<bool> RejectPropertyAsync(int propertyId, string adminId, RejectPropertyDto dto);
//        Task<bool> UpdatePropertyStatusAsync(int propertyId, UpdatePropertyStatusDto dto);
//        Task<bool> DeletePropertyAsync(int propertyId);

//        // Bookings Management
//        Task<List<BookingResponseDto>> GetAllBookingsAsync(string? status = null, DateTime? startDate = null, DateTime? endDate = null, int pageNumber = 1, int pageSize = 10);
//        Task<bool> CancelBookingAsync(int bookingId, string reason);
//        Task<bool> RefundBookingAsync(int bookingId, decimal refundAmount, string reason);

//        // Reviews Management
//        Task<List<ReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 10);
//        Task<bool> DeleteReviewAsync(int reviewId, string reason);
//        Task<List<ReviewResponseDto>> GetFlaggedReviewsAsync();
//    }
//}


using Airbnb.API.DTOs.Admin;
using Airbnb.API.DTOs.Booking;
using Airbnb.API.DTOs.Review;

namespace Airbnb.API.Services.Interfaces
{
    public interface IAdminService
    {
        // Dashboard & Analytics
        Task<DashboardStatsDto> GetDashboardStatsAsync();
        Task<RevenueReportDto> GetRevenueReportAsync(DateTime startDate, DateTime endDate);
        Task<UserActivityReportDto> GetUserActivityReportAsync(DateTime startDate, DateTime endDate);
        Task<OccupancyReportDto> GetOccupancyReportAsync();

        // User Management
        Task<List<AdminUserDto>> GetAllUsersAsync(string? role = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10);
        Task<AdminUserDto> GetUserByIdAsync(string userId);
        Task<bool> UpdateUserStatusAsync(string userId, UpdateUserStatusDto dto);
        Task<bool> BlockUserAsync(string userId, BlockUserDto dto);
        Task<bool> UnblockUserAsync(string userId);
        Task<bool> DeleteUserAsync(string userId);

        // Verification Management
        Task<List<VerificationRequestDto>> GetPendingVerificationsAsync();
        Task<List<VerificationRequestDto>> GetAllVerificationsAsync(string? status = null);
        Task<VerificationRequestDto> GetVerificationByIdAsync(int verificationId);
        Task<bool> ApproveVerificationAsync(int verificationId, string adminId, ApproveVerificationDto dto);
        Task<bool> RejectVerificationAsync(int verificationId, string adminId, RejectVerificationDto dto);

        // Property Management
        Task<List<AdminPropertyDto>> GetAllPropertiesAsync(string? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10);
        Task<AdminPropertyDto> GetPropertyByIdAsync(int propertyId);
        Task<bool> ApprovePropertyAsync(int propertyId, string adminId, ApprovePropertyDto dto);
        Task<bool> RejectPropertyAsync(int propertyId, string adminId, RejectPropertyDto dto);
        Task<bool> UpdatePropertyStatusAsync(int propertyId, UpdatePropertyStatusDto dto);
        Task<bool> DeletePropertyAsync(int propertyId);

        // Bookings Management (Unified)
        Task<List<BookingResponseDto>> GetAllBookingsAsync(string? status = null, DateTime? startDate = null, DateTime? endDate = null, int pageNumber = 1, int pageSize = 10);
        Task<bool> CancelBookingAsync(int bookingId, string reason);
        Task<bool> RefundBookingAsync(int bookingId, decimal refundAmount, string reason);

        // Reviews Management (Unified)
        Task<List<ReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 10);
        Task<bool> DeleteReviewAsync(int reviewId, string reason);
        Task<List<ReviewResponseDto>> GetFlaggedReviewsAsync();

        Task<PlatformSettingsDto> GetPlatformSettingsAsync();
        Task<bool> UpdatePlatformSettingsAsync(PlatformSettingsDto settings);

        Task<AdminUserDto> GetAdminProfileAsync(string adminId);
        Task<bool> UpdateAdminProfileAsync(string adminId, UpdateAdminProfileDto dto);
        Task<bool> ChangeAdminPasswordAsync(string adminId, ChangePasswordDto dto);
    }
}

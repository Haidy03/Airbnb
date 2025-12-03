using Airbnb.API.Controllers;
using Airbnb.API.DTOs.Admin;
using Airbnb.API.DTOs.Booking;
using Airbnb.API.DTOs.Review;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Airbnb.API.Services.Implementations
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepository _adminRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AdminService> _logger;

        public AdminService(
            IAdminRepository adminRepository,
            UserManager<ApplicationUser> userManager,
            ILogger<AdminService> logger)
        {
            _adminRepository = adminRepository;
            _userManager = userManager;
            _logger = logger;
        }

        #region Dashboard & Analytics

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var startOfMonth = new DateTime(now.Year, now.Month, 1);

                var totalRevenue = await _adminRepository.GetTotalCombinedRevenueAsync();

                var platformFees = totalRevenue * 0.15m;

                var stats = new DashboardStatsDto
                {
                    TotalUsers = await _adminRepository.GetTotalUsersCountAsync(),
                    TotalHosts = await _adminRepository.GetUsersCountByRoleAsync("Host"),
                    TotalGuests = await _adminRepository.GetUsersCountByRoleAsync("Guest"),
                    ActiveUsers = await _adminRepository.GetActiveUsersCountAsync(),
                    BlockedUsers = await _adminRepository.GetBlockedUsersCountAsync(),
                    PendingVerifications = (await _adminRepository.GetAllVerificationsAsync(VerificationStatus.Pending))?.Count ?? 0,

                    TotalProperties = await _adminRepository.GetTotalPropertiesCountAsync(),
                    ActiveProperties = await _adminRepository.GetPropertiesCountByStatusAsync(PropertyStatus.Active),
                    PendingProperties = await _adminRepository.GetPropertiesCountByStatusAsync(PropertyStatus.PendingApproval),


                    TotalServices = await _adminRepository.GetTotalServicesCountAsync(),
                    ActiveServices = await _adminRepository.GetServicesCountByStatusAsync(ServiceStatus.Active),
                    PendingServices = await _adminRepository.GetServicesCountByStatusAsync(ServiceStatus.PendingApproval),
                    TotalBookings = await _adminRepository.GetTotalCombinedBookingsCountAsync(),
                    ActiveBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Confirmed),
                    CompletedBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Completed),
                    CancelledBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Cancelled),

                    TotalRevenue = totalRevenue,
                    MonthlyRevenue = await _adminRepository.GetCombinedRevenueByDateRangeAsync(startOfMonth, now),
                    PlatformFees = platformFees, 

                    TotalReviews = await _adminRepository.GetTotalReviewsCountAsync(),
                    AverageRating = await _adminRepository.GetAverageRatingAsync(),

                    RevenueByMonth = await GetMonthlyRevenueAsync() ?? new List<MonthlyRevenueDto>(),
                    PropertyTypeStats = await GetPropertyTypeStatsAsync() ?? new List<PropertyTypeStatsDto>(),
                    BookingStatusStats = await GetBookingStatusStatsAsync() ?? new List<BookingStatusStatsDto>()
                };

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                throw;
            }
        }

        private async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync()
        {
            var result = new List<MonthlyRevenueDto>();
            var startDate = new DateTime(2025, 11, 1);

            for (int i = 0; i < 4; i++)
            {
                var currentMonthDate = startDate.AddMonths(i);
                var monthStart = new DateTime(currentMonthDate.Year, currentMonthDate.Month, 1);
                var monthEnd = monthStart.AddMonths(1).AddDays(-1);

                var allBookings = await _adminRepository.GetUnifiedBookingsAsync(null, monthStart, monthEnd, 1, 100000);

                var validBookings = allBookings
                    .Where(b => b.Status == "Completed" || b.Status == "Confirmed")
                    .ToList();

                var revenue = validBookings.Sum(b => b.TotalPrice);
                var count = validBookings.Count;
                result.Add(new MonthlyRevenueDto
                {
                    Month = currentMonthDate.ToString("MM"),
                    Revenue = revenue,
                    BookingsCount = count
                });
            }
            return result;
        }

        private async Task<List<PropertyTypeStatsDto>> GetPropertyTypeStatsAsync()
        {
            var properties = await _adminRepository.GetAllPropertiesAsync(null, null, 1, 10000);
            if (properties == null || !properties.Any()) return new List<PropertyTypeStatsDto>();

            return properties
                .Where(p => p.PropertyType != null && !string.IsNullOrEmpty(p.PropertyType.Name))
                .GroupBy(p => p.PropertyType.Name)
                .Select(g => new PropertyTypeStatsDto
                {
                    PropertyType = g.Key,
                    Count = g.Count(),
                    TotalRevenue = g.SelectMany(p => p.Bookings ?? Enumerable.Empty<Booking>())
                        .Where(b => b.Status == BookingStatus.Completed || b.Status == BookingStatus.Confirmed)
                        .Sum(b => b.TotalPrice)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .ToList();
        }

        private async Task<List<BookingStatusStatsDto>> GetBookingStatusStatsAsync()
        {
            try
            {
                return new List<BookingStatusStatsDto>
                {
                    new BookingStatusStatsDto { Status = "Completed", Count = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Completed) },
                    new BookingStatusStatsDto { Status = "Confirmed", Count = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Confirmed) },
                    new BookingStatusStatsDto { Status = "Pending", Count = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Pending) },
                    new BookingStatusStatsDto { Status = "Cancelled", Count = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Cancelled) }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting booking stats");
                return new List<BookingStatusStatsDto>();
            }
        }

        public async Task<RevenueReportDto> GetRevenueReportAsync(DateTime startDate, DateTime endDate)
        {
            var bookings = await _adminRepository.GetUnifiedBookingsAsync(null, startDate, endDate, 1, 100000);

            var revenueBookings = bookings
                .Where(b => b.Status == "Completed" || b.Status == "Confirmed")
                .ToList();



            var totalRevenue = bookings.Sum(b => b.TotalPrice);
            var platformFees = totalRevenue * 0.15m;
            var hostPayouts = totalRevenue - platformFees;

            var revenueByLocation = bookings
                .GroupBy(b => b.Location ?? "Unknown")
                .Select(g => new RevenueByLocationDto
                {
                    Location = g.Key,
                    Revenue = g.Sum(b => b.TotalPrice),
                    BookingsCount = g.Count()
                })
                .OrderByDescending(r => r.Revenue)
                .ToList();

            return new RevenueReportDto
            {
                Period = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                TotalRevenue = totalRevenue,
                PlatformFees = platformFees,
                HostPayouts = hostPayouts,
                TotalBookings = revenueBookings.Count,
                AverageBookingValue = revenueBookings.Any() ? totalRevenue / revenueBookings.Count : 0,
                RevenueByLocation = revenueByLocation
            };
        }

        public async Task<UserActivityReportDto> GetUserActivityReportAsync(DateTime startDate, DateTime endDate)
        {
            var allUsers = await _adminRepository.GetAllUsersAsync(null, null, 1, 10000);
            var users = allUsers.Where(u => u.CreatedAt >= startDate && u.CreatedAt <= endDate).ToList();

            var bookings = await _adminRepository.GetUnifiedBookingsAsync(null, startDate, endDate, 1, 10000);

            var dailyActivity = users
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new DailyActivityDto
                {
                    Date = g.Key,
                    NewUsers = g.Count(),
                    ActiveUsers = g.Count(u => u.IsActive),
                    Bookings = bookings.Count(b => b.CreatedAt.Date == g.Key)
                })
                .OrderBy(d => d.Date)
                .ToList();

            return new UserActivityReportDto
            {
                NewUsers = users.Count,
                ActiveUsers = users.Count(u => u.IsActive),
                NewHosts = await GetNewUsersCountByRoleAsync(users, "Host"),
                NewGuests = await GetNewUsersCountByRoleAsync(users, "Guest"),
                DailyActivity = dailyActivity
            };
        }

        private async Task<int> GetNewUsersCountByRoleAsync(List<ApplicationUser> users, string roleName)
        {
            int count = 0;
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (roles.Contains(roleName)) count++;
            }
            return count;
        }

        public async Task<OccupancyReportDto> GetOccupancyReportAsync()
        {
            var properties = await _adminRepository.GetAllPropertiesAsync(PropertyStatus.Active, null, 1, 10000);
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var propertyOccupancy = new List<PropertyOccupancyDto>();

            foreach (var property in properties)
            {
                var recentBookings = property.Bookings
                    .Where(b => b.CheckInDate >= thirtyDaysAgo && b.Status != BookingStatus.Cancelled)
                    .ToList();

                var totalBookedDays = recentBookings.Sum(b => (b.CheckOutDate - b.CheckInDate).Days);
                var occupancyRate = (totalBookedDays / 30.0) * 100;

                propertyOccupancy.Add(new PropertyOccupancyDto
                {
                    PropertyId = property.Id,
                    PropertyTitle = property.Title,
                    OccupancyRate = Math.Round(occupancyRate, 2),
                    TotalBookings = recentBookings.Count,
                    Revenue = recentBookings.Sum(b => b.TotalPrice)
                });
            }

            return new OccupancyReportDto
            {
                OverallOccupancyRate = propertyOccupancy.Any() ? Math.Round(propertyOccupancy.Average(p => p.OccupancyRate), 2) : 0,
                TopProperties = propertyOccupancy.OrderByDescending(p => p.OccupancyRate).Take(10).ToList(),
                LowPerformingProperties = propertyOccupancy.OrderBy(p => p.OccupancyRate).Take(10).ToList()
            };
        }

        #endregion

        #region Bookings Management

        public async Task<List<BookingResponseDto>> GetAllBookingsAsync(string? status = null, DateTime? startDate = null, DateTime? endDate = null, int pageNumber = 1, int pageSize = 10)
        {
            return await _adminRepository.GetUnifiedBookingsAsync(status, startDate, endDate, pageNumber, pageSize);
        }

        public async Task<bool> CancelBookingAsync(int bookingId, string reason)
        {
            var booking = await _adminRepository.GetBookingByIdAsync(bookingId);
            if (booking == null) return false;

            booking.Status = BookingStatus.Cancelled;
            await _adminRepository.UpdateBookingAsync(booking);
            _logger.LogInformation($"Booking {bookingId} cancelled by admin: {reason}");
            return true;
        }

        public async Task<bool> RefundBookingAsync(int bookingId, decimal refundAmount, string reason)
        {
            var booking = await _adminRepository.GetBookingByIdAsync(bookingId);
            if (booking == null) return false;

            booking.Status = BookingStatus.Cancelled;
            await _adminRepository.UpdateBookingAsync(booking);
            _logger.LogInformation($"Booking {bookingId} refunded {refundAmount}: {reason}");
            return true;
        }

        #endregion

        #region Reviews Management

        public async Task<List<ReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 10)
        {
            var propReviews = await _adminRepository.GetAllReviewsAsync();
            var propDtos = propReviews.Select(r => new ReviewResponseDto
            {
                Id = r.Id,
                PropertyId = r.PropertyId,
                PropertyTitle = r.Property?.Title ?? "Unknown Property",
                ReviewType = "Property",
                ReviewerId = r.ReviewerId,
                ReviewerName = $"{r.Reviewer.FirstName} {r.Reviewer.LastName}",
                ReviewerProfileImage = r.Reviewer.ProfileImageUrl,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            });

            var expReviews = await _adminRepository.GetAllExperienceReviewsAsync();
            var expDtos = expReviews.Select(r => new ReviewResponseDto
            {
                Id = r.Id,
                PropertyTitle = r.Experience?.Title ?? "Unknown Experience",
                ReviewType = "Experience",
                ReviewerId = r.ReviewerId,
                ReviewerName = $"{r.Reviewer.FirstName} {r.Reviewer.LastName}",
                ReviewerProfileImage = r.Reviewer.ProfileImageUrl,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            });

            var svcReviews = await _adminRepository.GetAllServiceReviewsAsync();
            var svcDtos = svcReviews.Select(r => new ReviewResponseDto
            {
                Id = r.Id,
                ReviewType = "Service", 
                PropertyTitle = r.Service?.Title ?? "Unknown Service",
                ReviewerName = $"{r.Reviewer.FirstName} {r.Reviewer.LastName}",
                ReviewerProfileImage = r.Reviewer.ProfileImageUrl,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            });

            var allReviews = propDtos.Concat(expDtos).Concat(svcDtos)
                                     .OrderByDescending(r => r.CreatedAt)
                                     .Skip((pageNumber - 1) * pageSize)
                                     .Take(pageSize)
                                     .ToList();

            return allReviews;
        }

        public async Task<bool> DeleteReviewAsync(int reviewId, string reason)
        {
            var review = await _adminRepository.GetReviewByIdAsync(reviewId);
            if (review != null)
            {
                await _adminRepository.DeleteReviewAsync(review);
                _logger.LogInformation($"Property Review {reviewId} deleted: {reason}");
                return true;
            }

            var expDeleted = await _adminRepository.DeleteExperienceReviewAsync(reviewId);
            if (expDeleted)
            {
                _logger.LogInformation($"Experience Review {reviewId} deleted: {reason}");
                return true;
            }
            var svcDeleted = await _adminRepository.DeleteServiceReviewAsync(reviewId);
            if (svcDeleted)
            {
                _logger.LogInformation($"Service Review {reviewId} deleted: {reason}");
                return true;
            }

            return false;
        }

        public async Task<List<ReviewResponseDto>> GetFlaggedReviewsAsync()
        {
            var reviews = await _adminRepository.GetFlaggedReviewsAsync();
            return reviews.Select(r => new ReviewResponseDto
            {
                Id = r.Id,
                PropertyId = r.PropertyId,
                PropertyTitle = r.Property.Title,
                ReviewType = "Property",
                ReviewerId = r.ReviewerId,
                ReviewerName = r.Reviewer.FirstName + " " + r.Reviewer.LastName,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).ToList();
        }

        #endregion

        #region User Management (Standard)
        public async Task<List<AdminUserDto>> GetAllUsersAsync(string? role = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10)
        {
            var users = await _adminRepository.GetAllUsersAsync(role, searchTerm, pageNumber, pageSize);
            var userDtos = new List<AdminUserDto>();

            var bookingsDto = await _adminRepository.GetUnifiedBookingsAsync(null, null, null, 1, 100000);
            var properties = await _adminRepository.GetAllPropertiesAsync(null, null, 1, 10000);
            var propReviews = await _adminRepository.GetAllReviewsAsync();
            var expReviews = await _adminRepository.GetAllExperienceReviewsAsync();
            var experiences = await _adminRepository.GetAllExperiencesAsync();

            foreach (var user in users)
            {
                var userRole = await _adminRepository.GetUserRoleAsync(user.Id);
                var userBookings = bookingsDto.Where(b => b.GuestId == user.Id).ToList();
                var userExperiences = experiences.Where(e => e.HostId == user.Id).ToList();
                var userProperties = properties.Where(p => p.HostId == user.Id).ToList();
                var userPropReviewsCount = propReviews.Count(r => r.ReviewerId == user.Id || r.RevieweeId == user.Id);
                var userExpReviewsCount = expReviews.Count(r => r.ReviewerId == user.Id);

                var ratings = propReviews.Where(r => r.RevieweeId == user.Id).Select(r => (double)r.Rating).ToList();
                double? avgRating = ratings.Any() ? ratings.Average() : null;

                userDtos.Add(new AdminUserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    Role = userRole ?? "Guest",
                    IsActive = user.IsActive,
                    IsVerified = user.IsVerified,
                    IsBlocked = user.IsBlocked,
                    BlockReason = user.BlockReason,
                    CreatedAt = user.CreatedAt,
                    VerifiedAt = user.VerifiedAt,
                    TotalBookings = userBookings.Count,
                    TotalProperties = userProperties.Count,
                    TotalExperiences = userExperiences.Count,
                    TotalSpent = userBookings.Where(b => b.Status == "Completed").Sum(b => b.TotalPrice),
                    TotalEarned = userProperties.SelectMany(p => p.Bookings).Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
                    ReviewsCount = userPropReviewsCount + userExpReviewsCount,
                    AverageRating = avgRating
                });
            }
            return userDtos;
        }

        public async Task<AdminUserDto> GetUserByIdAsync(string userId)
        {
            var user = await _adminRepository.GetUserByIdAsync(userId);
            if (user == null) return null;
            var userRole = await _adminRepository.GetUserRoleAsync(user.Id);
            return new AdminUserDto { Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName, PhoneNumber = user.PhoneNumber, Role = userRole ?? "Guest", IsActive = user.IsActive, IsVerified = user.IsVerified, IsBlocked = user.IsBlocked, BlockReason = user.BlockReason, CreatedAt = user.CreatedAt, VerifiedAt = user.VerifiedAt };
        }

        public async Task<bool> UpdateUserStatusAsync(string userId, UpdateUserStatusDto dto) { var user = await _adminRepository.GetUserByIdAsync(userId); if (user == null) return false; user.IsActive = dto.IsActive; return await _adminRepository.UpdateUserAsync(user); }
        public async Task<bool> BlockUserAsync(string userId, BlockUserDto dto) { var user = await _adminRepository.GetUserByIdAsync(userId); if (user == null) return false; user.IsBlocked = dto.IsBlocked; user.BlockReason = dto.Reason; user.BlockedAt = dto.IsBlocked ? DateTime.UtcNow : null; user.IsActive = !dto.IsBlocked; return await _adminRepository.UpdateUserAsync(user); }
        public async Task<bool> UnblockUserAsync(string userId) { var user = await _adminRepository.GetUserByIdAsync(userId); if (user == null) return false; user.IsBlocked = false; user.BlockReason = null; user.BlockedAt = null; user.IsActive = true; return await _adminRepository.UpdateUserAsync(user); }
        public async Task<bool> DeleteUserAsync(string userId) { var user = await _adminRepository.GetUserByIdAsync(userId); if (user == null) return false; return await _adminRepository.DeleteUserAsync(user); }

        #endregion

        #region Verification & Property Management (Standard)
        public async Task<List<VerificationRequestDto>> GetPendingVerificationsAsync() { var verifications = await _adminRepository.GetAllVerificationsAsync(VerificationStatus.Pending); return verifications.Select(MapVerificationToDto).ToList(); }
        public async Task<List<VerificationRequestDto>> GetAllVerificationsAsync(string? status = null) { VerificationStatus? vs = null; if (!string.IsNullOrEmpty(status) && Enum.TryParse(status, out VerificationStatus p)) vs = p; var v = await _adminRepository.GetAllVerificationsAsync(vs); return v.Select(MapVerificationToDto).ToList(); }
        public async Task<VerificationRequestDto> GetVerificationByIdAsync(int id) { var v = await _adminRepository.GetVerificationByIdAsync(id); return v != null ? MapVerificationToDto(v) : null; }
        public async Task<bool> ApproveVerificationAsync(int id, string adminId, ApproveVerificationDto dto) { var v = await _adminRepository.GetVerificationByIdAsync(id); if (v == null) return false; v.Status = VerificationStatus.Approved; v.AdminNotes = dto.AdminNotes; v.ReviewedAt = DateTime.UtcNow; v.ReviewedByAdminId = adminId; v.User.IsVerified = true; v.User.VerifiedAt = DateTime.UtcNow; await _adminRepository.UpdateVerificationAsync(v); await _adminRepository.UpdateUserAsync(v.User); return true; }
        public async Task<bool> RejectVerificationAsync(int id, string adminId, RejectVerificationDto dto) { var v = await _adminRepository.GetVerificationByIdAsync(id); if (v == null) return false; v.Status = VerificationStatus.Rejected; v.RejectionReason = dto.RejectionReason; v.AdminNotes = dto.AdminNotes; v.ReviewedAt = DateTime.UtcNow; v.ReviewedByAdminId = adminId; await _adminRepository.UpdateVerificationAsync(v); return true; }
        private VerificationRequestDto MapVerificationToDto(UserVerification v) => new VerificationRequestDto { Id = v.Id, UserId = v.UserId, UserName = v.User.FirstName + " " + v.User.LastName, UserEmail = v.User.Email, IdType = v.IdType, IdNumber = v.IdNumber, IdImageUrl = v.IdImageUrl, Status = v.Status.ToString(), SubmittedAt = v.SubmittedAt, AdminNotes = v.AdminNotes };

        public async Task<List<AdminPropertyDto>> GetAllPropertiesAsync(string? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10) { PropertyStatus? ps = null; if (!string.IsNullOrEmpty(status) && Enum.TryParse(status, out PropertyStatus p)) ps = p; var props = await _adminRepository.GetAllPropertiesAsync(ps, searchTerm, pageNumber, pageSize); return props.Select(MapPropertyToDto).ToList(); }
        public async Task<AdminPropertyDto> GetPropertyByIdAsync(int id) { var p = await _adminRepository.GetPropertyByIdAsync(id); return p != null ? MapPropertyToDto(p) : null; }
        public async Task<bool> ApprovePropertyAsync(int id, string adminId, ApprovePropertyDto dto) { var p = await _adminRepository.GetPropertyByIdAsync(id); if (p == null) return false; p.Status = PropertyStatus.Approved; p.ApprovedAt = DateTime.UtcNow; p.ApprovedByAdminId = adminId; p.IsApproved = true; p.IsActive = true; return await _adminRepository.UpdatePropertyAsync(p); }
        public async Task<bool> RejectPropertyAsync(int id, string adminId, RejectPropertyDto dto) { var p = await _adminRepository.GetPropertyByIdAsync(id); if (p == null) return false; p.Status = PropertyStatus.Rejected; p.IsApproved = false; p.RejectionReason = dto.RejectionReason; p.UpdatedAt = DateTime.UtcNow; return await _adminRepository.UpdatePropertyAsync(p); }
        public async Task<bool> UpdatePropertyStatusAsync(int id, UpdatePropertyStatusDto dto) { var p = await _adminRepository.GetPropertyByIdAsync(id); if (p == null) return false; if (Enum.TryParse<PropertyStatus>(dto.Status, out var s)) { p.Status = s; return await _adminRepository.UpdatePropertyAsync(p); } return false; }
        public async Task<bool> DeletePropertyAsync(int id) { var p = await _adminRepository.GetPropertyByIdAsync(id); if (p == null) return false; return await _adminRepository.DeletePropertyAsync(p); }

        private AdminPropertyDto MapPropertyToDto(Property p) => new AdminPropertyDto { Id = p.Id, Title = p.Title, HostId = p.HostId, HostName = p.Host.FirstName + " " + p.Host.LastName, Status = p.Status.ToString(), PricePerNight = p.PricePerNight, Location = p.City + ", " + p.Country, TotalBookings = p.Bookings.Count, TotalRevenue = p.Bookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice), AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double?)r.Rating) : null, ReviewsCount = p.Reviews.Count, CreatedAt = p.CreatedAt, ApprovedAt = p.ApprovedAt, RejectionReason = p.RejectionReason };
        #endregion

        #region Settings & Profile Implementation

        private readonly string _settingsFilePath = Path.Combine(Directory.GetCurrentDirectory(), "platform-settings.json");

        public async Task<PlatformSettingsDto> GetPlatformSettingsAsync()
        {
            if (!File.Exists(_settingsFilePath))
            {
                return new PlatformSettingsDto();
            }

            var json = await File.ReadAllTextAsync(_settingsFilePath);
            return System.Text.Json.JsonSerializer.Deserialize<PlatformSettingsDto>(json) ?? new PlatformSettingsDto();
        }

        public async Task<bool> UpdatePlatformSettingsAsync(PlatformSettingsDto settings)
        {
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(settings, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(_settingsFilePath, json);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving settings");
                return false;
            }
        }

        public async Task<AdminUserDto> GetAdminProfileAsync(string adminId)
        {
            return await GetUserByIdAsync(adminId); 
        }

        public async Task<bool> UpdateAdminProfileAsync(string adminId, UpdateAdminProfileDto dto)
        {
            var user = await _userManager.FindByIdAsync(adminId);
            if (user == null)
            {
                _logger.LogError($"Admin user not found with ID: {adminId}");
                return false;
            }

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.PhoneNumber;

            if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
            {
                var emailResult = await _userManager.SetEmailAsync(user, dto.Email);
                if (!emailResult.Succeeded)
                {
                    foreach (var error in emailResult.Errors) _logger.LogError($"Email Update Error: {error.Description}");
                    return false;
                }
                user.UserName = dto.Email;
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    _logger.LogError($"Update Profile Error: {error.Code} - {error.Description}");
                }
            }
            return result.Succeeded;
        }

        public async Task<bool> ChangeAdminPasswordAsync(string adminId, ChangePasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(adminId);
            if (user == null) return false;

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            return result.Succeeded;
        }

        #endregion


        public async Task<List<AdminServiceDto>> GetAllServicesAsync(string? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10)
        {
            ServiceStatus? serviceStatus = null;
            if (!string.IsNullOrEmpty(status) && Enum.TryParse(status, out ServiceStatus parsedStatus))
            {
                serviceStatus = parsedStatus;
            }

            var services = await _adminRepository.GetAllServicesAsync(serviceStatus, searchTerm, pageNumber, pageSize);
            var bookings = await _adminRepository.GetUnifiedBookingsAsync(null, null, null, 1, 100000);

            return services.Select(s => {
                var serviceBookings = bookings.Where(b => b.ItemTitle == s.Title && b.Type == "Service").ToList();

                return new AdminServiceDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    CategoryName = s.Category?.Name ?? "General",
                    PricePerUnit = s.PricePerUnit,
                    PricingUnit = s.PricingUnit.ToString(),
                    HostName = $"{s.Host.FirstName} {s.Host.LastName}",
                    Status = s.Status.ToString(),
                    ImageUrl = s.Images.FirstOrDefault(i => i.IsCover)?.Url ?? s.Images.FirstOrDefault()?.Url,
                    TotalBookings = serviceBookings.Count,
                    TotalRevenue = serviceBookings.Where(b => b.Status == "Completed").Sum(b => b.TotalPrice),
                    AverageRating = s.AverageRating,
                    ReviewsCount = s.ReviewCount,
                    CreatedAt = s.CreatedAt,
                    ApprovedAt = s.ApprovedAt,
                    RejectionReason = s.RejectionReason
                };
            }).ToList();
        }

        public async Task<bool> UpdateServiceStatusAsync(int serviceId, UpdateStatusDto dto)
        {
            var service = await _adminRepository.GetServiceByIdAsync(serviceId);
            if (service == null) return false;

            if (Enum.TryParse<ServiceStatus>(dto.Status, out var newStatus))
            {
                service.Status = newStatus;
                if (newStatus == ServiceStatus.Active) service.ApprovedAt = DateTime.UtcNow;
                return await _adminRepository.UpdateServiceAsync(service);
            }
            return false;
        }

        public async Task<bool> DeleteServiceAsync(int serviceId)
        {
            return await _adminRepository.DeleteServiceAsync(serviceId);
        }
    }
}
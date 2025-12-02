//// Services/Implementations/AdminService.cs (Complete Without Disputes)
//using Airbnb.API.DTOs.Admin;
//using Airbnb.API.DTOs.Booking;
//using Airbnb.API.DTOs.Review;
//using Airbnb.API.Models;
//using Airbnb.API.Repositories.Interfaces;
//using Airbnb.API.Services.Interfaces;
//using Microsoft.AspNetCore.Identity;

//namespace Airbnb.API.Services.Implementations
//{
//    public class AdminService : IAdminService
//    {
//        private readonly IAdminRepository _adminRepository;
//        private readonly UserManager<ApplicationUser> _userManager;
//        private readonly ILogger<AdminService> _logger;

//        public AdminService(
//            IAdminRepository adminRepository,
//            UserManager<ApplicationUser> userManager,
//            ILogger<AdminService> logger)
//        {
//            _adminRepository = adminRepository;
//            _userManager = userManager;
//            _logger = logger;
//        }

//        #region Dashboard & Analytics

//        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
//        {
//            try
//            {
//                var now = DateTime.UtcNow;
//                var startOfMonth = new DateTime(now.Year, now.Month, 1);

//                var stats = new DashboardStatsDto
//                {
//                    // Users Stats
//                    TotalUsers = await _adminRepository.GetTotalUsersCountAsync(),
//                    TotalHosts = await _adminRepository.GetUsersCountByRoleAsync("Host"),
//                    TotalGuests = await _adminRepository.GetUsersCountByRoleAsync("Guest"),
//                    ActiveUsers = await _adminRepository.GetActiveUsersCountAsync(),
//                    BlockedUsers = await _adminRepository.GetBlockedUsersCountAsync(),
//                    PendingVerifications = (await _adminRepository.GetAllVerificationsAsync(VerificationStatus.Pending))?.Count ?? 0,

//                    // Properties Stats
//                    TotalProperties = await _adminRepository.GetTotalPropertiesCountAsync(),
//                    ActiveProperties = await _adminRepository.GetPropertiesCountByStatusAsync(PropertyStatus.Active),
//                    PendingProperties = await _adminRepository.GetPropertiesCountByStatusAsync(PropertyStatus.PendingApproval),

//                    // Bookings Stats
//                    TotalBookings = await _adminRepository.GetTotalBookingsCountAsync(),
//                    ActiveBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Confirmed),
//                    CompletedBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Completed),
//                    CancelledBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Cancelled),

//                    // Revenue Stats
//                    TotalRevenue = await _adminRepository.GetTotalRevenueAsync(),
//                    MonthlyRevenue = await _adminRepository.GetRevenueByDateRangeAsync(startOfMonth, now),
//                    PlatformFees = await _adminRepository.GetTotalRevenueAsync() * 0.15m,

//                    // Reviews Stats
//                    TotalReviews = await _adminRepository.GetTotalReviewsCountAsync(),
//                    AverageRating = await _adminRepository.GetAverageRatingAsync(),

//                    // Charts Data - with null checks
//                    RevenueByMonth = await GetMonthlyRevenueAsync() ?? new List<MonthlyRevenueDto>(),
//                    PropertyTypeStats = await GetPropertyTypeStatsAsync() ?? new List<PropertyTypeStatsDto>(),
//                    BookingStatusStats = await GetBookingStatusStatsAsync() ?? new List<BookingStatusStatsDto>()
//                };

//                return stats;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting dashboard stats");
//                throw;
//            }
//        }
//        private async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync()
//        {
//            var result = new List<MonthlyRevenueDto>();
//            var now = DateTime.UtcNow;

//            // 1. نجهز لستة بآخر 6 شهور كتواريخ
//            for (int i = 5; i >= 0; i--)
//            {
//                var date = now.AddMonths(-i);
//                var monthStart = new DateTime(date.Year, date.Month, 1);
//                var monthEnd = monthStart.AddMonths(1).AddDays(-1);

//                // 2. نجيب الحجوزات للشهر ده
//                var bookings = await _adminRepository.GetAllBookingsAsync(
//                    BookingStatus.Completed,
//                    monthStart,
//                    monthEnd,
//                    1,
//                    10000); // رقم كبير عشان نجيب الكل

//                // 3. نحسب المجموع (حتى لو صفر) ونضيفه للقائمة
//                result.Add(new MonthlyRevenueDto
//                {
//                    Month = $"{date.Year}-{date.Month:00}", // صيغة YYYY-MM
//                    Revenue = bookings?.Sum(b => b.TotalPrice) ?? 0,
//                    BookingsCount = bookings?.Count ?? 0
//                });
//            }

//            return result;
//        }

//        private async Task<List<PropertyTypeStatsDto>> GetPropertyTypeStatsAsync()
//        {
//            var properties = await _adminRepository.GetAllPropertiesAsync(null, null, 1, 10000);

//            // Check if properties is null or empty
//            if (properties == null || !properties.Any())
//            {
//                return new List<PropertyTypeStatsDto>();
//            }

//            // Filter out properties with null PropertyType and group by PropertyType Name
//            return properties
//                .Where(p => p.PropertyType != null && p.PropertyType.Name != null)
//                .GroupBy(p => p.PropertyType.Name) // Use PropertyType.Name instead of PropertyType object
//                .Select(g => new PropertyTypeStatsDto
//                {
//                    PropertyType = g.Key, // This is now the PropertyType Name string
//                    Count = g.Count(),
//                    TotalRevenue = g.SelectMany(p => p.Bookings ?? Enumerable.Empty<Booking>())
//                        .Where(b => b.Status == BookingStatus.Completed)
//                        .Sum(b => b.TotalPrice)
//                })
//                .ToList();
//        }


//        private async Task<List<BookingStatusStatsDto>> GetBookingStatusStatsAsync()
//        {
//            try
//            {
//                var completed = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Completed);
//                var confirmed = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Confirmed);
//                var pending = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Pending);
//                var cancelled = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Cancelled);

//                return new List<BookingStatusStatsDto>
//        {
//            new BookingStatusStatsDto { Status = "Completed", Count = completed },
//            new BookingStatusStatsDto { Status = "Confirmed", Count = confirmed },
//            new BookingStatusStatsDto { Status = "Pending", Count = pending },
//            new BookingStatusStatsDto { Status = "Cancelled", Count = cancelled }
//        };
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting booking status stats");
//                return new List<BookingStatusStatsDto>();
//            }
//        }
//        public async Task<RevenueReportDto> GetRevenueReportAsync(DateTime startDate, DateTime endDate)
//        {
//            var bookings = await _adminRepository.GetAllBookingsAsync(BookingStatus.Completed, startDate, endDate, 1, 10000);

//            var totalRevenue = bookings.Sum(b => b.TotalPrice);
//            var platformFees = totalRevenue * 0.15m;
//            var hostPayouts = totalRevenue - platformFees;

//            var revenueByLocation = bookings
//                .GroupBy(b => b.Property.City)
//                .Select(g => new RevenueByLocationDto
//                {
//                    Location = g.Key,
//                    Revenue = g.Sum(b => b.TotalPrice),
//                    BookingsCount = g.Count()
//                })
//                .OrderByDescending(r => r.Revenue)
//                .ToList();

//            return new RevenueReportDto
//            {
//                Period = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
//                TotalRevenue = totalRevenue,
//                PlatformFees = platformFees,
//                HostPayouts = hostPayouts,
//                TotalBookings = bookings.Count,
//                AverageBookingValue = bookings.Any() ? totalRevenue / bookings.Count : 0,
//                RevenueByLocation = revenueByLocation
//            };
//        }

//        public async Task<UserActivityReportDto> GetUserActivityReportAsync(DateTime startDate, DateTime endDate)
//        {
//            var allUsers = await _adminRepository.GetAllUsersAsync(null, null, 1, 10000);
//            var users = allUsers.Where(u => u.CreatedAt >= startDate && u.CreatedAt <= endDate).ToList();

//            var bookings = await _adminRepository.GetAllBookingsAsync(null, startDate, endDate, 1, 10000);

//            var dailyActivity = users
//                .GroupBy(u => u.CreatedAt.Date)
//                .Select(g => new DailyActivityDto
//                {
//                    Date = g.Key,
//                    NewUsers = g.Count(),
//                    ActiveUsers = g.Count(u => u.IsActive),
//                    Bookings = bookings.Count(b => b.CreatedAt.Date == g.Key)
//                })
//                .OrderBy(d => d.Date)
//                .ToList();

//            return new UserActivityReportDto
//            {
//                NewUsers = users.Count,
//                ActiveUsers = users.Count(u => u.IsActive),
//                NewHosts = await GetNewUsersCountByRoleAsync(users, "Host"),
//                NewGuests = await GetNewUsersCountByRoleAsync(users, "Guest"),
//                DailyActivity = dailyActivity
//            };
//        }

//        private async Task<int> GetNewUsersCountByRoleAsync(List<ApplicationUser> users, string roleName)
//        {
//            int count = 0;
//            foreach (var user in users)
//            {
//                var roles = await _userManager.GetRolesAsync(user);
//                if (roles.Contains(roleName))
//                {
//                    count++;
//                }
//            }
//            return count;
//        }

//        public async Task<OccupancyReportDto> GetOccupancyReportAsync()
//        {
//            var properties = await _adminRepository.GetAllPropertiesAsync(PropertyStatus.Active, null, 1, 10000);
//            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

//            var propertyOccupancy = new List<PropertyOccupancyDto>();

//            foreach (var property in properties)
//            {
//                var recentBookings = property.Bookings
//                    .Where(b => b.CheckInDate >= thirtyDaysAgo && b.Status != BookingStatus.Cancelled)
//                    .ToList();

//                var totalBookedDays = recentBookings.Sum(b => (b.CheckOutDate - b.CheckInDate).Days);
//                var occupancyRate = (totalBookedDays / 30.0) * 100;

//                propertyOccupancy.Add(new PropertyOccupancyDto
//                {
//                    PropertyId = property.Id,
//                    PropertyTitle = property.Title,
//                    OccupancyRate = Math.Round(occupancyRate, 2),
//                    TotalBookings = recentBookings.Count,
//                    Revenue = recentBookings.Sum(b => b.TotalPrice)
//                });
//            }

//            return new OccupancyReportDto
//            {
//                OverallOccupancyRate = propertyOccupancy.Any()
//                    ? Math.Round(propertyOccupancy.Average(p => p.OccupancyRate), 2)
//                    : 0,
//                TopProperties = propertyOccupancy.OrderByDescending(p => p.OccupancyRate).Take(10).ToList(),
//                LowPerformingProperties = propertyOccupancy.OrderBy(p => p.OccupancyRate).Take(10).ToList()
//            };
//        }

//        #endregion

//        #region User Management

//        public async Task<List<AdminUserDto>> GetAllUsersAsync(string? role = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10)
//        {
//            var users = await _adminRepository.GetAllUsersAsync(role, searchTerm, pageNumber, pageSize);
//            var userDtos = new List<AdminUserDto>();

//            foreach (var user in users)
//            {
//                var userRole = await _adminRepository.GetUserRoleAsync(user.Id);
//                var bookings = await _adminRepository.GetAllBookingsAsync(null, null, null, 1, 10000);
//                var userBookings = bookings.Where(b => b.GuestId == user.Id).ToList();

//                var properties = await _adminRepository.GetAllPropertiesAsync(null, null, 1, 10000);
//                var userProperties = properties.Where(p => p.HostId == user.Id).ToList();

//                var reviews = await _adminRepository.GetAllReviewsAsync(1, 10000);
//                var userReviews = reviews.Where(r => r.ReviewerId == user.Id || r.RevieweeId == user.Id).ToList();

//                userDtos.Add(new AdminUserDto
//                {
//                    Id = user.Id,
//                    Email = user.Email,
//                    FirstName = user.FirstName,
//                    LastName = user.LastName,
//                    PhoneNumber = user.PhoneNumber,
//                    Role = userRole ?? "Guest",
//                    IsActive = user.IsActive,
//                    IsVerified = user.IsVerified,
//                    IsBlocked = user.IsBlocked,
//                    BlockReason = user.BlockReason,
//                    CreatedAt = user.CreatedAt,
//                    VerifiedAt = user.VerifiedAt,
//                    TotalBookings = userBookings.Count,
//                    TotalProperties = userProperties.Count,
//                    TotalSpent = userBookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
//                    TotalEarned = userProperties.SelectMany(p => p.Bookings).Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
//                    ReviewsCount = userReviews.Count,
//                    AverageRating = userReviews.Any() ? userReviews.Average(r => (double?)r.Rating) : null
//                });
//            }

//            return userDtos;
//        }

//        public async Task<AdminUserDto> GetUserByIdAsync(string userId)
//        {
//            var user = await _adminRepository.GetUserByIdAsync(userId);
//            if (user == null) return null;

//            var userRole = await _adminRepository.GetUserRoleAsync(user.Id);
//            var bookings = await _adminRepository.GetAllBookingsAsync(null, null, null, 1, 10000);
//            var userBookings = bookings.Where(b => b.GuestId == user.Id).ToList();

//            var properties = await _adminRepository.GetAllPropertiesAsync(null, null, 1, 10000);
//            var userProperties = properties.Where(p => p.HostId == user.Id).ToList();

//            var reviews = await _adminRepository.GetAllReviewsAsync(1, 10000);
//            var userReviews = reviews.Where(r => r.ReviewerId == user.Id || r.RevieweeId == user.Id).ToList();

//            return new AdminUserDto
//            {
//                Id = user.Id,
//                Email = user.Email,
//                FirstName = user.FirstName,
//                LastName = user.LastName,
//                PhoneNumber = user.PhoneNumber,
//                Role = userRole ?? "Guest",
//                IsActive = user.IsActive,
//                IsVerified = user.IsVerified,
//                IsBlocked = user.IsBlocked,
//                BlockReason = user.BlockReason,
//                CreatedAt = user.CreatedAt,
//                VerifiedAt = user.VerifiedAt,
//                TotalBookings = userBookings.Count,
//                TotalProperties = userProperties.Count,
//                TotalSpent = userBookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
//                TotalEarned = userProperties.SelectMany(p => p.Bookings).Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
//                ReviewsCount = userReviews.Count,
//                AverageRating = userReviews.Any() ? userReviews.Average(r => (double?)r.Rating) : null
//            };
//        }

//        public async Task<bool> UpdateUserStatusAsync(string userId, UpdateUserStatusDto dto)
//        {
//            var user = await _adminRepository.GetUserByIdAsync(userId);
//            if (user == null) return false;

//            user.IsActive = dto.IsActive;
//            return await _adminRepository.UpdateUserAsync(user);
//        }

//        public async Task<bool> BlockUserAsync(string userId, BlockUserDto dto)
//        {
//            var user = await _adminRepository.GetUserByIdAsync(userId);
//            if (user == null) return false;

//            user.IsBlocked = dto.IsBlocked;
//            user.BlockReason = dto.Reason;
//            user.BlockedAt = dto.IsBlocked ? DateTime.UtcNow : null;
//            user.IsActive = !dto.IsBlocked;

//            return await _adminRepository.UpdateUserAsync(user);
//        }

//        public async Task<bool> UnblockUserAsync(string userId)
//        {
//            var user = await _adminRepository.GetUserByIdAsync(userId);
//            if (user == null) return false;

//            user.IsBlocked = false;
//            user.BlockReason = null;
//            user.BlockedAt = null;
//            user.IsActive = true;

//            return await _adminRepository.UpdateUserAsync(user);
//        }

//        public async Task<bool> DeleteUserAsync(string userId)
//        {
//            var user = await _adminRepository.GetUserByIdAsync(userId);
//            if (user == null) return false;

//            return await _adminRepository.DeleteUserAsync(user);
//        }

//        #endregion

//        #region Verification Management

//        public async Task<List<VerificationRequestDto>> GetPendingVerificationsAsync()
//        {
//            var verifications = await _adminRepository.GetAllVerificationsAsync(VerificationStatus.Pending);

//            return verifications.Select(v => new VerificationRequestDto
//            {
//                Id = v.Id,
//                UserId = v.UserId,
//                UserName = v.User.FirstName + " " + v.User.LastName,
//                UserEmail = v.User.Email,
//                IdType = v.IdType,
//                IdNumber = v.IdNumber,
//                IdImageUrl = v.IdImageUrl,
//                Status = v.Status.ToString(),
//                SubmittedAt = v.SubmittedAt,
//                AdminNotes = v.AdminNotes
//            }).ToList();
//        }

//        public async Task<List<VerificationRequestDto>> GetAllVerificationsAsync(string? status = null)
//        {
//            VerificationStatus? verificationStatus = null;
//            if (!string.IsNullOrEmpty(status) && Enum.TryParse<VerificationStatus>(status, out var parsedStatus))
//            {
//                verificationStatus = parsedStatus;
//            }

//            var verifications = await _adminRepository.GetAllVerificationsAsync(verificationStatus);

//            return verifications.Select(v => new VerificationRequestDto
//            {
//                Id = v.Id,
//                UserId = v.UserId,
//                UserName = v.User.FirstName + " " + v.User.LastName,
//                UserEmail = v.User.Email,
//                IdType = v.IdType,
//                IdNumber = v.IdNumber,
//                IdImageUrl = v.IdImageUrl,
//                Status = v.Status.ToString(),
//                SubmittedAt = v.SubmittedAt,
//                AdminNotes = v.AdminNotes
//            }).ToList();
//        }

//        public async Task<VerificationRequestDto> GetVerificationByIdAsync(int verificationId)
//        {
//            var verification = await _adminRepository.GetVerificationByIdAsync(verificationId);
//            if (verification == null) return null;

//            return new VerificationRequestDto
//            {
//                Id = verification.Id,
//                UserId = verification.UserId,
//                UserName = verification.User.FirstName + " " + verification.User.LastName,
//                UserEmail = verification.User.Email,
//                IdType = verification.IdType,
//                IdNumber = verification.IdNumber,
//                IdImageUrl = verification.IdImageUrl,
//                Status = verification.Status.ToString(),
//                SubmittedAt = verification.SubmittedAt,
//                AdminNotes = verification.AdminNotes
//            };
//        }

//        public async Task<bool> ApproveVerificationAsync(int verificationId, string adminId, ApproveVerificationDto dto)
//        {
//            var verification = await _adminRepository.GetVerificationByIdAsync(verificationId);
//            if (verification == null) return false;

//            verification.Status = VerificationStatus.Approved;
//            verification.AdminNotes = dto.AdminNotes;
//            verification.ReviewedAt = DateTime.UtcNow;
//            verification.ReviewedByAdminId = adminId;

//            verification.User.IsVerified = true;
//            verification.User.VerifiedAt = DateTime.UtcNow;

//            await _adminRepository.UpdateVerificationAsync(verification);
//            await _adminRepository.UpdateUserAsync(verification.User);

//            _logger.LogInformation($"Verification {verificationId} approved for user {verification.UserId}");
//            return true;
//        }

//        public async Task<bool> RejectVerificationAsync(int verificationId, string adminId, RejectVerificationDto dto)
//        {
//            var verification = await _adminRepository.GetVerificationByIdAsync(verificationId);
//            if (verification == null) return false;

//            verification.Status = VerificationStatus.Rejected;
//            verification.RejectionReason = dto.RejectionReason;
//            verification.AdminNotes = dto.AdminNotes;
//            verification.ReviewedAt = DateTime.UtcNow;
//            verification.ReviewedByAdminId = adminId;

//            await _adminRepository.UpdateVerificationAsync(verification);

//            _logger.LogInformation($"Verification {verificationId} rejected for user {verification.UserId}");
//            return true;
//        }

//        #endregion

//        #region Property Management

//        public async Task<List<AdminPropertyDto>> GetAllPropertiesAsync(string? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10)
//        {
//            PropertyStatus? propertyStatus = null;
//            if (!string.IsNullOrEmpty(status) && Enum.TryParse<PropertyStatus>(status, out var parsedStatus))
//            {
//                propertyStatus = parsedStatus;
//            }

//            var properties = await _adminRepository.GetAllPropertiesAsync(propertyStatus, searchTerm, pageNumber, pageSize);

//            return properties.Select(p => new AdminPropertyDto
//            {
//                Id = p.Id,
//                Title = p.Title,
//                HostId = p.HostId,
//                HostName = p.Host.FirstName + " " + p.Host.LastName,
//                Status = p.Status.ToString(),
//                PricePerNight = p.PricePerNight,
//                Location = p.City + ", " + p.Country,
//                TotalBookings = p.Bookings.Count,
//                TotalRevenue = p.Bookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
//                AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => (double?)r.Rating) : null,
//                ReviewsCount = p.Reviews.Count,
//                CreatedAt = p.CreatedAt,
//                ApprovedAt = p.ApprovedAt,
//                RejectionReason = p.RejectionReason
//            }).ToList();
//        }

//        public async Task<AdminPropertyDto> GetPropertyByIdAsync(int propertyId)
//        {
//            var property = await _adminRepository.GetPropertyByIdAsync(propertyId);
//            if (property == null) return null;

//            return new AdminPropertyDto
//            {
//                Id = property.Id,
//                Title = property.Title,
//                HostId = property.HostId,
//                HostName = property.Host.FirstName + " " + property.Host.LastName,
//                Status = property.Status.ToString(),
//                PricePerNight = property.PricePerNight,
//                Location = property.City + ", " + property.Country,
//                TotalBookings = property.Bookings.Count,
//                TotalRevenue = property.Bookings.Where(b => b.Status == BookingStatus.Completed).Sum(b => b.TotalPrice),
//                AverageRating = property.Reviews.Any() ? property.Reviews.Average(r => (double?)r.Rating) : null,
//                ReviewsCount = property.Reviews.Count,
//                CreatedAt = property.CreatedAt,
//                ApprovedAt = property.ApprovedAt,
//                RejectionReason = property.RejectionReason
//            };
//        }

//        public async Task<bool> ApprovePropertyAsync(int propertyId, string adminId, ApprovePropertyDto dto)
//        {
//            var property = await _adminRepository.GetPropertyByIdAsync(propertyId);
//            if (property == null) return false;

//            property.Status = PropertyStatus.Approved;
//            property.ApprovedAt = DateTime.UtcNow;
//            property.ApprovedByAdminId = adminId;
//            property.IsApproved = true;
//            property.IsActive = true;

//            await _adminRepository.UpdatePropertyAsync(property);
//            _logger.LogInformation($"Property {propertyId} approved by admin {adminId}");

//            return true;
//        }

//        public async Task<bool> RejectPropertyAsync(int propertyId, string adminId, RejectPropertyDto dto)
//        {
//            var property = await _adminRepository.GetPropertyByIdAsync(propertyId);
//            if (property == null) return false;

//            property.Status = PropertyStatus.Rejected;
//            property.IsApproved = false;
//            property.RejectionReason = dto.RejectionReason;
//            property.UpdatedAt = DateTime.UtcNow;

//            await _adminRepository.UpdatePropertyAsync(property);
//            _logger.LogInformation($"Property {propertyId} rejected by admin {adminId}: {dto.RejectionReason}");

//            return true;
//        }

//        public async Task<bool> UpdatePropertyStatusAsync(int propertyId, UpdatePropertyStatusDto dto)
//        {
//            var property = await _adminRepository.GetPropertyByIdAsync(propertyId);
//            if (property == null) return false;

//            if (Enum.TryParse<PropertyStatus>(dto.Status, out var status))
//            {
//                property.Status = status;
//                await _adminRepository.UpdatePropertyAsync(property);
//                _logger.LogInformation($"Property {propertyId} status updated to {status}");
//                return true;
//            }

//            return false;
//        }

//        public async Task<bool> DeletePropertyAsync(int propertyId)
//        {
//            var property = await _adminRepository.GetPropertyByIdAsync(propertyId);
//            if (property == null) return false;

//            await _adminRepository.DeletePropertyAsync(property);
//            _logger.LogInformation($"Property {propertyId} deleted");
//            return true;
//        }

//        #endregion

//        #region Bookings Management

//        public async Task<List<BookingResponseDto>> GetAllBookingsAsync(string? status = null, DateTime? startDate = null, DateTime? endDate = null, int pageNumber = 1, int pageSize = 10)
//        {
//            BookingStatus? bookingStatus = null;
//            if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, out var parsedStatus))
//            {
//                bookingStatus = parsedStatus;
//            }

//            var bookings = await _adminRepository.GetAllBookingsAsync(bookingStatus, startDate, endDate, pageNumber, pageSize);

//            return bookings.Select(b => new BookingResponseDto
//            {
//                Id = b.Id,
//                PropertyId = b.PropertyId,
//                PropertyTitle = b.Property.Title,
//                GuestId = b.GuestId,
//                GuestName = b.Guest.FirstName + " " + b.Guest.LastName,
//                HostName = b.Property.Host.FirstName + " " + b.Property.Host.LastName,
//                CheckInDate = b.CheckInDate,
//                CheckOutDate = b.CheckOutDate,
//                TotalPrice = b.TotalPrice,
//                Status = b.Status.ToString(),
//                CreatedAt = b.CreatedAt
//            }).ToList();
//        }

//        public async Task<bool> CancelBookingAsync(int bookingId, string reason)
//        {
//            var booking = await _adminRepository.GetBookingByIdAsync(bookingId);
//            if (booking == null) return false;

//            booking.Status = BookingStatus.Cancelled;
//            await _adminRepository.UpdateBookingAsync(booking);

//            _logger.LogInformation($"Booking {bookingId} cancelled by admin: {reason}");
//            return true;
//        }

//        public async Task<bool> RefundBookingAsync(int bookingId, decimal refundAmount, string reason)
//        {
//            var booking = await _adminRepository.GetBookingByIdAsync(bookingId);
//            if (booking == null) return false;

//            booking.Status = BookingStatus.Cancelled;
//            // TODO: Process refund via payment gateway

//            await _adminRepository.UpdateBookingAsync(booking);
//            _logger.LogInformation($"Booking {bookingId} refunded {refundAmount}: {reason}");

//            return true;
//        }

//        #endregion

//        #region Reviews Management

//        public async Task<List<ReviewResponseDto>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 10)
//        {
//            var reviews = await _adminRepository.GetAllReviewsAsync(pageNumber, pageSize);

//            return reviews.Select(r => new ReviewResponseDto
//            {
//                Id = r.Id,
//                PropertyId = r.PropertyId,
//                PropertyTitle = r.Property.Title,
//                ReviewerId = r.ReviewerId,
//                ReviewerName = r.Reviewer.FirstName + " " + r.Reviewer.LastName,
//                Rating = r.Rating,
//                Comment = r.Comment,
//                CreatedAt = r.CreatedAt
//            }).ToList();
//        }

//        public async Task<bool> DeleteReviewAsync(int reviewId, string reason)
//        {
//            var review = await _adminRepository.GetReviewByIdAsync(reviewId);
//            if (review == null) return false;

//            await _adminRepository.DeleteReviewAsync(review);
//            _logger.LogInformation($"Review {reviewId} deleted by admin: {reason}");
//            return true;
//        }

//        public async Task<List<ReviewResponseDto>> GetFlaggedReviewsAsync()
//        {
//            var reviews = await _adminRepository.GetFlaggedReviewsAsync();

//            return reviews.Select(r => new ReviewResponseDto
//            {
//                Id = r.Id,
//                PropertyId = r.PropertyId,
//                PropertyTitle = r.Property.Title,
//                ReviewerId = r.ReviewerId,
//                ReviewerName = r.Reviewer.FirstName + " " + r.Reviewer.LastName,
//                Rating = r.Rating,
//                Comment = r.Comment,
//                CreatedAt = r.CreatedAt
//            }).ToList();
//        }

//        #endregion
//    }
//}


using Airbnb.API.DTOs.Admin;
using Airbnb.API.DTOs.Booking;
using Airbnb.API.DTOs.Review;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
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

                // 1. حساب الإيرادات المجمعة (شقق + تجارب)
                var totalRevenue = await _adminRepository.GetTotalCombinedRevenueAsync();

                // 2. حساب عمولة المنصة (15% من الإجمالي)
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

                    TotalBookings = await _adminRepository.GetTotalCombinedBookingsCountAsync(),
                    ActiveBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Confirmed),
                    CompletedBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Completed),
                    CancelledBookings = await _adminRepository.GetBookingsCountByStatusAsync(BookingStatus.Cancelled),

                    TotalRevenue = totalRevenue,
                    MonthlyRevenue = await _adminRepository.GetCombinedRevenueByDateRangeAsync(startOfMonth, now),
                    PlatformFees = platformFees, // ✅ المكسب الفعلي للأدمن

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
            // جلب كل الحجوزات المكتملة (شقق وتجارب)
            var bookings = await _adminRepository.GetUnifiedBookingsAsync(null, startDate, endDate, 1, 100000);

            var revenueBookings = bookings
                .Where(b => b.Status == "Completed" || b.Status == "Confirmed") // ✅ شمول الـ Confirmed
                .ToList();



            var totalRevenue = bookings.Sum(b => b.TotalPrice);
            var platformFees = totalRevenue * 0.15m;
            var hostPayouts = totalRevenue - platformFees;

            // التجميع حسب الموقع (المدينة)
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

            // استخدام الحجوزات الموحدة للإحصائيات
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
            // ✅ استخدام الدالة الموحدة
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
            // 1. جلب ريفيوهات الشقق
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

            // 2. جلب ريفيوهات التجارب
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

            // 3. الدمج والترتيب
            var allReviews = propDtos.Concat(expDtos)
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
        // ... (هذه الدوال لم تتغير ويمكنك نسخها كما هي من الملف السابق أو استخدام الـ Implementation القياسي) ...
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

        // مسار ملف الإعدادات
        private readonly string _settingsFilePath = Path.Combine(Directory.GetCurrentDirectory(), "platform-settings.json");

        public async Task<PlatformSettingsDto> GetPlatformSettingsAsync()
        {
            if (!File.Exists(_settingsFilePath))
            {
                return new PlatformSettingsDto(); // Return defaults
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
            return await GetUserByIdAsync(adminId); // نستخدم الدالة الموجودة مسبقاً
        }

        public async Task<bool> UpdateAdminProfileAsync(string adminId, UpdateAdminProfileDto dto)
        {
            var user = await _userManager.FindByIdAsync(adminId);
            if (user == null)
            {
                _logger.LogError($"Admin user not found with ID: {adminId}");
                return false;
            }

            // تحديث البيانات الأساسية
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.PhoneNumber;

            // تحديث الإيميل فقط لو تغير (لتجنب الأخطاء)
            if (!string.Equals(user.Email, dto.Email, StringComparison.OrdinalIgnoreCase))
            {
                var emailResult = await _userManager.SetEmailAsync(user, dto.Email);
                if (!emailResult.Succeeded)
                {
                    foreach (var error in emailResult.Errors) _logger.LogError($"Email Update Error: {error.Description}");
                    return false;
                }
                user.UserName = dto.Email; // تحديث اسم المستخدم ليطابق الإيميل
            }

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                // طباعة سبب الخطأ في الكونسول (مهم جداً للـ Debugging)
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
    }
}
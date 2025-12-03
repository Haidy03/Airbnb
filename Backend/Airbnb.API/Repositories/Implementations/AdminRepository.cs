using Airbnb.API.Data;
using Airbnb.API.DTOs.Booking;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class AdminRepository : IAdminRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminRepository(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        #region Users
        public async Task<List<ApplicationUser>> GetAllUsersAsync(string? role = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10)
        {
            var query = _context.Users.AsQueryable();
            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(u =>
                    u.Email.Contains(searchTerm) ||
                    u.FirstName.Contains(searchTerm) ||
                    u.LastName.Contains(searchTerm));
            }
            var users = await query.OrderByDescending(u => u.CreatedAt).Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
            if (!string.IsNullOrEmpty(role))
            {
                var usersWithRole = new List<ApplicationUser>();
                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    if (roles.Contains(role)) usersWithRole.Add(user);
                }
                return usersWithRole;
            }
            return users;
        }
        public async Task<ApplicationUser?> GetUserByIdAsync(string userId) => await _context.Users.FindAsync(userId);
        public async Task<string?> GetUserRoleAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            return user == null ? null : (await _userManager.GetRolesAsync(user)).FirstOrDefault();
        }
        public async Task<bool> UpdateUserAsync(ApplicationUser user) { _context.Users.Update(user); return await _context.SaveChangesAsync() > 0; }
        public async Task<bool> DeleteUserAsync(ApplicationUser user) { _context.Users.Remove(user); return await _context.SaveChangesAsync() > 0; }
        #endregion

        #region Verifications
        public async Task<List<UserVerification>> GetAllVerificationsAsync(VerificationStatus? status = null)
        {
            var query = _context.UserVerifications.Include(v => v.User).AsQueryable();
            if (status.HasValue) query = query.Where(v => v.Status == status.Value);
            return await query.OrderByDescending(v => v.SubmittedAt).ToListAsync();
        }
        public async Task<UserVerification?> GetVerificationByIdAsync(int verificationId) => await _context.UserVerifications.Include(v => v.User).FirstOrDefaultAsync(v => v.Id == verificationId);
        public async Task<UserVerification?> GetVerificationByUserIdAsync(string userId) => await _context.UserVerifications.Include(v => v.User).FirstOrDefaultAsync(v => v.UserId == userId);
        public async Task<bool> CreateVerificationAsync(UserVerification verification) { await _context.UserVerifications.AddAsync(verification); return await _context.SaveChangesAsync() > 0; }
        public async Task<bool> UpdateVerificationAsync(UserVerification verification) { _context.UserVerifications.Update(verification); return await _context.SaveChangesAsync() > 0; }
        #endregion

        #region Properties
        public async Task<List<Property>> GetAllPropertiesAsync(PropertyStatus? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10)
        {
            var query = _context.Properties
                .Include(p => p.Host)
                .Include(p => p.Bookings)
                .Include(p => p.Reviews)
                .Include(p => p.PropertyType)
                .Include(p => p.Images)
                .AsQueryable();
            if (status.HasValue) query = query.Where(p => p.Status == status.Value);
            if (!string.IsNullOrEmpty(searchTerm)) query = query.Where(p => p.Title.Contains(searchTerm) || p.City.Contains(searchTerm) || p.Country.Contains(searchTerm));
            return await query.OrderByDescending(p => p.CreatedAt).Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
        }
        public async Task<Property?> GetPropertyByIdAsync(int propertyId) => await _context.Properties.Include(p => p.Host).Include(p => p.Bookings).Include(p => p.Reviews).FirstOrDefaultAsync(p => p.Id == propertyId);
        public async Task<bool> UpdatePropertyAsync(Property property) { _context.Properties.Update(property); return await _context.SaveChangesAsync() > 0; }
        public async Task<bool> DeletePropertyAsync(Property property) { _context.Properties.Remove(property); return await _context.SaveChangesAsync() > 0; }
        #endregion

        #region Bookings (Unified: Properties + Experiences + Services)

        public async Task<List<BookingResponseDto>> GetUnifiedBookingsAsync(string? status = null, DateTime? startDate = null, DateTime? endDate = null, int pageNumber = 1, int pageSize = 10)
        {

            var propertyQuery = _context.Bookings
                .Include(b => b.Guest)
                .Include(b => b.Property).ThenInclude(p => p.Host)
                .Include(b => b.Property.Images)
                .AsQueryable();

            var experienceQuery = _context.ExperienceBookings
                .Include(b => b.Guest)
                .Include(b => b.Experience).ThenInclude(e => e.Host)
                .Include(b => b.Experience.Images)
                .Include(b => b.Availability)
                .AsQueryable();

            var serviceQuery = _context.ServiceBookings
                .Include(b => b.Guest)
                .Include(b => b.Service).ThenInclude(s => s.Host)
                .AsQueryable();

            if (startDate.HasValue)
            {
                propertyQuery = propertyQuery.Where(b => b.CheckInDate >= startDate.Value);
                experienceQuery = experienceQuery.Where(b => b.Availability.Date >= startDate.Value);
                serviceQuery = serviceQuery.Where(b => b.BookingDate >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                propertyQuery = propertyQuery.Where(b => b.CheckOutDate <= endDate.Value);
                experienceQuery = experienceQuery.Where(b => b.Availability.Date <= endDate.Value);
                serviceQuery = serviceQuery.Where(b => b.BookingDate <= endDate.Value);
            }

            var propBookings = await propertyQuery.ToListAsync();
            var expBookings = await experienceQuery.ToListAsync();
            var svcBookings = await serviceQuery.ToListAsync();

            var propsDto = propBookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                Type = "Property",
                PropertyId = b.PropertyId,
                ExperienceId = null,
                ItemTitle = b.Property.Title,
                Location = b.Property.City,
                PropertyImage = b.Property.Images?.FirstOrDefault()?.ImageUrl ?? "",
                GuestId = b.GuestId,
                GuestName = b.Guest.FirstName + " " + b.Guest.LastName,
                GuestEmail = b.Guest.Email,
                HostName = b.Property.Host.FirstName + " " + b.Property.Host.LastName,
                CheckInDate = b.CheckInDate,
                CheckOutDate = b.CheckOutDate,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString(),
                CreatedAt = b.CreatedAt
            });

            var expsDto = expBookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                Type = "Experience",
                PropertyId = null,
                ExperienceId = b.ExperienceId,
                ItemTitle = b.Experience.Title,
                Location = b.Experience.City,
                PropertyImage = b.Experience.Images?.FirstOrDefault()?.ImageUrl ?? "",
                GuestId = b.GuestId,
                GuestName = b.Guest.FirstName + " " + b.Guest.LastName,
                GuestEmail = b.Guest.Email,
                HostName = b.Experience.Host.FirstName + " " + b.Experience.Host.LastName,
                CheckInDate = b.Availability.Date,
                CheckOutDate = b.Availability.Date,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString(),
                CreatedAt = b.CreatedAt
            });

            var svcsDto = svcBookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                Type = "Service",
                PropertyId = null,
                ExperienceId = null,
                ItemTitle = b.Service.Title,
                Location = b.Service.City,
                PropertyImage = "",
                GuestId = b.GuestId,
                GuestName = b.Guest.FirstName + " " + b.Guest.LastName,
                GuestEmail = b.Guest.Email,
                HostName = b.Service.Host.FirstName + " " + b.Service.Host.LastName,
                CheckInDate = b.BookingDate,
                CheckOutDate = b.BookingDate,
                TotalPrice = b.TotalPrice,
                Status = b.Status,
                CreatedAt = b.CreatedAt
            });

            var allBookings = propsDto.Concat(expsDto).Concat(svcsDto).ToList();

            if (!string.IsNullOrEmpty(status))
            {
                allBookings = allBookings.Where(b => b.Status == status).ToList();
            }

            return allBookings
                .OrderByDescending(b => b.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();
        }

        public async Task<Booking?> GetBookingByIdAsync(int bookingId) => await _context.Bookings
            .Include(b => b.Guest)
            .Include(b => b.Property).ThenInclude(p => p.Host)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        public async Task<bool> UpdateBookingAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            return await _context.SaveChangesAsync() > 0;
        }

        #endregion

        #region Reviews

        public async Task<List<Review>> GetAllReviewsAsync(int pageNumber = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Property)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<List<Review>> GetAllPropertyReviewsAsync()
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Property)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ExperienceReview>> GetAllExperienceReviewsAsync()
        {
            return await _context.ExperienceReviews
                .Include(r => r.Reviewer)
                .Include(r => r.Experience)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ServiceReview>> GetAllServiceReviewsAsync()
        {
            return await _context.ServiceReviews
                .Include(r => r.Reviewer)
                .Include(r => r.Service)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Review>> GetFlaggedReviewsAsync() => await _context.Reviews
            .Where(r => r.IsApproved)
            .Include(r => r.Reviewer)
            .Include(r => r.Property)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        public async Task<Review?> GetReviewByIdAsync(int reviewId) => await _context.Reviews.FindAsync(reviewId);

        public async Task<bool> DeleteReviewAsync(Review review)
        {
            _context.Reviews.Remove(review);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteExperienceReviewAsync(int reviewId)
        {
            var review = await _context.ExperienceReviews.FindAsync(reviewId);
            if (review != null)
            {
                _context.ExperienceReviews.Remove(review);
                return await _context.SaveChangesAsync() > 0;
            }
            return false;
        }

        public async Task<bool> DeleteServiceReviewAsync(int reviewId)
        {
            var review = await _context.ServiceReviews.FindAsync(reviewId);
            if (review != null)
            {
                _context.ServiceReviews.Remove(review);
                return await _context.SaveChangesAsync() > 0;
            }
            return false;
        }

        #endregion

        #region Statistics (Combined)

        public async Task<int> GetTotalUsersCountAsync() => await _context.Users.CountAsync();

        public async Task<int> GetUsersCountByRoleAsync(string roleName)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            return role == null ? 0 : await _context.UserRoles.CountAsync(ur => ur.RoleId == role.Id);
        }

        public async Task<int> GetActiveUsersCountAsync() => await _context.Users.CountAsync(u => u.IsActive && !u.IsBlocked);

        public async Task<int> GetBlockedUsersCountAsync() => await _context.Users.CountAsync(u => u.IsBlocked);

        public async Task<int> GetTotalPropertiesCountAsync() => await _context.Properties.CountAsync();

        public async Task<int> GetPropertiesCountByStatusAsync(PropertyStatus status) => await _context.Properties.CountAsync(p => p.Status == status);

        public async Task<int> GetTotalCombinedBookingsCountAsync()
        {
            var p = await _context.Bookings.CountAsync();
            var e = await _context.ExperienceBookings.CountAsync();
            var s = await _context.ServiceBookings.CountAsync();
            return p + e + s;
        }

        public async Task<int> GetBookingsCountByStatusAsync(BookingStatus status)
        {
            var propCount = await _context.Bookings.CountAsync(b => b.Status == status);

            var statusName = status.ToString();
            var expCount = 0;

            if (Enum.TryParse<ExperienceBookingStatus>(statusName, out var expStatus))
            {
                expCount = await _context.ExperienceBookings.CountAsync(b => b.Status == expStatus);
            }

            var sCount = await _context.ServiceBookings.CountAsync(b => b.Status == statusName);

            return propCount + expCount + sCount;
        }

        public async Task<decimal> GetTotalCombinedRevenueAsync()
        {
            var propRevenue = await _context.Bookings
                .Where(b => b.Status == BookingStatus.Completed || b.Status == BookingStatus.Confirmed)
                .SumAsync(b => b.TotalPrice);

            var expRevenue = await _context.ExperienceBookings
                .Where(b => b.Status == ExperienceBookingStatus.Completed || b.Status == ExperienceBookingStatus.Confirmed)
                .SumAsync(b => b.TotalPrice);

            var sRev = await _context.ServiceBookings
                .Where(b => b.Status == "Completed" || b.Status == "Confirmed")
                .SumAsync(b => b.TotalPrice);

            return propRevenue + expRevenue + sRev;
        }

        public async Task<decimal> GetCombinedRevenueByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            var propRevenue = await _context.Bookings
                .Where(b => (b.Status == BookingStatus.Completed || b.Status == BookingStatus.Confirmed)
                            && b.CreatedAt >= startDate && b.CreatedAt <= endDate)
                .SumAsync(b => b.TotalPrice);

            var expRevenue = await _context.ExperienceBookings
                .Where(b => (b.Status == ExperienceBookingStatus.Completed || b.Status == ExperienceBookingStatus.Confirmed)
                            && b.CreatedAt >= startDate && b.CreatedAt <= endDate)
                .SumAsync(b => b.TotalPrice);

            var sRev = await _context.ServiceBookings
                .Where(b => (b.Status == "Completed" || b.Status == "Confirmed")
                            && b.CreatedAt >= startDate && b.CreatedAt <= endDate)
                .SumAsync(b => b.TotalPrice);

            return propRevenue + expRevenue + sRev;
        }

        public async Task<List<Experience>> GetAllExperiencesAsync()
        {
            return await _context.Experiences.ToListAsync();
        }

        public async Task<int> GetTotalReviewsCountAsync()
        {
            var p = await _context.Reviews.CountAsync();
            var e = await _context.ExperienceReviews.CountAsync();
            var s = await _context.ServiceReviews.CountAsync();
            return p + e + s;
        }

        public async Task<int> GetTotalServicesCountAsync()
        {
            return await _context.Services.CountAsync();
        }

        public async Task<int> GetServicesCountByStatusAsync(ServiceStatus status)
        {
            return await _context.Services.CountAsync(s => s.Status == status);
        }

        public async Task<double> GetAverageRatingAsync()
        {
            var r1 = await _context.Reviews.Select(r => (double)r.Rating).ToListAsync();
            var r2 = await _context.ExperienceReviews.Select(r => (double)r.Rating).ToListAsync();
            var r3 = await _context.ServiceReviews.Select(r => (double)r.Rating).ToListAsync();
            var all = r1.Concat(r2).Concat(r3).ToList();
            return all.Any() ? all.Average() : 0;
        }

        #endregion

        public async Task<List<Service>> GetAllServicesAsync(ServiceStatus? status = null, string? searchTerm = null, int pageNumber = 1, int pageSize = 10)
        {
            var query = _context.Services
                .Include(s => s.Host)
                .Include(s => s.Category)
                .Include(s => s.Images)
                .Include(s => s.Packages)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(s => s.Status == status.Value);
            }

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(s =>
                    s.Title.Contains(searchTerm) ||
                    s.City.Contains(searchTerm) ||
                    (s.Host.FirstName + " " + s.Host.LastName).Contains(searchTerm));
            }

            return await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<Service?> GetServiceByIdAsync(int serviceId)
        {
            return await _context.Services
                .Include(s => s.Host)
                .Include(s => s.Images)
                .FirstOrDefaultAsync(s => s.Id == serviceId);
        }

        public async Task<bool> UpdateServiceAsync(Service service)
        {
            _context.Services.Update(service);
            return await _context.SaveChangesAsync() > 0;
        }
        public async Task<bool> DeleteServiceAsync(int serviceId)
        {
            var service = await _context.Services.FindAsync(serviceId);
            if (service == null) return false;

            _context.Services.Remove(service);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
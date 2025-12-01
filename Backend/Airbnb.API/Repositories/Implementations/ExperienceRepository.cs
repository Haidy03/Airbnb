using Airbnb.API.DTOs.Experiences;
using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class ExperienceRepository : IExperienceRepository
    {
        private readonly ApplicationDbContext _context;

        public ExperienceRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public IQueryable<Experience> GetQueryable()
        {
            return _context.Experiences.AsQueryable();
        }
        public async Task<Experience?> GetByIdAsync(int id)
        {
            return await _context.Experiences
                .Include(e => e.Host)
                .Include(e => e.Category)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<Experience?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Experiences
                .Include(e => e.Host)
                .Include(e => e.Category)
                .Include(e => e.Images)
                .Include(e => e.Languages)
                .Include(e => e.Reviews)
                    .ThenInclude(r => r.Reviewer)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<IEnumerable<Experience>> GetAllAsync()
        {
            return await _context.Experiences
                .Include(e => e.Host)
                .Include(e => e.Category)
                .Include(e => e.Images)
                .Where(e => e.IsActive && e.Status == ExperienceStatus.Active)
                .ToListAsync();
        }

        public async Task<IEnumerable<Experience>> GetByHostIdAsync(string hostId)
        {
            return await _context.Experiences
                .Include(e => e.Category)
                .Include(e => e.Images)
                .Include(e=> e.Host)
                .Include(e => e.Reviews)
                .Include(e => e.Bookings)
                .Where(e => e.HostId == hostId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
        }

        public async Task<Experience> AddAsync(Experience experience)
        {
            await _context.Experiences.AddAsync(experience);
            await _context.SaveChangesAsync();
            return experience;
        }

        public async Task UpdateAsync(Experience experience)
        {
            _context.Experiences.Update(experience);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var experience = await _context.Experiences.FindAsync(id);
            if (experience != null)
            {
                _context.Experiences.Remove(experience);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<PagedResult<ExperienceSearchResultDto>> SearchExperiencesAsync(ExperienceSearchDto dto)
        {
            var query = _context.Experiences
                .Include(e => e.Host)
                .Include(e => e.Category)
                .Include(e => e.Images)
                .Include(e => e.Reviews)
                .Where(e => e.IsActive && e.Status == ExperienceStatus.Active)
                .AsQueryable();

            // Filter by location
            if (!string.IsNullOrEmpty(dto.Location))
            {
                query = query.Where(e =>
                    (e.City != null && e.City.Contains(dto.Location)) ||
                    (e.Country != null && e.Country.Contains(dto.Location)));
            }

            // Filter by category
            if (dto.CategoryId.HasValue)
            {
                query = query.Where(e => e.CategoryId == dto.CategoryId.Value);
            }

            // Filter by type
            if (!string.IsNullOrEmpty(dto.Type))
            {
                if (Enum.TryParse<ExperienceType>(dto.Type, out var type))
                {
                    query = query.Where(e => e.Type == type);
                }
            }

            // Filter by price range
            if (dto.MinPrice.HasValue)
            {
                query = query.Where(e => e.PricePerPerson >= dto.MinPrice.Value);
            }
            if (dto.MaxPrice.HasValue)
            {
                query = query.Where(e => e.PricePerPerson <= dto.MaxPrice.Value);
            }

            // Filter by language
            if (!string.IsNullOrEmpty(dto.Language))
            {
                query = query.Where(e => e.Languages.Any(l => l.LanguageCode == dto.Language));
            }

            // Filter by group size
            if (dto.Guests.HasValue)
            {
                query = query.Where(e => e.MaxGroupSize >= dto.Guests.Value);
            }

            // Sorting
            query = dto.SortBy?.ToLower() switch
            {
                "price" => query.OrderBy(e => e.PricePerPerson),
                "rating" => query.OrderByDescending(e => e.Reviews.Any() ? e.Reviews.Average(r => r.Rating) : 0),
                "popular" => query.OrderByDescending(e => e.Bookings.Count),
                _ => query.OrderByDescending(e => e.CreatedAt)
            };

            var totalCount = await query.CountAsync();

            var experiences = await query
                .Skip((dto.PageNumber - 1) * dto.PageSize)
                .Take(dto.PageSize)
                .Select(e => new ExperienceSearchResultDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    HostName = $"{e.Host.FirstName} {e.Host.LastName}",
                    HostAvatar = e.Host.ProfileImageUrl,
                    CategoryName = e.Category.Name,
                    Type = e.Type.ToString(),
                    City = e.City,
                    Country = e.Country,
                    DurationHours = e.DurationHours,
                    DurationMinutes = e.DurationMinutes,
                    PricePerPerson = e.PricePerPerson,
                    AverageRating = e.Reviews.Any() ? e.Reviews.Average(r => r.Rating) : 0,
                    TotalReviews = e.Reviews.Count,
                    PrimaryImage = e.Images.FirstOrDefault(i => i.IsPrimary) != null
                        ? e.Images.FirstOrDefault(i => i.IsPrimary)!.ImageUrl
                        : e.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()!.ImageUrl,
                    IsAvailable = e.Availabilities.Any(a => a.IsAvailable && a.Date >= DateTime.UtcNow.Date)
                })
                .ToListAsync();

            return new PagedResult<ExperienceSearchResultDto>
            {
                Items = experiences,
                TotalCount = totalCount,
                PageIndex = dto.PageNumber,
                PageSize = dto.PageSize
            };
        }
        public async Task<List<ExperienceReview>> GetReviewsByHostIdAsync(string hostId)
        {
            return await _context.ExperienceReviews
                .Include(r => r.Reviewer) // عشان الصورة والاسم
                .Include(r => r.Experience)
                .Where(r => r.Experience.HostId == hostId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
        public async Task<List<ExperienceSearchResultDto>> GetFeaturedExperiencesAsync(int count)
        {
            return await _context.Experiences
                .Include(e => e.Host)
                .Include(e => e.Category)
                .Include(e => e.Images)
                .Include(e => e.Reviews)
                .Where(e => e.IsActive && e.Status == ExperienceStatus.Active)
                .OrderByDescending(e => e.Reviews.Count)
                .Take(count)
                .Select(e => new ExperienceSearchResultDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    HostName = $"{e.Host.FirstName} {e.Host.LastName}",
                    HostAvatar = e.Host.ProfileImageUrl,
                    CategoryName = e.Category.Name,
                    Type = e.Type.ToString(),
                    City = e.City,
                    Country = e.Country,
                    DurationHours = e.DurationHours,
                    DurationMinutes = e.DurationMinutes,
                    PricePerPerson = e.PricePerPerson,
                    AverageRating = e.Reviews.Any() ? e.Reviews.Average(r => r.Rating) : 0,
                    TotalReviews = e.Reviews.Count,
                    PrimaryImage = e.Images.FirstOrDefault(i => i.IsPrimary) != null
                        ? e.Images.FirstOrDefault(i => i.IsPrimary)!.ImageUrl
                        : e.Images.OrderBy(i => i.DisplayOrder).FirstOrDefault()!.ImageUrl,
                    IsAvailable = e.Availabilities.Any(a => a.IsAvailable && a.Date >= DateTime.UtcNow.Date)
                })
                .ToListAsync();
        }

        public async Task<List<ExperienceCategory>> GetCategoriesAsync()
        {
            return await _context.ExperienceCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();
        }

        public async Task<ExperienceImage?> GetImageByIdAsync(int imageId)
        {
            return await _context.ExperienceImages
                .Include(i => i.Experience)
                    .ThenInclude(e => e.Host)
                .FirstOrDefaultAsync(i => i.Id == imageId);
        }

        public async Task DeleteImageAsync(int imageId)
        {
            var image = await _context.ExperienceImages.FindAsync(imageId);
            if (image != null)
            {
                _context.ExperienceImages.Remove(image);
                await _context.SaveChangesAsync();
            }
        }

        public async Task SetPrimaryImageAsync(int imageId, int experienceId)
        {
            var images = await _context.ExperienceImages
                .Where(i => i.ExperienceId == experienceId)
                .ToListAsync();

            foreach (var img in images)
            {
                img.IsPrimary = img.Id == imageId;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<ExperienceAvailability>> GetAvailabilitiesAsync(int experienceId, DateTime? startDate, DateTime? endDate)
        {
            var query = _context.ExperienceAvailabilities
                .Where(a => a.ExperienceId == experienceId && a.IsAvailable);

            if (startDate.HasValue)
            {
                query = query.Where(a => a.Date >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                query = query.Where(a => a.Date <= endDate.Value.Date);
            }

            return await query
                .OrderBy(a => a.Date)
                .ThenBy(a => a.StartTime)
                .ToListAsync();
        }

        public async Task<ExperienceAvailability?> GetAvailabilityByIdAsync(int availabilityId)
        {
            return await _context.ExperienceAvailabilities
                .Include(a => a.Experience)
                .FirstOrDefaultAsync(a => a.Id == availabilityId);
        }

        public async Task AddAvailabilityAsync(ExperienceAvailability availability)
        {
            await _context.ExperienceAvailabilities.AddAsync(availability);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAvailabilityAsync(ExperienceAvailability availability)
        {
            _context.ExperienceAvailabilities.Update(availability);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAvailabilityAsync(int availabilityId)
        {
            var availability = await _context.ExperienceAvailabilities.FindAsync(availabilityId);
            if (availability != null)
            {
                _context.ExperienceAvailabilities.Remove(availability);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<ExperienceBooking?> GetBookingByIdAsync(int bookingId)
        {
            return await _context.ExperienceBookings
                .Include(b => b.Experience)
                    .ThenInclude(e => e.Images)
                .Include(b => b.Guest)
                .Include(b => b.Availability)
                .FirstOrDefaultAsync(b => b.Id == bookingId);
        }

        public async Task<List<ExperienceBooking>> GetBookingsByGuestIdAsync(string guestId)
        {
            return await _context.ExperienceBookings
                .Include(b => b.Experience)
                    .ThenInclude(e => e.Images)
                .Include(b => b.Availability)
                .Where(b => b.GuestId == guestId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ExperienceBooking>> GetBookingsByHostIdAsync(string hostId)
        {
            return await _context.ExperienceBookings
                .Include(b => b.Experience)
                .Include(b => b.Guest)
                .Include(b => b.Availability)
                .Where(b => b.Experience.HostId == hostId)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        public async Task<ExperienceBooking> AddBookingAsync(ExperienceBooking booking)
        {
            await _context.ExperienceBookings.AddAsync(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        public async Task UpdateBookingAsync(ExperienceBooking booking)
        {
            _context.ExperienceBookings.Update(booking);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ReviewExistsAsync(int bookingId)
        {
            return await _context.ExperienceReviews
                .AnyAsync(r => r.ExperienceBookingId == bookingId);
        }

        public async Task AddReviewAsync(ExperienceReview review)
        {
            await _context.ExperienceReviews.AddAsync(review);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ExperienceReview>> GetReviewsByExperienceIdAsync(int experienceId)
        {
            return await _context.ExperienceReviews
                .Where(r => r.ExperienceId == experienceId)
                .Include(r => r.Reviewer)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
        public async Task<ExperienceReview?> GetReviewByIdAsync(int reviewId)
        {
            return await _context.ExperienceReviews
                .Include(r => r.Reviewer)
                .FirstOrDefaultAsync(r => r.Id == reviewId);
        }

        public async Task UpdateReviewAsync(ExperienceReview review)
        {
            _context.ExperienceReviews.Update(review);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteReviewAsync(int reviewId)
        {
            var review = await _context.ExperienceReviews.FindAsync(reviewId);
            if (review != null)
            {
                _context.ExperienceReviews.Remove(review);
                await _context.SaveChangesAsync();
            }
        }

        

        public async Task<ApplicationUser> GetUserByIdAsync(string userId)
        {
            return await _context.Users.FindAsync(userId);
        }
    }
}
using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class PropertyRepository: IPropertyRepository
    {
        private readonly ApplicationDbContext _context;

        public PropertyRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Property?> GetByIdAsync(int id)
        {
            return await _context.Properties.FindAsync(id);
        }

        public async Task<Property?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Properties
                .Include(p => p.Host)
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities)
                    .ThenInclude(pa => pa.Amenity)
                .Include(p => p.Reviews)
                .Include(p => p.Bookings)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Property>> GetAllAsync()
        {
            return await _context.Properties
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities)
                    .ThenInclude(pa => pa.Amenity)
                .ToListAsync();
        }

        public async Task<IEnumerable<Property>> GetByHostIdAsync(string hostId)
        {
            return await _context.Properties
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities)
                    .ThenInclude(pa => pa.Amenity)
                .Include(p => p.Reviews)
                .Include(p => p.Bookings)
                .Where(p => p.HostId == hostId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<Property> AddAsync(Property property)
        {
            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();
            return property;
        }

        public async Task UpdateAsync(Property property)
        {
            property.UpdatedAt = DateTime.UtcNow;
            _context.Properties.Update(property);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var property = await GetByIdAsync(id);
            if (property != null)
            {
                _context.Properties.Remove(property);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> ExistsAsync(int id)
        {
            return await _context.Properties.AnyAsync(p => p.Id == id);
        }

        public async Task<bool> IsHostOwnerAsync(int propertyId, string hostId)
        {
            return await _context.Properties
                .AnyAsync(p => p.Id == propertyId && p.HostId == hostId);
        }

        public async Task<PagedResult<PropertySearchResultDto>> SearchPropertiesAsync(SearchRequestDto searchDto)
        {
            // 1. Start with a base query of Active and Approved properties
            var query = _context.Properties
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .AsQueryable()
                .Where(p => p.IsActive && p.IsApproved);

            // 2. Apply Filters

            // Location (Case insensitive search in City or Country)
            if (!string.IsNullOrEmpty(searchDto.Location))
            {
                var loc = searchDto.Location.ToLower();
                query = query.Where(p => p.City.ToLower().Contains(loc) || p.Country.ToLower().Contains(loc));
            }

            // Guest Count
            if (searchDto.GuestCount.HasValue)
            {
                query = query.Where(p => p.MaxGuests >= searchDto.GuestCount.Value);
            }

            // Price Range
            if (searchDto.MinPrice.HasValue)
            {
                query = query.Where(p => p.PricePerNight >= searchDto.MinPrice.Value);
            }
            if (searchDto.MaxPrice.HasValue)
            {
                query = query.Where(p => p.PricePerNight <= searchDto.MaxPrice.Value);
            }

            // Property Type
            if (!string.IsNullOrEmpty(searchDto.PropertyType))
            {
                query = query.Where(p => p.PropertyType == searchDto.PropertyType);
            }

            // Amenities (This is a bit complex: Property must have ALL selected amenities)
            if (searchDto.AmenityIds != null && searchDto.AmenityIds.Any())
            {
                foreach (var amenityId in searchDto.AmenityIds)
                {
                    query = query.Where(p => p.PropertyAmenities.Any(pa => pa.AmenityId == amenityId));
                }
            }

            // Availability (Check if there are ANY bookings that overlap with the requested dates)
            if (searchDto.CheckInDate.HasValue && searchDto.CheckOutDate.HasValue)
            {
                query = query.Where(p => !p.Bookings.Any(b =>
                    b.Status != BookingStatus.Cancelled && // Ignore cancelled bookings
                    (
                        (searchDto.CheckInDate < b.CheckOutDate && searchDto.CheckOutDate > b.CheckInDate)
                    )
                ));
            }

            // 3. Apply Sorting
            query = searchDto.SortBy?.ToLower() switch
            {
                "price_asc" => query.OrderBy(p => p.PricePerNight),
                "price_desc" => query.OrderByDescending(p => p.PricePerNight),
                "newest" => query.OrderByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.Reviews.Count) // Default: Popularity
            };

            // 4. Execute Query (Pagination)
            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((searchDto.PageIndex - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .Select(p => new PropertySearchResultDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    City = p.City,
                    Country = p.Country,
                    PricePerNight = p.PricePerNight,
                    // Calculate rating safely
                    Rating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
                    TotalReviews = p.Reviews.Count,
                    // Get primary image or the first one available
                    ImageUrl = p.Images.FirstOrDefault(i => i.IsPrimary) != null
                        ? p.Images.FirstOrDefault(i => i.IsPrimary).ImageUrl
                        : p.Images.FirstOrDefault().ImageUrl,
                    IsGuestFavorite = p.Reviews.Count > 5 && p.Reviews.Average(r => r.Rating) > 4.8
                })
                .ToListAsync();

            return new PagedResult<PropertySearchResultDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageIndex = searchDto.PageIndex,
                PageSize = searchDto.PageSize
            };
        }

        public async Task<List<PropertySearchResultDto>> GetFeaturedPropertiesAsync(int count)
        {
            return await _context.Properties
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .Where(p => p.IsActive && p.IsApproved)
                .OrderByDescending(p => p.Reviews.Average(r => r.Rating)) // Sort by highest rating
                .Take(count) // Limit to top 5 or 10
                .Select(p => new PropertySearchResultDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    City = p.City,
                    Country = p.Country,
                    PricePerNight = p.PricePerNight,
                    Rating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
                    TotalReviews = p.Reviews.Count,
                    ImageUrl = p.Images.FirstOrDefault(i => i.IsPrimary) != null
                         ? p.Images.FirstOrDefault(i => i.IsPrimary).ImageUrl
                         : p.Images.FirstOrDefault().ImageUrl,
                    IsGuestFavorite = p.Reviews.Count > 5 && p.Reviews.Average(r => r.Rating) > 4.8
                })
                .ToListAsync();
        }
    }
}

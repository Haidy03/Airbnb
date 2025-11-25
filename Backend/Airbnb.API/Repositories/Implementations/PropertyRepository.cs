using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Repositories.Implementations
{
    public class PropertyRepository : IPropertyRepository
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
                .Include(p => p.PropertyType) // ✅ ADDED: Include PropertyType
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
                .Include(p => p.PropertyType) // ✅ ADDED
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities)
                    .ThenInclude(pa => pa.Amenity)
                .ToListAsync();
        }

        public async Task<IEnumerable<Property>> GetByHostIdAsync(string hostId)
        {
            return await _context.Properties
                .Include(p => p.PropertyType) // ✅ ADDED
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
                .Include(p => p.PropertyType) // ✅ ADDED
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

            // Property Type - ✅ CHANGED: Compare with PropertyType.Name or Code
            if (!string.IsNullOrEmpty(searchDto.PropertyType))
            {
                var propertyType = searchDto.PropertyType.ToUpper();
                query = query.Where(p =>
                    p.PropertyType.Code == propertyType ||
                    p.PropertyType.Name.ToLower().Contains(searchDto.PropertyType.ToLower()));
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
                var checkIn = searchDto.CheckInDate.Value.Date;
                var checkOut = searchDto.CheckOutDate.Value.Date;

                // 1. Check existing Bookings (Conflict if dates overlap)
                query = query.Where(p => !p.Bookings.Any(b =>
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.Rejected &&
                    (checkIn < b.CheckOutDate && checkOut > b.CheckInDate)
                ));

                // ✅ 2. Check Manual Blocks (Calendar Availability)
                // نستبعد العقار إذا كان الـ Host قد أغلق أي يوم في نطاق البحث
                query = query.Where(p => !p.Availabilities.Any(pa =>
                    pa.Date >= checkIn &&
                    pa.Date < checkOut && // Check-out day doesn't need to be available for sleeping
                    pa.IsAvailable == false // إذا كان اليوم "غير متاح"
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
                .Include(p => p.PropertyType) // ✅ ADDED
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

        /// <summary>
        /// Get image by ID with its related property
        /// </summary>
        public async Task<PropertyImage?> GetImageByIdWithPropertyAsync(int imageId)
        {
            return await _context.PropertyImages
                .Include(img => img.Property)
                .FirstOrDefaultAsync(img => img.Id == imageId);
        }

        /// <summary>
        /// Delete a property image
        /// </summary>
        public async Task DeleteImageAsync(int imageId)
        {
            var image = await _context.PropertyImages.FindAsync(imageId);

            if (image != null)
            {
                // Delete from storage if needed
                try
                {
                    var webRootPath = "wwwroot"; // Configure this via DI if needed
                    var filePath = Path.Combine(webRootPath, image.ImageUrl.TrimStart('/'));

                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                    }
                }
                catch (Exception ex)
                {
                    // Log but don't fail the database deletion
                    Console.WriteLine($"Warning: Could not delete image file: {ex.Message}");
                }

                _context.PropertyImages.Remove(image);
                await _context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Set an image as primary for a property
        /// </summary>
        public async Task SetPrimaryImageAsync(int imageId, int propertyId)
        {
            // Get all images for this property
            var allImages = await _context.PropertyImages
                .Where(img => img.PropertyId == propertyId)
                .ToListAsync();

            // Remove primary flag from all images
            foreach (var img in allImages)
            {
                img.IsPrimary = false;
            }

            // Set the selected image as primary
            var targetImage = allImages.FirstOrDefault(img => img.Id == imageId);
            if (targetImage != null)
            {
                targetImage.IsPrimary = true;
                targetImage.DisplayOrder = 0; // Move to front

                // Reorder other images
                int order = 1;
                foreach (var img in allImages.Where(img => img.Id != imageId))
                {
                    img.DisplayOrder = order++;
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task UpdatePropertyAmenitiesAsync(int propertyId, List<int> amenityIds)
        {
            // 1. Remove existing amenities for this property
            var existingLinks = await _context.PropertyAmenities
                .Where(pa => pa.PropertyId == propertyId)
                .ToListAsync();

            if (existingLinks.Any())
            {
                _context.PropertyAmenities.RemoveRange(existingLinks);
            }

            // 2. Validate IDs: Only select IDs that actually exist in the Amenities table
            // This PREVENTS the 500 Foreign Key Error
            var validAmenityIds = await _context.Amenities
                .Where(a => amenityIds.Contains(a.Id))
                .Select(a => a.Id)
                .ToListAsync();

            // 3. Add new links
            foreach (var amenityId in validAmenityIds)
            {
                await _context.PropertyAmenities.AddAsync(new PropertyAmenity
                {
                    PropertyId = propertyId,
                    AmenityId = amenityId
                });
            }

            await _context.SaveChangesAsync();
        }

        // دالة إضافية لجلب كل الـ Amenities عشان الـ Frontend يعرضهم
        public async Task<IEnumerable<Amenity>> GetAllAmenitiesAsync()
        {
            return await _context.Amenities
                .Where(a => a.IsActive)
                .ToListAsync();
        }
    }
}
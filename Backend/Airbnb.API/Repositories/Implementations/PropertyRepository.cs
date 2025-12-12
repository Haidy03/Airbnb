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

        public async Task<Property?> GetByIdAsync(int id) => await _context.Properties.FindAsync(id);

        public async Task<Property?> GetByIdWithDetailsAsync(int id)
        {
            return await _context.Properties
                .Include(p => p.Host)
                .Include(p => p.PropertyType)
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities).ThenInclude(pa => pa.Amenity)
                .Include(p => p.Reviews)
                .Include(p => p.Bookings)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        

        public async Task<IEnumerable<Property>> GetAllAsync()
        {
            return await _context.Properties
                .Include(p => p.PropertyType)
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities).ThenInclude(pa => pa.Amenity)
                .ToListAsync();
        }

        public async Task<IEnumerable<Property>> GetByHostIdAsync(string hostId)
        {
            return await _context.Properties
                .Include(p => p.PropertyType)
                .Include(p => p.Images)
                .Include(p => p.PropertyAmenities).ThenInclude(pa => pa.Amenity)
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

        public async Task<bool> ExistsAsync(int id) => await _context.Properties.AnyAsync(p => p.Id == id);

        public async Task<bool> IsHostOwnerAsync(int propertyId, string hostId)
        {
            return await _context.Properties.AnyAsync(p => p.Id == propertyId && p.HostId == hostId);
        }

        
        public async Task<PagedResult<PropertySearchResultDto>> SearchPropertiesAsync(SearchRequestDto searchDto)
        {
            var query = _context.Properties
                .Include(p => p.PropertyType)
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .AsQueryable()
                .Where(p => p.Status == PropertyStatus.Approved || p.Status == PropertyStatus.Active);


            if (!string.IsNullOrEmpty(searchDto.Location))
            {
                var loc = searchDto.Location.ToLower();
                query = query.Where(p => p.City.ToLower().Contains(loc) || p.Country.ToLower().Contains(loc));
            }

            if (searchDto.Bedrooms.HasValue && searchDto.Bedrooms.Value > 0)
            {
                query = query.Where(p => p.NumberOfBedrooms >= searchDto.Bedrooms.Value);
            }

            if (searchDto.Beds.HasValue && searchDto.Beds.Value > 0)
            {
                query = query.Where(p => p.NumberOfBeds >= searchDto.Beds.Value);
            }

            if (searchDto.Bathrooms.HasValue && searchDto.Bathrooms.Value > 0)
            {
                query = query.Where(p => p.NumberOfBathrooms >= searchDto.Bathrooms.Value);
            }

            if (searchDto.IsInstantBook.HasValue)
            {
                query = query.Where(p => p.IsInstantBook == searchDto.IsInstantBook.Value);
            }

            if (searchDto.Rating.HasValue)
            {
                query = query.Where(p => p.Reviews.Any() && p.Reviews.Average(r => r.Rating) >= searchDto.Rating.Value);
            }

            if (searchDto.GuestCount.HasValue)
                query = query.Where(p => p.MaxGuests >= searchDto.GuestCount.Value);

            if (searchDto.MinPrice.HasValue)
                query = query.Where(p => p.PricePerNight >= searchDto.MinPrice.Value);

            if (searchDto.MaxPrice.HasValue)
                query = query.Where(p => p.PricePerNight <= searchDto.MaxPrice.Value);

            if (!string.IsNullOrEmpty(searchDto.PropertyType))
            {
                var propertyType = searchDto.PropertyType.ToUpper();
                query = query.Where(p =>
                    p.PropertyType.Code == propertyType ||
                    p.PropertyType.Name.ToLower().Contains(searchDto.PropertyType.ToLower()));
            }

            if (searchDto.AmenityIds != null && searchDto.AmenityIds.Any())
            {
                foreach (var amenityId in searchDto.AmenityIds)
                {
                    query = query.Where(p => p.PropertyAmenities.Any(pa => pa.AmenityId == amenityId));
                }
            }

            if (searchDto.CheckInDate.HasValue && searchDto.CheckOutDate.HasValue)
            {
                var checkIn = searchDto.CheckInDate.Value.Date;
                var checkOut = searchDto.CheckOutDate.Value.Date;
                query = query.Where(p => !p.Bookings.Any(b =>
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.Rejected &&
                    (checkIn < b.CheckOutDate && checkOut > b.CheckInDate)
                ));
                query = query.Where(p => !p.Availabilities.Any(pa =>
                    pa.Date >= checkIn && pa.Date < checkOut && pa.IsAvailable == false
                ));
            }

            query = searchDto.SortBy?.ToLower() switch
            {
                "price_asc" => query.OrderBy(p => p.PricePerNight),
                "price_desc" => query.OrderByDescending(p => p.PricePerNight),
                "newest" => query.OrderByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.Reviews.Count)
            };

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
                    Rating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
                    TotalReviews = p.Reviews.Count,
                    ImageUrl = p.Images.FirstOrDefault(i => i.IsPrimary) != null
                        ? p.Images.FirstOrDefault(i => i.IsPrimary).ImageUrl
                        : p.Images.FirstOrDefault().ImageUrl,
                    IsGuestFavorite = p.Reviews.Count > 5 && p.Reviews.Average(r => r.Rating) > 4.8,


                    Latitude = p.Latitude,
                    Longitude = p.Longitude
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
                .Include(p => p.PropertyType)
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .Where(p => p.Status == PropertyStatus.Approved || p.Status == PropertyStatus.Active)
                .OrderByDescending(p => p.Reviews.Average(r => r.Rating))
                .Take(count)
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
                    IsGuestFavorite = p.Reviews.Count > 5 && p.Reviews.Average(r => r.Rating) > 4.8,

        
                    Latitude = p.Latitude,
                    Longitude = p.Longitude
                })
                .ToListAsync();
        }

       
        public async Task<PropertyImage?> GetImageByIdWithPropertyAsync(int imageId)
        {
            return await _context.PropertyImages.Include(img => img.Property).FirstOrDefaultAsync(img => img.Id == imageId);
        }
        public async Task DeleteImageAsync(int imageId)
        {
            var image = await _context.PropertyImages.FindAsync(imageId);
            if (image != null) { _context.PropertyImages.Remove(image); await _context.SaveChangesAsync(); }
        }
        public async Task SetPrimaryImageAsync(int imageId, int propertyId)
        {
            var allImages = await _context.PropertyImages.Where(img => img.PropertyId == propertyId).ToListAsync();
            foreach (var img in allImages) img.IsPrimary = false;
            var targetImage = allImages.FirstOrDefault(img => img.Id == imageId);
            if (targetImage != null) targetImage.IsPrimary = true;
            await _context.SaveChangesAsync();
        }
        public async Task UpdatePropertyAmenitiesAsync(int propertyId, List<int> amenityIds)
        {
            var existingLinks = await _context.PropertyAmenities.Where(pa => pa.PropertyId == propertyId).ToListAsync();
            if (existingLinks.Any()) _context.PropertyAmenities.RemoveRange(existingLinks);
            var validAmenityIds = await _context.Amenities.Where(a => amenityIds.Contains(a.Id)).Select(a => a.Id).ToListAsync();
            foreach (var amenityId in validAmenityIds) await _context.PropertyAmenities.AddAsync(new PropertyAmenity { PropertyId = propertyId, AmenityId = amenityId });
            await _context.SaveChangesAsync();
        }
        public async Task<IEnumerable<Amenity>> GetAllAmenitiesAsync()
        {
            return await _context.Amenities.Where(a => a.IsActive).ToListAsync();
        }
    }
}
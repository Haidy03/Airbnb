using Airbnb.API.DTOs.Properties;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;

namespace Airbnb.API.Services.Implementations
{
    public class PropertyService : IPropertyService
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<PropertyService> _logger;

        public PropertyService(
            IPropertyRepository propertyRepository,
            IBookingRepository bookingRepository,
            IWebHostEnvironment environment,
            ILogger<PropertyService> logger)
        {
            _propertyRepository = propertyRepository;
            _bookingRepository = bookingRepository;
            _environment = environment;
            _logger = logger;
        }

        public async Task<PropertyResponseDto> CreatePropertyAsync(string hostId, CreatePropertyDto dto)
        {
            var property = new Property
            {
                HostId = hostId,
                Title = dto.Title,
                Description = dto.Description,
                PropertyType = dto.PropertyType,
                Address = dto.Address,
                City = dto.City,
                Country = dto.Country,
                PostalCode = dto.PostalCode,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                NumberOfBedrooms = dto.NumberOfBedrooms,
                NumberOfBathrooms = dto.NumberOfBathrooms,
                MaxGuests = dto.MaxGuests,
                PricePerNight = dto.PricePerNight,
                CleaningFee = dto.CleaningFee,
                HouseRules = dto.HouseRules,
                CheckInTime = dto.CheckInTime,
                CheckOutTime = dto.CheckOutTime,
                MinimumStay = dto.MinimumStay,
                IsActive = false, // New properties start as inactive
                IsApproved = false,
                CreatedAt = DateTime.UtcNow
            };

            // Add amenities
            if (dto.AmenityIds.Any())
            {
                property.PropertyAmenities = dto.AmenityIds.Select(amenityId => new PropertyAmenity
                {
                    AmenityId = amenityId
                }).ToList();
            }

            var createdProperty = await _propertyRepository.AddAsync(property);

            return await MapToResponseDto(createdProperty);
        }

        public async Task<PropertyResponseDto> UpdatePropertyAsync(int id, string hostId, UpdatePropertyDto dto)
        {
            var property = await _propertyRepository.GetByIdWithDetailsAsync(id);

            if (property == null)
                throw new KeyNotFoundException("Property not found");

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to update this property");

            // Update only provided fields
            if (dto.Title != null) property.Title = dto.Title;
            if (dto.Description != null) property.Description = dto.Description;
            if (dto.PropertyType != null) property.PropertyType = dto.PropertyType;
            if (dto.Address != null) property.Address = dto.Address;
            if (dto.City != null) property.City = dto.City;
            if (dto.Country != null) property.Country = dto.Country;
            if (dto.PostalCode != null) property.PostalCode = dto.PostalCode;
            if (dto.Latitude.HasValue) property.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) property.Longitude = dto.Longitude.Value;
            if (dto.NumberOfBedrooms.HasValue) property.NumberOfBedrooms = dto.NumberOfBedrooms.Value;
            if (dto.NumberOfBathrooms.HasValue) property.NumberOfBathrooms = dto.NumberOfBathrooms.Value;
            if (dto.MaxGuests.HasValue) property.MaxGuests = dto.MaxGuests.Value;
            if (dto.PricePerNight.HasValue) property.PricePerNight = dto.PricePerNight.Value;
            if (dto.CleaningFee.HasValue) property.CleaningFee = dto.CleaningFee;
            if (dto.HouseRules != null) property.HouseRules = dto.HouseRules;
            if (dto.CheckInTime.HasValue) property.CheckInTime = dto.CheckInTime;
            if (dto.CheckOutTime.HasValue) property.CheckOutTime = dto.CheckOutTime;
            if (dto.MinimumStay.HasValue) property.MinimumStay = dto.MinimumStay.Value;

            property.UpdatedAt = DateTime.UtcNow;

            await _propertyRepository.UpdateAsync(property);

            return await MapToResponseDto(property);
        }

        public async Task<PropertyResponseDto?> GetPropertyByIdAsync(int id)
        {
            var property = await _propertyRepository.GetByIdWithDetailsAsync(id);

            if (property == null)
                return null;

            return await MapToResponseDto(property);
        }

        public async Task<IEnumerable<PropertyResponseDto>> GetHostPropertiesAsync(string hostId)
        {
            var properties = await _propertyRepository.GetByHostIdAsync(hostId);

            var responseDtos = new List<PropertyResponseDto>();

            foreach (var property in properties)
            {
                responseDtos.Add(await MapToResponseDto(property));
            }

            return responseDtos;
        }

        public async Task<bool> DeletePropertyAsync(int id, string hostId)
        {
            var property = await _propertyRepository.GetByIdAsync(id);

            if (property == null)
                return false;

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to delete this property");

            await _propertyRepository.DeleteAsync(id);
            return true;
        }

        public async Task<bool> TogglePropertyStatusAsync(int id, string hostId)
        {
            var property = await _propertyRepository.GetByIdAsync(id);

            if (property == null)
                return false;

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to update this property");

            property.IsActive = !property.IsActive;
            property.UpdatedAt = DateTime.UtcNow;

            await _propertyRepository.UpdateAsync(property);
            return true;
        }

        public async Task<PropertyImageDto> UploadPropertyImageAsync(int propertyId, string hostId, IFormFile file)
        {
            var property = await _propertyRepository.GetByIdWithDetailsAsync(propertyId);

            if (property == null)
                throw new KeyNotFoundException("Property not found");

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to upload images to this property");

            // Validate file
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file type");

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                throw new ArgumentException("File size exceeds 5MB");

            // Create upload directory if it doesn't exist
            var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "properties", propertyId.ToString());
            Directory.CreateDirectory(uploadPath);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create PropertyImage record
            var propertyImage = new PropertyImage
            {
                PropertyId = propertyId,
                ImageUrl = $"/uploads/properties/{propertyId}/{fileName}",
                IsPrimary = !property.Images.Any(), // First image is primary
                DisplayOrder = property.Images.Count,
                UploadedAt = DateTime.UtcNow
            };

            property.Images.Add(propertyImage);
            await _propertyRepository.UpdateAsync(property);

            return new PropertyImageDto
            {
                Id = propertyImage.Id,
                ImageUrl = propertyImage.ImageUrl,
                IsPrimary = propertyImage.IsPrimary,
                DisplayOrder = propertyImage.DisplayOrder
            };
        }

        public async Task<bool> DeletePropertyImageAsync(int imageId, string hostId)
        {
            // Implementation for deleting image
            // You'll need to add this to your repository
            throw new NotImplementedException();
        }

        public async Task<bool> SetPrimaryImageAsync(int imageId, string hostId)
        {
            // Implementation for setting primary image
            throw new NotImplementedException();
        }

        private async Task<PropertyResponseDto> MapToResponseDto(Property property)
        {
            var totalBookings = await _bookingRepository.GetTotalBookingsByPropertyIdAsync(property.Id);

            return new PropertyResponseDto
            {
                Id = property.Id,
                HostId = property.HostId,
                HostName = $"{property.Host?.FirstName} {property.Host?.LastName}".Trim(),
                Title = property.Title,
                Description = property.Description,
                PropertyType = property.PropertyType,
                Address = property.Address,
                City = property.City,
                Country = property.Country,
                PostalCode = property.PostalCode,
                Latitude = property.Latitude,
                Longitude = property.Longitude,
                NumberOfBedrooms = property.NumberOfBedrooms,
                NumberOfBathrooms = property.NumberOfBathrooms,
                MaxGuests = property.MaxGuests,
                PricePerNight = property.PricePerNight,
                CleaningFee = property.CleaningFee,
                HouseRules = property.HouseRules,
                CheckInTime = property.CheckInTime,
                CheckOutTime = property.CheckOutTime,
                MinimumStay = property.MinimumStay,
                IsActive = property.IsActive,
                IsApproved = property.IsApproved,
                AverageRating = property.AverageRating,
                TotalReviews = property.TotalReviews,
                TotalBookings = totalBookings,
                Images = property.Images.Select(img => new PropertyImageDto
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    IsPrimary = img.IsPrimary,
                    DisplayOrder = img.DisplayOrder
                }).OrderBy(img => img.DisplayOrder).ToList(),
                Amenities = property.PropertyAmenities.Select(pa => new AmenityDto
                {
                    Id = pa.Amenity.Id,
                    Name = pa.Amenity.Name,
                    Category = pa.Amenity.Category,
                    Icon = pa.Amenity.Icon
                }).ToList(),
                CreatedAt = property.CreatedAt,
                UpdatedAt = property.UpdatedAt
            };
        }
    }
}
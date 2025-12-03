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
                PropertyTypeId = dto.PropertyTypeId,
                Address = dto.Address,
                City = dto.City,
                Country = dto.Country,
                PostalCode = dto.PostalCode,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                NumberOfBedrooms = dto.NumberOfBedrooms,
                NumberOfBeds = dto.NumberOfBeds,
                NumberOfBathrooms = dto.NumberOfBathrooms,
                MaxGuests = dto.MaxGuests,
                PricePerNight = dto.PricePerNight,
                CleaningFee = dto.CleaningFee,
                HouseRules = dto.HouseRules,
                CheckInTime = dto.CheckInTime,
                CheckOutTime = dto.CheckOutTime,
                MinimumStay = dto.MinimumStay,
                HasExteriorCamera = dto.HasExteriorCamera,
                HasNoiseMonitor = dto.HasNoiseMonitor,
                HasWeapons = dto.HasWeapons,
                IsInstantBook = dto.IsInstantBook,
                IsActive = false,
                IsApproved = false,
                Status = PropertyStatus.Draft, // ✅ Set as Draft
                CurrentStep = "intro", // ✅ Initialize CurrentStep
                CreatedAt = DateTime.UtcNow
            };

            // Add amenities
            if (dto.AmenityIds != null && dto.AmenityIds.Any())
            {
                try
                {
                    property.PropertyAmenities = dto.AmenityIds.Select(amenityId => new PropertyAmenity
                    {
                        AmenityId = amenityId
                    }).ToList();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not add amenities");
                    property.PropertyAmenities = new List<PropertyAmenity>();
                }
            }

            var createdProperty = await _propertyRepository.AddAsync(property);
            createdProperty = await _propertyRepository.GetByIdWithDetailsAsync(createdProperty.Id);

            return await MapToResponseDto(createdProperty);
        }

        public async Task<PropertyResponseDto> UpdatePropertyAsync(int id, string hostId, UpdatePropertyDto dto)
        {
            var property = await _propertyRepository.GetByIdWithDetailsAsync(id);

            if (property == null)
                throw new KeyNotFoundException("Property not found");

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to update this property");

            // ✅ Update CurrentStep if provided
            if (!string.IsNullOrEmpty(dto.CurrentStep))
            {
                property.CurrentStep = dto.CurrentStep;
            }

            // --- Basic Info ---
            if (dto.Title != null) property.Title = dto.Title;
            if (dto.Description != null) property.Description = dto.Description;
            if (dto.PropertyTypeId.HasValue) property.PropertyTypeId = dto.PropertyTypeId.Value;

            // --- Location ---
            if (dto.Address != null) property.Address = dto.Address;
            if (dto.City != null) property.City = dto.City;
            if (dto.Country != null) property.Country = dto.Country;
            if (dto.PostalCode != null) property.PostalCode = dto.PostalCode;
            if (dto.Latitude.HasValue) property.Latitude = dto.Latitude.Value;
            if (dto.Longitude.HasValue) property.Longitude = dto.Longitude.Value;

            // --- Capacity (Updated with NumberOfBeds) ---
            if (dto.NumberOfBedrooms.HasValue) property.NumberOfBedrooms = dto.NumberOfBedrooms.Value;
            if (dto.NumberOfBeds.HasValue) property.NumberOfBeds = dto.NumberOfBeds.Value; // ✅
            if (dto.NumberOfBathrooms.HasValue) property.NumberOfBathrooms = dto.NumberOfBathrooms.Value;
            if (dto.MaxGuests.HasValue) property.MaxGuests = dto.MaxGuests.Value;

            // --- Pricing & Cleaning Fee (Fixed Logic) ---
            if (dto.PricePerNight.HasValue) property.PricePerNight = dto.PricePerNight.Value;

            // ✅ تصحيح: فصل منطق Cleaning Fee ليعمل بشكل مستقل
            if (dto.CleaningFee.HasValue)
            {
                property.CleaningFee = dto.CleaningFee.Value;
            }
            else if (dto.CurrentStep == "pricing") // لو المستخدم مسح القيمة في صفحة التسعير
            {
                property.CleaningFee = null;
            }

            // --- Rules & Booking ---
            if (dto.HouseRules != null) property.HouseRules = dto.HouseRules;
            if (!string.IsNullOrEmpty(dto.CheckInTime) && TimeSpan.TryParse(dto.CheckInTime, out var inTime))
            {
                property.CheckInTime = inTime;
            }
            if (!string.IsNullOrEmpty(dto.CheckOutTime) && TimeSpan.TryParse(dto.CheckOutTime, out var outTime))
            {
                property.CheckOutTime = outTime;
            }
            if (dto.MinimumStay.HasValue) property.MinimumStay = dto.MinimumStay.Value;
            if (dto.RoomType != null) property.RoomType = dto.RoomType;
            if (dto.IsInstantBook.HasValue) property.IsInstantBook = dto.IsInstantBook.Value;

            _logger.LogInformation("📥 Recieved Safety Update -> Camera: {Cam}, Noise: {Noise}, Weapon: {Wep}",
              dto.HasExteriorCamera, dto.HasNoiseMonitor, dto.HasWeapons);
            // --- Safety Details (Fixed Mapping) ---
            // ✅ تصحيح: ربط الحقول المسطحة القادمة من الـ DTO
            if (dto.HasExteriorCamera.HasValue) property.HasExteriorCamera = dto.HasExteriorCamera.Value;
            if (dto.HasNoiseMonitor.HasValue) property.HasNoiseMonitor = dto.HasNoiseMonitor.Value;
            if (dto.HasWeapons.HasValue) property.HasWeapons = dto.HasWeapons.Value;

            // --- Amenities (Independent Logic) ---
            if (dto.AmenityIds != null)
            {
                await _propertyRepository.UpdatePropertyAmenitiesAsync(id, dto.AmenityIds);
            }

            property.UpdatedAt = DateTime.UtcNow;
            await _propertyRepository.UpdateAsync(property);

            var updatedProperty = await _propertyRepository.GetByIdWithDetailsAsync(id);
            return await MapToResponseDto(updatedProperty);
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

            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("File size exceeds 5MB");

            var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "properties", propertyId.ToString());

            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
                _logger.LogInformation("📁 Created upload directory: {Path}", uploadPath);
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            try
            {
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                _logger.LogInformation("✅ Image saved to: {Path}", filePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to save image to: {Path}", filePath);
                throw new Exception($"Failed to save image: {ex.Message}");
            }

            var propertyImage = new PropertyImage
            {
                PropertyId = propertyId,
                ImageUrl = $"/uploads/properties/{propertyId}/{fileName}",
                IsPrimary = !property.Images.Any(),
                DisplayOrder = property.Images.Count,
                UploadedAt = DateTime.UtcNow
            };

            property.Images.Add(propertyImage);

            try
            {
                await _propertyRepository.UpdateAsync(property);
                _logger.LogInformation("✅ Image record saved to database");
            }
            catch (Exception ex)
            {
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogWarning("🗑️ Deleted uploaded file due to database error");
                }
                throw new Exception($"Failed to save image record: {ex.Message}");
            }

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
            try
            {
                var image = await _propertyRepository.GetImageByIdWithPropertyAsync(imageId);

                if (image == null)
                    return false;

                if (image.Property.HostId != hostId)
                    throw new UnauthorizedAccessException("You are not authorized to delete this image");

                await _propertyRepository.DeleteImageAsync(imageId);

                _logger.LogInformation("✅ Image {ImageId} deleted by host {HostId}", imageId, hostId);
                return true;
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting property image {ImageId}", imageId);
                throw;
            }
        }

        public async Task<bool> SetPrimaryImageAsync(int imageId, string hostId)
        {
            try
            {
                var image = await _propertyRepository.GetImageByIdWithPropertyAsync(imageId);

                if (image == null)
                    return false;

                if (image.Property.HostId != hostId)
                    throw new UnauthorizedAccessException("You are not authorized to update this image");

                await _propertyRepository.SetPrimaryImageAsync(imageId, image.PropertyId);

                _logger.LogInformation("✅ Primary image set: {ImageId} for property {PropertyId}",
                    imageId, image.PropertyId);
                return true;
            }
            catch (UnauthorizedAccessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image {ImageId}", imageId);
                throw;
            }
        }

        public async Task<bool> SubmitForApprovalAsync(int id, string hostId)
        {
            var property = await _propertyRepository.GetByIdWithDetailsAsync(id);

            if (property == null)
                return false;

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to submit this property");

            // ✅ Validate أن الـ property مكتملة
            var validationErrors = new List<string>();

            if (string.IsNullOrEmpty(property.Title) || property.Title == "Untitled Listing")
                validationErrors.Add("Property title is required");

            if (property.Images == null || !property.Images.Any())
                validationErrors.Add("At least one image is required");

            if (property.PricePerNight <= 0)
                validationErrors.Add("Valid price per night is required");

            if (string.IsNullOrEmpty(property.City) || property.City == "Draft City")
                validationErrors.Add("Valid location is required");

            if (validationErrors.Any())
            {
                throw new InvalidOperationException(
                    $"Property is not ready to submit: {string.Join(", ", validationErrors)}");
            }

            // ✅ تغيير الـ Status
            property.Status = PropertyStatus.PendingApproval;
            property.IsActive = false;
            property.IsApproved = false;
            property.CurrentStep = null; // مسح الـ step لأنها اكتملت
            property.UpdatedAt = DateTime.UtcNow;

            await _propertyRepository.UpdateAsync(property);

            _logger.LogInformation("✅ Property {PropertyId} submitted for approval by host {HostId}", id, hostId);

            return true;
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
                PropertyType = property.PropertyType?.Name ?? "Unknown",
                PropertyTypeId = property.PropertyTypeId,
                RoomType = property.RoomType,
                Address = property.Address,
                City = property.City,
                Country = property.Country,
                PostalCode = property.PostalCode,
                Latitude = property.Latitude,
                Longitude = property.Longitude,
                NumberOfBedrooms = property.NumberOfBedrooms,
                NumberOfBeds = property.NumberOfBeds,
                NumberOfBathrooms = property.NumberOfBathrooms,
                MaxGuests = property.MaxGuests,
                PricePerNight = property.PricePerNight,
                CleaningFee = property.CleaningFee,
                HouseRules = property.HouseRules,
                CheckInTime = property.CheckInTime,
                CheckOutTime = property.CheckOutTime,
                RejectionReason = property.RejectionReason,
                MinimumStay = property.MinimumStay,
                HasExteriorCamera = property.HasExteriorCamera,
                HasNoiseMonitor = property.HasNoiseMonitor,
                HasWeapons = property.HasWeapons,
                IsActive = property.IsActive,
                IsApproved = property.IsApproved,
                AverageRating = property.AverageRating,
                TotalReviews = property.TotalReviews,
                TotalBookings = totalBookings,
                IsInstantBook = property.IsInstantBook,
                CurrentStep = property.CurrentStep, // ✅ Include CurrentStep
                Status = property.Status, // ✅ Include Status
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

        public async Task<bool> PublishPropertyAsync(int id, string hostId)
        {
            var property = await _propertyRepository.GetByIdWithDetailsAsync(id);

            if (property == null)
                return false;

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to publish this property");

            // ✅ Validate property is complete before publishing
            var validationErrors = new List<string>();

            if (string.IsNullOrEmpty(property.Title) || property.Title == "Untitled Listing")
                validationErrors.Add("Property title is required");

            if (property.Images == null || !property.Images.Any())
                validationErrors.Add("At least one image is required");

            if (property.PricePerNight <= 0)
                validationErrors.Add("Valid price per night is required");

            if (validationErrors.Any())
            {
                _logger.LogWarning("Property {PropertyId} cannot be published: {Errors}",
                    id, string.Join(", ", validationErrors));
                throw new InvalidOperationException(
                    $"Property is not ready to publish: {string.Join(", ", validationErrors)}");
            }

            // ✅ تغيير الحالة إلى PendingApproval بدلاً من Active مباشرة
            property.Status = PropertyStatus.PendingApproval;
            property.IsActive = false; // لن تكون مفعلة حتى موافقة Admin
            property.IsApproved = false;
            property.CurrentStep = null; // مسح الـ step لأنها اكتملت
            property.UpdatedAt = DateTime.UtcNow;

            await _propertyRepository.UpdateAsync(property);

            _logger.LogInformation("✅ Property {PropertyId} published by host {HostId}", id, hostId);

            return true;
        }

        // في ملف PropertyService.cs

        public async Task<bool> UnpublishPropertyAsync(int id, string hostId)
        {
            var property = await _propertyRepository.GetByIdAsync(id);

            if (property == null)
                return false;

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to unpublish this property");

            // ✅ التصحيح: التحقق من IsActive بدلاً من Status فقط
            // إذا كان العقار غير مفعل أصلاً، لا داعي لإلغاء تفعيله
            if (!property.IsActive)
            {
                throw new InvalidOperationException("Property is already inactive");
            }

            property.IsActive = false;
            property.Status = PropertyStatus.Inactive;
            property.UpdatedAt = DateTime.UtcNow;

            await _propertyRepository.UpdateAsync(property);

            _logger.LogInformation("Property {PropertyId} unpublished by host {HostId}", id, hostId);

            return true;
        }

        // ✅ دالة جديدة لتفعيل property بعد موافقة Admin
        public async Task<bool> ActivatePropertyAsync(int id, string hostId)
        {
            var property = await _propertyRepository.GetByIdAsync(id);

            if (property == null)
                return false;

            if (property.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to activate this property");

            
            if (property.Status != PropertyStatus.Approved && property.Status != PropertyStatus.Inactive)
            {
                throw new InvalidOperationException("Property must be approved by admin or previously active before activation");
            }

            property.IsActive = true;
            property.Status = PropertyStatus.Active;
            property.UpdatedAt = DateTime.UtcNow;

            await _propertyRepository.UpdateAsync(property);

            _logger.LogInformation("✅ Property {PropertyId} activated by host {HostId}", id, hostId);

            return true;
        }

        public async Task<IEnumerable<AmenityDto>> GetAmenitiesListAsync()
        {
            var amenities = await _propertyRepository.GetAllAmenitiesAsync();

            return amenities.Select(a => new AmenityDto
            {
                Id = a.Id,
                Name = a.Name,
                Icon = a.Icon,
                Category = a.Category
            });
        }
    }
}
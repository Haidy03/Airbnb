using Airbnb.API.DTOs.Experiences;
using Airbnb.API.DTOs.Review;
using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using CreateReviewDto = Airbnb.API.DTOs.Review.CreateReviewDto;
using UpdateReviewDto = Airbnb.API.DTOs.Review.UpdateReviewDto;

namespace Airbnb.API.Services.Implementations
{
    public class ExperienceService : IExperienceService
    {
        private readonly IExperienceRepository _experienceRepository;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ExperienceService> _logger;

        public ExperienceService(
            IExperienceRepository experienceRepository,
            IWebHostEnvironment environment,
            ILogger<ExperienceService> logger)
        {
            _experienceRepository = experienceRepository;
            _environment = environment;
            _logger = logger;
        }

        public async Task<ExperienceDto> CreateExperienceAsync(string hostId, CreateExperienceDto dto)
        {
            if (Enum.TryParse<ExperienceType>(dto.Type, out var experienceType))
            {
                if (experienceType == ExperienceType.InPerson || experienceType == ExperienceType.Adventure)
                {
                    if (string.IsNullOrEmpty(dto.City) || string.IsNullOrEmpty(dto.Country))
                    {
                        throw new ArgumentException("Location is required for in-person and adventure experiences");
                    }
                }
            }

            var experience = new Experience
            {
                HostId = hostId,
                Title = dto.Title,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                Type = experienceType,
                Address = dto.Address,
                City = dto.City,
                Country = dto.Country,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                DurationHours = dto.DurationHours,
                DurationMinutes = dto.DurationMinutes,
                MinGroupSize = dto.MinGroupSize,
                MaxGroupSize = dto.MaxGroupSize,
                PricePerPerson = dto.PricePerPerson,
                PricingType = dto.PricingType,
                AgeRequirement = dto.AgeRequirement,
                SkillLevel = dto.SkillLevel,
                WhatToBring = dto.WhatToBring,
                WhatIsIncluded = dto.WhatIsIncluded,
                CancellationPolicy = dto.CancellationPolicy ?? "Free cancellation up to 24 hours before the experience starts",
                Status = ExperienceStatus.Draft,
                IsActive = false,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.LanguageCodes != null && dto.LanguageCodes.Any())
            {
                experience.Languages = dto.LanguageCodes.Select(code => new ExperienceLanguage
                {
                    LanguageCode = code,
                    LanguageName = GetLanguageName(code)
                }).ToList();
            }

            var createdExperience = await _experienceRepository.AddAsync(experience);
            return await MapToDto(await _experienceRepository.GetByIdWithDetailsAsync(createdExperience.Id));
        }

        public async Task<ExperienceDto> UpdateExperienceAsync(int id, string hostId, UpdateExperienceDto dto)
        {
            var experience = await _experienceRepository.GetByIdWithDetailsAsync(id);

            if (experience == null)
                throw new KeyNotFoundException("Experience not found");

            if (experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to update this experience");

            if (dto.Title != null) experience.Title = dto.Title;
            if (dto.Description != null) experience.Description = dto.Description;
            if (dto.CategoryId.HasValue) experience.CategoryId = dto.CategoryId.Value;

            if (dto.Type != null && Enum.TryParse<ExperienceType>(dto.Type, out var type))
                experience.Type = type;

            if (dto.Address != null) experience.Address = dto.Address;
            if (dto.City != null) experience.City = dto.City;
            if (dto.Country != null) experience.Country = dto.Country;
            if (dto.Latitude.HasValue) experience.Latitude = dto.Latitude;
            if (dto.Longitude.HasValue) experience.Longitude = dto.Longitude;

            if (dto.DurationHours.HasValue) experience.DurationHours = dto.DurationHours.Value;
            if (dto.DurationMinutes.HasValue) experience.DurationMinutes = dto.DurationMinutes;

            if (dto.MinGroupSize.HasValue) experience.MinGroupSize = dto.MinGroupSize.Value;
            if (dto.MaxGroupSize.HasValue) experience.MaxGroupSize = dto.MaxGroupSize.Value;

            if (dto.PricePerPerson.HasValue) experience.PricePerPerson = dto.PricePerPerson.Value;
            if (dto.PricingType != null) experience.PricingType = dto.PricingType;

            if (dto.AgeRequirement != null) experience.AgeRequirement = dto.AgeRequirement;
            if (dto.SkillLevel != null) experience.SkillLevel = dto.SkillLevel;
            if (dto.WhatToBring != null) experience.WhatToBring = dto.WhatToBring;
            if (dto.WhatIsIncluded != null) experience.WhatIsIncluded = dto.WhatIsIncluded;
            if (dto.CancellationPolicy != null) experience.CancellationPolicy = dto.CancellationPolicy;

            experience.UpdatedAt = DateTime.UtcNow;

            await _experienceRepository.UpdateAsync(experience);

            return await MapToDto(await _experienceRepository.GetByIdWithDetailsAsync(id));
        }

        public async Task<ExperienceDto?> GetExperienceByIdAsync(int id)
        {
            var experience = await _experienceRepository.GetByIdWithDetailsAsync(id);
            return experience != null ? await MapToDto(experience) : null;
        }

        public async Task<IEnumerable<ExperienceDto>> GetHostExperiencesAsync(string hostId)
        {
            var experiences = await _experienceRepository.GetByHostIdAsync(hostId);
            var dtos = new List<ExperienceDto>();

            foreach (var exp in experiences)
            {
                dtos.Add(await MapToDto(exp));
            }

            return dtos;
        }

        public async Task<bool> DeleteExperienceAsync(int id, string hostId)
        {
            var experience = await _experienceRepository.GetByIdAsync(id);

            if (experience == null)
                return false;

            if (experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to delete this experience");

            await _experienceRepository.DeleteAsync(id);
            return true;
        }

        public async Task<PagedResult<ExperienceSearchResultDto>> SearchExperiencesAsync(ExperienceSearchDto dto)
        {
            return await _experienceRepository.SearchExperiencesAsync(dto);
        }

        public async Task<List<ExperienceSearchResultDto>> GetFeaturedExperiencesAsync(int count = 8)
        {
            return await _experienceRepository.GetFeaturedExperiencesAsync(count);
        }

        public async Task<List<ExperienceCategory>> GetCategoriesAsync()
        {
            return await _experienceRepository.GetCategoriesAsync();
        }

        public async Task<ExperienceImageDto> UploadImageAsync(int experienceId, string hostId, IFormFile file)
        {
            var experience = await _experienceRepository.GetByIdWithDetailsAsync(experienceId);

            if (experience == null)
                throw new KeyNotFoundException("Experience not found");

            if (experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to upload images to this experience");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file type");

            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("File size exceeds 5MB");

            var uploadPath = Path.Combine(_environment.WebRootPath, "uploads", "experiences", experienceId.ToString());

            if (!Directory.Exists(uploadPath))
            {
                Directory.CreateDirectory(uploadPath);
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var experienceImage = new ExperienceImage
            {
                ExperienceId = experienceId,
                ImageUrl = $"/uploads/experiences/{experienceId}/{fileName}",
                IsPrimary = !experience.Images.Any(),
                DisplayOrder = experience.Images.Count,
                UploadedAt = DateTime.UtcNow
            };

            experience.Images.Add(experienceImage);
            await _experienceRepository.UpdateAsync(experience);

            return new ExperienceImageDto
            {
                Id = experienceImage.Id,
                ImageUrl = experienceImage.ImageUrl,
                IsPrimary = experienceImage.IsPrimary,
                DisplayOrder = experienceImage.DisplayOrder
            };
        }

        public async Task<bool> DeleteAvailabilityAsync(int availabilityId, string hostId)
        {
            // 1. جلب الموعد
            var availability = await _experienceRepository.GetAvailabilityByIdAsync(availabilityId);

            if (availability == null)
                return false;

            // 2. التأكد من أن الهوست هو صاحب التجربة
            // (نحتاج نتأكد ان الـ Experience loaded، الدالة GetAvailabilityByIdAsync في الريبوزيتوري بتعمل Include للـ Experience)
            if (availability.Experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to delete this schedule");

            // 3. الحذف
            await _experienceRepository.DeleteAvailabilityAsync(availabilityId);
            return true;
        }

        public async Task<bool> DeleteImageAsync(int imageId, string hostId)
        {
            var image = await _experienceRepository.GetImageByIdAsync(imageId);

            if (image == null)
                return false;

            if (image.Experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to delete this image");

            await _experienceRepository.DeleteImageAsync(imageId);
            return true;
        }

        public async Task<bool> SetPrimaryImageAsync(int imageId, string hostId)
        {
            var image = await _experienceRepository.GetImageByIdAsync(imageId);

            if (image == null)
                return false;

            if (image.Experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to update this image");

            await _experienceRepository.SetPrimaryImageAsync(imageId, image.ExperienceId);
            return true;
        }

        public async Task<ExperienceBookingDto> BookExperienceAsync(int experienceId, string guestId, BookExperienceDto dto)
        {
            // 1. التأكد من وجود التجربة
            var experience = await _experienceRepository.GetByIdWithDetailsAsync(experienceId);
            if (experience == null)
                throw new KeyNotFoundException("Experience not found");

            // 2. التأكد من وجود الموعد (Availability)
            var availability = await _experienceRepository.GetAvailabilityByIdAsync(dto.AvailabilityId);
            if (availability == null)
                throw new KeyNotFoundException("Availability slot not found");

            // 3. التحقق من صلاحية الموعد
            if (!availability.IsAvailable)
                throw new InvalidOperationException("This time slot is no longer available");

            if (availability.AvailableSpots < dto.NumberOfGuests)
                throw new InvalidOperationException($"Only {availability.AvailableSpots} spots available");

            if (dto.NumberOfGuests < experience.MinGroupSize || dto.NumberOfGuests > experience.MaxGroupSize)
                throw new InvalidOperationException($"Group size must be between {experience.MinGroupSize} and {experience.MaxGroupSize}");

            // منع الحجز المكرر
            var userBookings = await _experienceRepository.GetBookingsByGuestIdAsync(guestId);
            var existingBooking = userBookings.FirstOrDefault(b =>
                b.AvailabilityId == dto.AvailabilityId &&
                b.Status != ExperienceBookingStatus.Cancelled);

            if (existingBooking != null)
            {
                throw new InvalidOperationException("You have already booked this time slot.");
            }

            // 4. الحجز
            var totalPrice = experience.PricePerPerson * dto.NumberOfGuests;

            var booking = new ExperienceBooking
            {
                ExperienceId = experienceId,
                AvailabilityId = dto.AvailabilityId,
                GuestId = guestId,
                NumberOfGuests = dto.NumberOfGuests,
                PricePerPerson = experience.PricePerPerson,
                TotalPrice = totalPrice,
                Status = ExperienceBookingStatus.Confirmed,
                SpecialRequests = dto.SpecialRequests,
                CreatedAt = DateTime.UtcNow,
                ConfirmedAt = DateTime.UtcNow
            };

            var createdBooking = await _experienceRepository.AddBookingAsync(booking);

            // تحديث الأماكن المتاحة
            availability.AvailableSpots -= dto.NumberOfGuests;
            if (availability.AvailableSpots <= 0)
            {
                availability.IsAvailable = false;
            }
            await _experienceRepository.UpdateAvailabilityAsync(availability);

            // جلب الحجز المحفوظ مع كافة العلاقات
            var savedBooking = await _experienceRepository.GetBookingByIdAsync(createdBooking.Id);

            return await MapBookingToDto(savedBooking);
        }

        public async Task<List<ExperienceBookingDto>> GetGuestBookingsAsync(string guestId)
        {
            var bookings = await _experienceRepository.GetBookingsByGuestIdAsync(guestId);
            var bookingDtos = new List<ExperienceBookingDto>();

            foreach (var booking in bookings)
            {
                bookingDtos.Add(await MapBookingToDto(booking));
            }
            return bookingDtos;
        }

        public async Task<bool> CancelBookingAsync(int bookingId, string userId)
        {
            var booking = await _experienceRepository.GetBookingByIdAsync(bookingId);
            if (booking == null) return false;

            if (booking.GuestId != userId && booking.Experience.HostId != userId)
                throw new UnauthorizedAccessException("Not authorized");

            // ✅ شرط الـ 24 ساعة
            // booking.Availability.Date هو تاريخ التجربة
            if (booking.GuestId == userId && booking.Availability.Date < DateTime.UtcNow.AddHours(24))
            {
                throw new InvalidOperationException("Cannot cancel less than 24 hours before experience starts.");
            }

            booking.Status = ExperienceBookingStatus.Cancelled;

            // إرجاع المقاعد المتاحة
            var availability = booking.Availability;
            availability.AvailableSpots += booking.NumberOfGuests;
            await _experienceRepository.UpdateAvailabilityAsync(availability);

            await _experienceRepository.UpdateBookingAsync(booking);
            return true;
        }

        public async Task<List<ExperienceAvailabilityDto>> GetAvailabilitiesAsync(int experienceId, DateTime? startDate, DateTime? endDate)
        {
            var availabilities = await _experienceRepository.GetAvailabilitiesAsync(experienceId, startDate, endDate);

            return availabilities.Select(a => new ExperienceAvailabilityDto
            {
                Id = a.Id,
                ExperienceId = a.ExperienceId,
                Date = a.Date,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                AvailableSpots = a.AvailableSpots,
                IsAvailable = a.IsAvailable,
                CustomPrice = a.CustomPrice,
                CreatedAt = a.CreatedAt
            }).ToList();
        }

        public async Task<bool> SubmitForApprovalAsync(int id, string hostId)
        {
            var experience = await _experienceRepository.GetByIdWithDetailsAsync(id);

            if (experience == null)
                return false;

            if (experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to submit this experience");

            var validationErrors = new List<string>();

            if (string.IsNullOrEmpty(experience.Title))
                validationErrors.Add("Title is required");

            if (!experience.Images.Any())
                validationErrors.Add("At least one image is required");

            if (experience.PricePerPerson <= 0)
                validationErrors.Add("Valid price is required");

            if (validationErrors.Any())
                throw new InvalidOperationException($"Experience is not complete: {string.Join(", ", validationErrors)}");

            experience.Status = ExperienceStatus.PendingApproval;
            experience.IsActive = false;
            experience.UpdatedAt = DateTime.UtcNow;

            await _experienceRepository.UpdateAsync(experience);
            return true;
        }

        public async Task<bool> ActivateExperienceAsync(int id, string hostId)
        {
            var experience = await _experienceRepository.GetByIdAsync(id);

            if (experience == null)
                return false;

            if (experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to activate this experience");

            if (experience.Status != ExperienceStatus.Approved)
                throw new InvalidOperationException("Experience must be approved before activation");

            experience.IsActive = true;
            experience.Status = ExperienceStatus.Active;
            experience.UpdatedAt = DateTime.UtcNow;

            await _experienceRepository.UpdateAsync(experience);
            return true;
        }

        public async Task<ExperienceAvailability> AddAvailabilityAsync(int experienceId, string hostId, CreateAvailabilityDto dto)
        {
            var experience = await _experienceRepository.GetByIdAsync(experienceId);

            if (experience == null)
                throw new KeyNotFoundException("Experience not found");

            if (experience.HostId != hostId)
                throw new UnauthorizedAccessException("You are not authorized to add availability to this experience");

            if (!TimeSpan.TryParse(dto.StartTime, out var startTime) ||
                !TimeSpan.TryParse(dto.EndTime, out var endTime))
            {
                throw new ArgumentException("Invalid time format. Use HH:mm:ss");
            }

            var availability = new ExperienceAvailability
            {
                ExperienceId = experienceId,
                Date = dto.Date,
                StartTime = startTime,
                EndTime = endTime,
                AvailableSpots = dto.AvailableSpots,
                IsAvailable = true,
                CustomPrice = dto.CustomPrice,
                CreatedAt = DateTime.UtcNow
            };

            await _experienceRepository.AddAvailabilityAsync(availability);
            return availability;
        }

        // Helper Methods
        private async Task<ExperienceDto> MapToDto(Experience experience)
        {
            if (experience == null) return null;
            var validBookingsCount = experience.Bookings?
                .Count(b => b.Status == ExperienceBookingStatus.Confirmed ||
                            b.Status == ExperienceBookingStatus.Completed) ?? 0;

            return new ExperienceDto
            {
                Id = experience.Id,
                Title = experience.Title ?? "Untitled",
                Description = experience.Description,
                HostId = experience.HostId,
                TotalBookings = validBookingsCount,

                HostName = experience.Host != null
                    ? $"{experience.Host.FirstName} {experience.Host.LastName}"
                    : "Unknown Host",
                HostAvatar = experience.Host?.ProfileImageUrl,
                IsHostVerified = experience.Host?.IsVerified ?? false,

                CategoryName = experience.Category?.Name ?? "Uncategorized",
                CategoryIcon = experience.Category?.Icon ?? "🔖",

                Type = experience.Type.ToString(),
                City = experience.City,
                Country = experience.Country,
                Latitude = experience.Latitude,
                Longitude = experience.Longitude,
                DurationHours = experience.DurationHours,
                DurationMinutes = experience.DurationMinutes,
                MinGroupSize = experience.MinGroupSize,
                MaxGroupSize = experience.MaxGroupSize,
                PricePerPerson = experience.PricePerPerson,
                PricingType = experience.PricingType,
                AgeRequirement = experience.AgeRequirement,
                SkillLevel = experience.SkillLevel,
                WhatToBring = experience.WhatToBring,
                WhatIsIncluded = experience.WhatIsIncluded,
                CancellationPolicy = experience.CancellationPolicy,
                AverageRating = experience.AverageRating,
                TotalReviews = experience.TotalReviews,

                Images = experience.Images?.Select(i => new ExperienceImageDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    IsPrimary = i.IsPrimary,
                    DisplayOrder = i.DisplayOrder
                }).OrderBy(i => i.DisplayOrder).ToList() ?? new List<ExperienceImageDto>(),

                Languages = experience.Languages?.Select(l => new LanguageDto
                {
                    LanguageCode = l.LanguageCode,
                    LanguageName = l.LanguageName
                }).ToList() ?? new List<LanguageDto>(),

                Status = experience.Status.ToString(),
                RejectionReason = experience.RejectionReason,
                IsActive = experience.IsActive,
                CreatedAt = experience.CreatedAt,
                UpdatedAt = experience.UpdatedAt
            };
        }

        private async Task<ExperienceBookingDto> MapBookingToDto(ExperienceBooking booking)
        {
            if (booking == null) return null;

            return new ExperienceBookingDto
            {
                Id = booking.Id,
                ExperienceId = booking.ExperienceId,

                ExperienceTitle = booking.Experience?.Title ?? "Unknown Title",

                ExperienceImage = booking.Experience?.Images?.FirstOrDefault(i => i.IsPrimary)?.ImageUrl
                                  ?? booking.Experience?.Images?.FirstOrDefault()?.ImageUrl
                                  ?? "assets/default-experience.jpg", // صورة افتراضية

                GuestId = booking.GuestId,

                // التحقق من أن Guest ليس Null
                GuestName = booking.Guest != null
                            ? $"{booking.Guest.FirstName} {booking.Guest.LastName}"
                            : "Unknown Guest",

                // التحقق من أن Availability ليست Null
                Date = booking.Availability?.Date ?? DateTime.MinValue,
                StartTime = booking.Availability?.StartTime ?? TimeSpan.Zero,
                EndTime = booking.Availability?.EndTime ?? TimeSpan.Zero,

                NumberOfGuests = booking.NumberOfGuests,
                PricePerPerson = booking.PricePerPerson,
                TotalPrice = booking.TotalPrice,
                Status = booking.Status.ToString(),
                SpecialRequests = booking.SpecialRequests,
                CreatedAt = booking.CreatedAt,
                ConfirmedAt = booking.ConfirmedAt,
                AvailabilityId = booking.AvailabilityId
            };
        }
        public async Task<bool> ApproveExperienceAsync(int id)
        {
            var experience = await _experienceRepository.GetByIdAsync(id);
            if (experience == null) return false;

            experience.Status = ExperienceStatus.Approved;
            experience.ApprovedAt = DateTime.UtcNow;
            await _experienceRepository.UpdateAsync(experience);
            return true;
        }

        private string GetLanguageName(string code)
        {
            return code.ToLower() switch
            {
                "en" => "English",
                "ar" => "Arabic",
                "fr" => "French",
                "es" => "Spanish",
                "de" => "German",
                "it" => "Italian",
                _ => code
            };
        }

        public async Task<ExperienceReviewDto> AddReviewAsync(string guestId, CreateReviewDto dto)
        {
            var booking = await _experienceRepository.GetBookingByIdAsync(dto.BookingId);

            if (booking == null)
                throw new KeyNotFoundException("Booking not found");

            if (booking.GuestId != guestId)
                throw new UnauthorizedAccessException("You can only review your own bookings");

            var existingReview = await _experienceRepository.ReviewExistsAsync(dto.BookingId);

            if (existingReview)
                throw new InvalidOperationException("You have already reviewed this experience");

            var review = new ExperienceReview
            {
                ExperienceId = booking.ExperienceId,
                ExperienceBookingId = booking.Id,
                ReviewerId = guestId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CleanlinessRating = dto.CleanlinessRating,
                CommunicationRating = dto.CommunicationRating,
                LocationRating = dto.LocationRating,
                ValueRating = dto.ValueRating,
                CreatedAt = DateTime.UtcNow
            };

            await _experienceRepository.AddReviewAsync(review);

            var user = await _experienceRepository.GetUserByIdAsync(guestId);

            return new ExperienceReviewDto
            {
                Id = review.Id,
                ExperienceId = review.ExperienceId,
                ReviewerName = user != null ? $"{user.FirstName} {user.LastName}" : "Guest",
                ReviewerProfileImage = user?.ProfileImageUrl,
                ReviewerId = guestId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }

        public async Task<List<ExperienceReviewDto>> GetReviewsByExperienceIdAsync(int experienceId)
        {
            var reviews = await _experienceRepository.GetReviewsByExperienceIdAsync(experienceId);

            return reviews.Select(r => new ExperienceReviewDto
            {
                Id = r.Id,
                ReviewerName = r.Reviewer != null ? $"{r.Reviewer.FirstName} {r.Reviewer.LastName}" : "Guest",
                ReviewerProfileImage = r.Reviewer?.ProfileImageUrl,
                ReviewerId = r.ReviewerId,
                Rating = r.Rating,
                Comment = r.Comment,
                CleanlinessRating = r.CleanlinessRating,
                CommunicationRating = r.CommunicationRating,
                LocationRating = r.LocationRating,
                ValueRating = r.ValueRating,
                CreatedAt = r.CreatedAt
            }).ToList();
        }
        
        public async Task<List<ExperienceDto>> GetAllExperiencesAsync(string? status, string? searchTerm, int pageNumber, int pageSize)
        {
            // نبدأ الاستعلام
            var query = _experienceRepository.GetQueryable(); // سنحتاج إضافة دالة GetQueryable في الريبوزيتوري أو استخدام Context مباشرة لو متاح

            // ✅ فلترة حسب الحالة
            if (!string.IsNullOrEmpty(status) && status != "All")
            {
                if (Enum.TryParse<ExperienceStatus>(status, true, out var parsedStatus))
                {
                    query = query.Where(e => e.Status == parsedStatus);
                }
                else if (status == "PendingApproval") // Frontend sends "PendingApproval"
                {
                    query = query.Where(e => e.Status == ExperienceStatus.PendingApproval);
                }
            }

            // ✅ بحث بالنص
            if (!string.IsNullOrEmpty(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(e =>
                    e.Title.ToLower().Contains(searchTerm) ||
                    e.City.ToLower().Contains(searchTerm) ||
                    e.Host.FirstName.ToLower().Contains(searchTerm) ||
                    e.Host.LastName.ToLower().Contains(searchTerm)
                );
            }

            // ✅ ترتيب وتقسيم الصفحات
            var experiences = await query
                .Include(e => e.Host)
                .Include(e => e.Category)
                .Include(e => e.Images)
                .OrderByDescending(e => e.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // تحويل لـ DTO
            var dtos = new List<ExperienceDto>();
            foreach (var exp in experiences)
            {
                dtos.Add(await MapToDto(exp));
            }
            return dtos;
        }
        public async Task<bool> UpdateStatusAsync(int id, ExperienceStatus status)
        {
            var experience = await _experienceRepository.GetByIdAsync(id);
            if (experience == null) return false;

            experience.Status = status;

            // لو رجعناها Pending، ممكن نمسح سبب الرفض عشان ينظف
            if (status == ExperienceStatus.PendingApproval)
            {
                experience.RejectionReason = null;
                experience.IsActive = false;
            }

            experience.UpdatedAt = DateTime.UtcNow;

            await _experienceRepository.UpdateAsync(experience);
            return true;
        }
        public async Task<bool> RejectExperienceAsync(int id, string reason)
        {
            var experience = await _experienceRepository.GetByIdAsync(id);
            if (experience == null) return false;

            experience.Status = ExperienceStatus.Rejected;
            experience.RejectionReason = reason;
            experience.UpdatedAt = DateTime.UtcNow;
            experience.IsActive = false;

            await _experienceRepository.UpdateAsync(experience);
            return true;
        }

        // ✅ دوال جديدة للتحكم في ريفيوهات التجارب

        public async Task<ExperienceReviewDto?> GetReviewByIdAsync(int reviewId)
        {
            var review = await _experienceRepository.GetReviewByIdAsync(reviewId);
            if (review == null) return null;

            return new ExperienceReviewDto
            {
                Id = review.Id,
                ExperienceId = review.ExperienceId,
                ReviewerName = review.Reviewer != null ? $"{review.Reviewer.FirstName} {review.Reviewer.LastName}" : "Guest",
                ReviewerProfileImage = review.Reviewer?.ProfileImageUrl,
                ReviewerId = review.ReviewerId,
                Rating = review.Rating,
                CleanlinessRating = review.CleanlinessRating,
                CommunicationRating = review.CommunicationRating,
                LocationRating = review.LocationRating,
                ValueRating = review.ValueRating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }

        public async Task<ExperienceReviewDto> UpdateReviewAsync(int reviewId, string userId, UpdateReviewDto dto)
        {
            var review = await _experienceRepository.GetReviewByIdAsync(reviewId);
            if (review == null) throw new KeyNotFoundException("Review not found");

            if (review.ReviewerId != userId)
                throw new UnauthorizedAccessException("You are not authorized to update this review");

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;
            review.CleanlinessRating = dto.CleanlinessRating;
            review.CommunicationRating = dto.CommunicationRating;
            review.LocationRating = dto.LocationRating;
            review.ValueRating = dto.ValueRating;

            await _experienceRepository.UpdateReviewAsync(review);

            return new ExperienceReviewDto
            {
                Id = review.Id,
                ExperienceId = review.ExperienceId,
                ReviewerName = review.Reviewer != null ? $"{review.Reviewer.FirstName} {review.Reviewer.LastName}" : "Guest",
                ReviewerProfileImage = review.Reviewer?.ProfileImageUrl,
                ReviewerId = review.ReviewerId,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }

        public async Task<bool> DeleteReviewAsync(int reviewId, string userId)
        {
            var review = await _experienceRepository.GetReviewByIdAsync(reviewId);
            if (review == null) return false;

            if (review.ReviewerId != userId)
                throw new UnauthorizedAccessException("You are not authorized to delete this review");

            await _experienceRepository.DeleteReviewAsync(reviewId);
            return true;
        }

        public Task<ExperienceReviewDto> AddReviewAsync(string guestId, DTOs.Experiences.CreateReviewDto dto)
        {
            throw new NotImplementedException();
        }
    }
}
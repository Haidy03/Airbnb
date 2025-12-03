using Airbnb.API.DTOs.Review;
using Airbnb.API.DTOs.Services;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Services.Implementations
{
    public class ServicesService : IServicesService
    {
        private readonly IServiceRepository _serviceRepository;
        private readonly IWebHostEnvironment _environment;

        public ServicesService(IServiceRepository serviceRepository, IWebHostEnvironment environment)
        {
            _serviceRepository = serviceRepository;
            _environment = environment;
        }

        // 1. Get Featured Services (Guest Home)
        public async Task<List<ServiceCardDto>> GetFeaturedServicesAsync()
        {
            var services = await _serviceRepository.GetFeaturedServicesAsync();
            return services.Select(MapToCardDto).ToList();
        }

        // 2. Get Services by Category (Guest Filter)
        public async Task<List<ServiceCardDto>> GetServicesByCategoryAsync(string categoryName)
        {
            var services = await _serviceRepository.GetServicesByCategoryAsync(categoryName);
            return services.Select(MapToCardDto).ToList();
        }

        // 3. Create Service (Host)
        public async Task<bool> CreateServiceAsync(string hostId, CreateServiceDto dto)
        {

            var service = new Service
            {
                HostId = hostId,
                Title = dto.Title,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                PricePerUnit = dto.PricePerUnit,
                PricingUnit = dto.PricingUnit,
                MinimumCost = dto.MinimumCost,
                LocationType = dto.LocationType,
                City = dto.City,
                Status = ServiceStatus.PendingApproval,
                CreatedAt = DateTime.UtcNow,
                MaxGuests = dto.MaxGuests > 0 ? dto.MaxGuests : 1,
                TimeSlots = dto.TimeSlots != null ? string.Join(",", dto.TimeSlots) : null,

            };


            if (dto.Images != null && dto.Images.Count > 0)
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "services");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                foreach (var file in dto.Images)
                {
                    if (file.Length > 0)
                    {

                        var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
                        var filePath = Path.Combine(uploadsFolder, uniqueFileName);


                        using (var fileStream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(fileStream);
                        }
                        bool isCover = service.Images.Count == 0;

                        service.Images.Add(new ServiceImage
                        {
                            Url = $"uploads/services/{uniqueFileName}",
                            IsCover = isCover
                        });
                    }
                }
            }
            await _serviceRepository.AddServiceAsync(service);
            return true;
        }

        // 4. Get Service Details (Guest/Host View)
        public async Task<ServiceDetailsDto> GetServiceByIdAsync(int id)
        {
            var service = await _serviceRepository.GetServiceByIdAsync(id);
            if (service == null) return null;

            return new ServiceDetailsDto
            {
                Id = service.Id,
                Title = service.Title,
                HostName = $"{service.Host.FirstName} {service.Host.LastName}",
                HostAvatar = service.Host.ProfileImageUrl,
                PricePerUnit = service.PricePerUnit,
                PricingUnit = service.PricingUnit.ToString(),
                MinimumCost = service.MinimumCost > 0 ? service.MinimumCost : null,
                Rating = service.AverageRating,
                CategoryName = service.Category.Name,
                Description = service.Description,
                LocationType = service.LocationType.ToString(),
                City = service.City,
                CoveredAreas = service.CoveredAreas,
                Images = service.Images.Select(i => i.Url).ToList(),
                HostId = service.HostId,
                HostJoinedDate = service.Host.CreatedAt,
                MaxGuests = service.MaxGuests,
                TimeSlots = !string.IsNullOrEmpty(service.TimeSlots)
                ? service.TimeSlots.Split(',').ToList()
                : new List<string>(),
                CancellationPolicy = service.CancellationPolicy,
                GuestRequirements = service.GuestRequirements,
                Qualifications = service.Qualifications.Select(q => new ServiceQualificationDto
                {
                    Title = q.Title,
                    Description = q.Description,
                    Icon = q.Icon
                }).ToList(),
                Packages = service.Packages.Select(p => new ServicePackageDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Price = p.Price,
                    Duration = p.Duration,
                    ImageUrl = p.ImageUrl
                }).ToList()
            };
        }



        // 5. Get All Categories (Setup)
        public async Task<List<ServiceCategory>> GetAllCategoriesAsync()
        {
            return await _serviceRepository.GetAllCategoriesAsync();
        }

        // 6. Get Host Services (My Services Dashboard)
        public async Task<List<HostServiceDto>> GetHostServicesAsync(string hostId)
        {
            var services = await _serviceRepository.GetServicesByHostIdAsync(hostId);

            return services.Select(s => new HostServiceDto
            {
                Id = s.Id,
                Title = s.Title,
                HostName = s.Host != null ? $"{s.Host.FirstName} {s.Host.LastName}" : "Unknown",
                HostAvatar = s.Host?.ProfileImageUrl ?? "assets/images/placeholder-user.png",
                ImageUrl = (s.Images != null && s.Images.Any())
                    ? (s.Images.FirstOrDefault(i => i.IsCover)?.Url ?? s.Images.FirstOrDefault()?.Url)
                    : "assets/placeholder.jpg",
                PricePerUnit = s.PricePerUnit,
                PricingUnit = s.PricingUnit.ToString(),
                Status = s.Status.ToString(), // Active, Pending, Rejected
                Rating = s.AverageRating,
                CategoryName = s.Category?.Name ?? "General"
            }).ToList();
        }

        // 7. Get Pending Services (Admin Dashboard)
        public async Task<List<ServiceCardDto>> GetPendingServicesForAdminAsync()
        {
            var services = await _serviceRepository.GetPendingServicesAsync();
            return services.Select(MapToCardDto).ToList();
        }

        // 8. Approve/Reject Service (Admin Action)
        public async Task<bool> UpdateServiceStatusAsync(int serviceId, bool isApproved, string? reason)
        {
            var status = isApproved ? ServiceStatus.Active : ServiceStatus.Rejected;
            return await _serviceRepository.UpdateServiceStatusAsync(serviceId, status, reason);
        }

        // 9. Book a Service (Guest Action)
        public async Task<int> BookServiceAsync(string guestId, BookServiceDto dto)
        {
            // 1. Get Service from Repo
            var service = await _serviceRepository.GetServiceByIdAsync(dto.ServiceId);
            if (service == null) throw new Exception("Service not found");

            decimal finalPrice = service.PricePerUnit;

            // 2. If Package selected, get price from Repo
            if (dto.PackageId.HasValue)
            {
                var package = await _serviceRepository.GetPackageByIdAsync(dto.PackageId.Value);
                if (package != null)
                {
                    finalPrice = package.Price;
                }
            }
            if (service.PricingUnit == ServicePricingUnit.PerPerson)
            {
                finalPrice = finalPrice * dto.NumberOfGuests;
            }

            // 3. Create Booking Object
            var booking = new ServiceBooking
            {
                ServiceId = dto.ServiceId,
                PackageId = dto.PackageId,
                GuestId = guestId,
                BookingDate = dto.Date,
                TotalPrice = finalPrice,
                Status = "Confirmed", 
                CreatedAt = DateTime.UtcNow,
                NumberOfGuests = dto.NumberOfGuests
            };

            // 4. Save via Repo
            await _serviceRepository.AddServiceBookingAsync(booking);

            return booking.Id;
        }

        private ServiceCardDto MapToCardDto(Service s)
        {
            return new ServiceCardDto
            {
                Id = s.Id,
                Title = s.Title,
                HostName = s.Host != null ? $"{s.Host.FirstName} {s.Host.LastName}" : "Unknown",
                HostAvatar = s.Host?.ProfileImageUrl ?? "",
                ImageUrl = s.Images.FirstOrDefault(i => i.IsCover)?.Url ??
                           s.Images.FirstOrDefault()?.Url ??
                           "assets/placeholder.jpg",
                PricePerUnit = s.PricePerUnit,
                PricingUnit = s.PricingUnit.ToString(),
                MinimumCost = s.MinimumCost > 0 ? s.MinimumCost : null,
                Rating = s.AverageRating,
                CategoryName = s.Category?.Name ?? "General"
            };
        }

        public async Task<ServiceDetailsDto> GetHostServiceDetailsAsync(int id, string hostId)
        {
            var service = await _serviceRepository.GetServiceByIdForHostAsync(id);


            if (service == null || service.HostId != hostId) return null;


            return new ServiceDetailsDto
            {
                Id = service.Id,
                Title = service.Title,
                Description = service.Description,
                PricePerUnit = service.PricePerUnit,
                PricingUnit = service.PricingUnit.ToString(),
                LocationType = service.LocationType.ToString(),
                City = service.City,
                CoveredAreas = service.CoveredAreas,

                Status = service.Status.ToString(),


                Images = service.Images.Select(i => i.Url).ToList(),
                CategoryName = service.Category?.Name,
                HostId = service.HostId,
                HostJoinedDate = service.Host.CreatedAt,
                CancellationPolicy = service.CancellationPolicy,
                GuestRequirements = service.GuestRequirements,

                Qualifications = service.Qualifications.Select(q => new ServiceQualificationDto
                {
                    Title = q.Title,
                    Description = q.Description,
                    Icon = q.Icon
                }).ToList(),

                Packages = service.Packages.Select(p => new ServicePackageDto
                {
                    Title = p.Title,
                    Description = p.Description,
                    Price = p.Price,
                    Duration = p.Duration,
                    ImageUrl = p.ImageUrl
                }).ToList()
            };
        }

        // 2. Delete Logic
        public async Task<bool> DeleteServiceAsync(int id, string hostId)
        {
            var service = await _serviceRepository.GetServiceByIdForHostAsync(id);
            if (service == null || service.HostId != hostId) return false;

            await _serviceRepository.DeleteServiceAsync(service);
            return true;
        }

        // 3. Toggle Status Logic
        public async Task<bool> ToggleServiceStatusAsync(int id, string hostId)
        {
            var service = await _serviceRepository.GetServiceByIdForHostAsync(id);
            if (service == null || service.HostId != hostId) return false;

            if (service.Status == ServiceStatus.PendingApproval || service.Status == ServiceStatus.Rejected)
            {
                throw new InvalidOperationException("Cannot toggle status for pending or rejected services.");
            }

            var newStatus = service.Status == ServiceStatus.Active
                            ? ServiceStatus.Inactive
                            : ServiceStatus.Active;

            await _serviceRepository.UpdateServiceStatusAsync(id, newStatus);
            return true;
        }

        public async Task<bool> UpdateServiceAsync(int id, string hostId, UpdateServiceDto dto)
        {
            var service = await _serviceRepository.GetServiceByIdForHostAsync(id);

            if (service == null || service.HostId != hostId) return false;

            service.Title = dto.Title;
            service.Description = dto.Description;
            service.PricePerUnit = dto.PricePerUnit;
            service.MaxGuests = dto.MaxGuests;
            service.City = dto.City;
            service.LocationType = dto.LocationType;

            service.TimeSlots = dto.TimeSlots != null ? string.Join(",", dto.TimeSlots) : null;

            await _serviceRepository.UpdateServiceAsync(service);
            return true;
        }

        public async Task<ReviewResponseDto> AddReviewAsync(string userId, CreateReviewDto dto)
        {
            var booking = await _serviceRepository.GetServiceBookingByIdAsync(dto.BookingId);

            if (booking == null) throw new Exception("Booking not found");
            if (booking.GuestId != userId) throw new UnauthorizedAccessException("Not your booking");
            if (booking.Status != "Completed") throw new InvalidOperationException("Can only review completed services");

            if (await _serviceRepository.ServiceReviewExistsAsync(dto.BookingId))
                throw new InvalidOperationException("You already reviewed this service");

            var review = new ServiceReview
            {
                ServiceId = booking.ServiceId,
                ServiceBookingId = booking.Id,
                ReviewerId = userId,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CreatedAt = DateTime.UtcNow,
                CleanlinessRating = dto.CleanlinessRating,
                CommunicationRating = dto.CommunicationRating,
                LocationRating = dto.LocationRating,
                ValueRating = dto.ValueRating,
            };

            await _serviceRepository.AddServiceReviewAsync(review);

            await UpdateServiceRating(booking.ServiceId);

            return MapToReviewDto(review);
        }

        private ReviewResponseDto MapToReviewDto(ServiceReview r)
        {
            return new ReviewResponseDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Comment = r.Comment,
                ReviewerName = $"{r.Reviewer.FirstName} {r.Reviewer.LastName}",
                ReviewerProfileImage = r.Reviewer.ProfileImageUrl,
                CreatedAt = r.CreatedAt,
                ReviewType = "Service",
                PropertyTitle = r.Service?.Title 
            };
        }
        public async Task<ReviewResponseDto?> GetServiceReviewDtoByIdAsync(int reviewId)
        {
            var review = await _serviceRepository.GetServiceReviewByIdAsync(reviewId);
            if (review == null) return null;

            return new ReviewResponseDto
            {
                Id = review.Id,
                ServiceId = review.ServiceId,
                Rating = review.Rating,
                Comment = review.Comment,
                CleanlinessRating = review.CleanlinessRating,
                CommunicationRating = review.CommunicationRating,
                LocationRating = review.LocationRating,
                ValueRating = review.ValueRating,
                ReviewerId = review.ReviewerId,
            };
        }

        public async Task<List<ReviewResponseDto>> GetReviewsByServiceIdAsync(int serviceId)
        {
            var reviews = await _serviceRepository.GetReviewsByServiceIdAsync(serviceId);

            return reviews.Select(r => new ReviewResponseDto
            {
                Id = r.Id,
                ReviewerId = r.ReviewerId,
                ReviewerName = r.Reviewer != null ? $"{r.Reviewer.FirstName} {r.Reviewer.LastName}" : "Unknown",
                ReviewerProfileImage = r.Reviewer?.ProfileImageUrl,
                Rating = r.Rating,
                Comment = r.Comment,
                CleanlinessRating = r.CleanlinessRating,
                CommunicationRating = r.CommunicationRating,
                LocationRating = r.LocationRating,
                ValueRating = r.ValueRating,
                CreatedAt = r.CreatedAt,
                ReviewType = "Service",
                PropertyTitle = r.Service?.Title ?? "" 
            }).ToList();
        }

        public async Task DeleteReviewAsync(int reviewId, string userId)
        {
            var review = await _serviceRepository.GetServiceReviewByIdAsync(reviewId);
            if (review == null) throw new Exception("Review not found");

            if (review.ReviewerId != userId)
                throw new UnauthorizedAccessException("Not authorized to delete this review");

            await _serviceRepository.DeleteServiceReviewAsync(review);

            await UpdateServiceRating(review.ServiceId);
        }


        private async Task UpdateServiceRating(int serviceId)
        {
            var reviews = await _serviceRepository.GetReviewsByServiceIdAsync(serviceId);
            var service = await _serviceRepository.GetServiceByIdAsync(serviceId);

            if (service != null)
            {
                if (reviews.Any())
                {
                    service.AverageRating = reviews.Average(r => r.Rating);
                    service.ReviewCount = reviews.Count;
                }
                else
                {
                    service.AverageRating = 0;
                    service.ReviewCount = 0;
                }
                await _serviceRepository.UpdateServiceAsync(service);
            }
        }
        public async Task<ReviewResponseDto> UpdateServiceReviewAsync(int reviewId, string userId, UpdateReviewDto dto)
        {
            var review = await _serviceRepository.GetServiceReviewByIdAsync(reviewId);
            if (review == null) throw new Exception("Review not found");

            if (review.ReviewerId != userId)
                throw new UnauthorizedAccessException("Not authorized");

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;
            review.UpdatedAt = DateTime.UtcNow;

            review.CleanlinessRating = dto.CleanlinessRating;
            review.CommunicationRating = dto.CommunicationRating;
            review.LocationRating = dto.LocationRating;
            review.ValueRating = dto.ValueRating;

            await _serviceRepository.UpdateServiceReviewAsync(review);

           
            return await GetServiceReviewDtoByIdAsync(reviewId);
        }

        public async Task<bool> CancelBookingAsync(int bookingId, string userId)
        {
            var booking = await _serviceRepository.GetServiceBookingByIdAsync(bookingId);
            if (booking == null) return false;

            if (booking.GuestId != userId) 
                throw new UnauthorizedAccessException("Not authorized");

            if (booking.BookingDate < DateTime.UtcNow.AddHours(24))
            {
                throw new InvalidOperationException("Cannot cancel less than 24 hours before service time.");
            }

            booking.Status = "Cancelled";

            await _serviceRepository.UpdateServiceBookingAsync(booking);

            return true;
        }
    }
}
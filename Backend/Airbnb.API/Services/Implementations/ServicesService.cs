using Airbnb.API.DTOs.Services;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;

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
                CreatedAt = DateTime.UtcNow
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
                            Url = $"uploads/services/{uniqueFileName}", // الرابط النسبي
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
                Status = "Confirmed", // Or "PendingPayment" based on your flow
                CreatedAt = DateTime.UtcNow,
                NumberOfGuests = dto.NumberOfGuests
            };

            // 4. Save via Repo
            await _serviceRepository.AddServiceBookingAsync(booking);

            return booking.Id;
        }

        // Helper Method for Mapping Service to Card DTO
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

            // ❌ لو الخدمة لسه "قيد المراجعة" أو "مرفوضة"، مينفعش الهوست يخليها Active بمزاجه
            if (service.Status == ServiceStatus.PendingApproval || service.Status == ServiceStatus.Rejected)
            {
                throw new InvalidOperationException("Cannot toggle status for pending or rejected services.");
            }

            // ✅ التبديل: لو Active خليها Inactive والعكس
            var newStatus = service.Status == ServiceStatus.Active
                            ? ServiceStatus.Inactive
                            : ServiceStatus.Active;

            await _serviceRepository.UpdateServiceStatusAsync(id, newStatus);
            return true;
        }
    }
}
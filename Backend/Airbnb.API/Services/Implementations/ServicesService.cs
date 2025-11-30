using Airbnb.API.DTOs.Services;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;

namespace Airbnb.API.Services.Implementations
{
    public class ServicesService : IServicesService
    {
        private readonly IServiceRepository _serviceRepository;

        public ServicesService(IServiceRepository serviceRepository)
        {
            _serviceRepository = serviceRepository;
        }

        public async Task<List<ServiceCardDto>> GetFeaturedServicesAsync()
        {
            var services = await _serviceRepository.GetFeaturedServicesAsync();
            // التحويل لـ DTO يتم هنا وليس في الكنترولر
            return services.Select(MapToCardDto).ToList();
        }

        public async Task<List<ServiceCardDto>> GetServicesByCategoryAsync(string categoryName)
        {
            var services = await _serviceRepository.GetServicesByCategoryAsync(categoryName);
            return services.Select(MapToCardDto).ToList();
        }

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

            await _serviceRepository.AddServiceAsync(service);
            return true;
        }

        // Helper Method for Mapping
        private ServiceCardDto MapToCardDto(Service s)
        {
            return new ServiceCardDto
            {
                Id = s.Id,
                Title = s.Title,
                HostName = $"{s.Host.FirstName} {s.Host.LastName}",
                HostAvatar = s.Host.ProfileImageUrl,
                // نأخذ صورة الغلاف، لو مش موجودة نأخذ أول صورة
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
        public async Task<ServiceDetailsDto> GetServiceByIdAsync(int id)
        {
            var service = await _serviceRepository.GetServiceByIdAsync(id);
            if (service == null) return null;

            return new ServiceDetailsDto
            {
                // بيانات الكارت الأساسية
                Id = service.Id,
                Title = service.Title,
                HostName = $"{service.Host.FirstName} {service.Host.LastName}",
                HostAvatar = service.Host.ProfileImageUrl,
                PricePerUnit = service.PricePerUnit,
                PricingUnit = service.PricingUnit.ToString(),
                MinimumCost = service.MinimumCost > 0 ? service.MinimumCost : null,
                Rating = service.AverageRating,
                CategoryName = service.Category.Name,

                // بيانات التفاصيل الإضافية
                Description = service.Description,
                LocationType = service.LocationType.ToString(), // Mobile or OnSite
                City = service.City,
                CoveredAreas = service.CoveredAreas,
                Images = service.Images.Select(i => i.Url).ToList(),
                HostId = service.HostId,
                HostJoinedDate = service.Host.CreatedAt,
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
    }
}
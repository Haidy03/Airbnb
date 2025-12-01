using Airbnb.API.Models;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http; 

namespace Airbnb.API.DTOs.Services
{

    public class ServiceCardDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string HostName { get; set; }
        public string HostAvatar { get; set; }
        public string ImageUrl { get; set; }
        public decimal PricePerUnit { get; set; }
        public string PricingUnit { get; set; } // "guest", "hour"
        public decimal? MinimumCost { get; set; } // To show "Minimum X to book"
        public double Rating { get; set; }
        public string CategoryName { get; set; }
    }


    public class CreateServiceDto
    {
        [Required]
        public string Title { get; set; }
        [Required]
        public string Description { get; set; }
        [Required]
        public int CategoryId { get; set; }

        [Required]
        public decimal PricePerUnit { get; set; }
        [Required]
        public ServicePricingUnit PricingUnit { get; set; }

        public decimal MinimumCost { get; set; }

        [Required]
        public ServiceLocationType LocationType { get; set; }

        public string? City { get; set; }
        public List<IFormFile>? Images { get; set; }
    }


    public class ServiceDetailsDto : ServiceCardDto
    {
        public string Description { get; set; }
        public List<string> Images { get; set; }
        public string LocationType { get; set; }
        public string? CoveredAreas { get; set; }
        public string? City { get; set; }


        public string HostId { get; set; }
        public DateTime HostJoinedDate { get; set; }

        public string CancellationPolicy { get; set; }
        public string GuestRequirements { get; set; }
        public List<ServiceQualificationDto> Qualifications { get; set; }
        public List<ServicePackageDto> Packages { get; set; }
    }

    public class ServiceQualificationDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Icon { get; set; }
    }

    public class ServicePackageDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Duration { get; set; }
        public string ImageUrl { get; set; }

    }

    public class BookServiceDto
    {
        public int ServiceId { get; set; }
        public int? PackageId { get; set; }
        public DateTime Date { get; set; }
    }

    public class ApproveServiceDto
    {
        public bool IsApproved { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class HostServiceDto : ServiceCardDto
    {
        public string Status { get; set; }
        public string? RejectionReason { get; set; }

    }
}

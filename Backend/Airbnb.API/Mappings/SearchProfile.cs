using AutoMapper;
using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;

namespace Airbnb.API.Mappings
{
    public class SearchProfile : Profile
    {
        public SearchProfile()
        {
            // 1. Map Property -> PropertyDetailsDto (For the Property Details Page)
            CreateMap<Property, PropertyDetailsDto>()
                .ForMember(dest => dest.CheckInTime, opt => opt.MapFrom(src => src.CheckInTime.HasValue ? src.CheckInTime.Value.ToString(@"hh\:mm") : "14:00"))
                .ForMember(dest => dest.CheckOutTime, opt => opt.MapFrom(src => src.CheckOutTime.HasValue ? src.CheckOutTime.Value.ToString(@"hh\:mm") : "11:00"))
                .ForMember(dest => dest.Images, opt => opt.MapFrom(src => src.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl)))
                .ForMember(dest => dest.Amenities, opt => opt.MapFrom(src => src.PropertyAmenities.Select(pa => pa.Amenity)))
                .ForMember(dest => dest.Host, opt => opt.MapFrom(src => src.Host))
                .ForMember(dest => dest.Reviews, opt => opt.MapFrom(src => src.Reviews.OrderByDescending(r => r.CreatedAt).Take(5)));

            // 2. Map Helper Objects
            CreateMap<ApplicationUser, HostSummaryDto>()
                .ForMember(dest => dest.JoinedAt, opt => opt.MapFrom(src => src.CreatedAt));

            CreateMap<Amenity, AmenityDto>();

            CreateMap<Review, ReviewSummaryDto>()
                .ForMember(dest => dest.ReviewerName, opt => opt.MapFrom(src => src.Reviewer.FirstName))
                .ForMember(dest => dest.ReviewerImage, opt => opt.MapFrom(src => src.Reviewer.ProfileImageUrl));
        }
    }
}
using Airbnb.API.DTOs.Auth;
using Airbnb.API.Models;
using AutoMapper;
namespace Airbnb.API.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<UpdateProfileDto, ApplicationUser>()
                // If the frontend sends 'ProfileImage' as a string URL, map it to 'ProfileImageUrl' in DB
                .ForMember(dest => dest.ProfileImageUrl, opt => opt.Condition(src => src.ProfileImageUrl != null))
                .ForMember(dest => dest.ProfileImageUrl, opt => opt.MapFrom(src => src.ProfileImageUrl))
                // Map the rest (AutoMapper handles matching names automatically)
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
            CreateMap<ApplicationUser, UserProfileDto>();
        }
    }
}

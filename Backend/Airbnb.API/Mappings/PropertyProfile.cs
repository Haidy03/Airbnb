using Airbnb.API.DTOs.Properties;
using Airbnb.API.Models;
using AutoMapper;

public class PropertyProfile : Profile
{
    public PropertyProfile()
    {
        CreateMap<Property, PropertyResponseDto>();
        CreateMap<CreatePropertyDto, Property>();
        CreateMap<UpdatePropertyDto, Property>();
    }
}

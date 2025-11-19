using AutoMapper;
using Airbnb.API.DTOs.Search;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;

namespace Airbnb.API.Services.Implementations
{
    public class SearchService : ISearchService
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly IMapper _mapper; // Inject Mapper

        public SearchService(IPropertyRepository propertyRepository, IMapper mapper)
        {
            _propertyRepository = propertyRepository;
            _mapper = mapper;
        }

        public async Task<PagedResult<PropertySearchResultDto>> SearchAsync(SearchRequestDto searchDto)
        {
            return await _propertyRepository.SearchPropertiesAsync(searchDto);
        }

        public async Task<List<PropertySearchResultDto>> GetFeaturedAsync()
        {
            return await _propertyRepository.GetFeaturedPropertiesAsync(5);
        }

        public async Task<PropertyDetailsDto?> GetPropertyDetailsAsync(int id)
        {
            var property = await _propertyRepository.GetByIdWithDetailsAsync(id);

            if (property == null) return null;

            // THE MAGIC LINE: 
            // Convert "property" (Entity) to "PropertyDetailsDto" automatically
            return _mapper.Map<PropertyDetailsDto>(property);
        }
    }
}
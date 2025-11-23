using Airbnb.API.DTOs.Search;
using Airbnb.API.Models;

namespace Airbnb.API.Services.Interfaces
{
    public interface ISearchService
    {
        Task<PagedResult<PropertySearchResultDto>> SearchAsync(SearchRequestDto searchDto);
        Task<List<PropertySearchResultDto>> GetFeaturedAsync();
        Task<PropertyDetailsDto?> GetPropertyDetailsAsync(int id);
    }


}
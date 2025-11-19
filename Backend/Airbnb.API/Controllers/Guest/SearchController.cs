using Airbnb.API.DTOs.Search;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Airbnb.API.Controllers.Guest
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        // POST: api/Search/properties
        [HttpPost("properties")]
        public async Task<IActionResult> SearchProperties([FromBody] SearchRequestDto searchDto)
        {
            var result = await _searchService.SearchAsync(searchDto);
            return Ok(result);
        }

        // GET: api/Search/featured
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProperties()
        {
            var result = await _searchService.GetFeaturedAsync();
            return Ok(result);
        }

        // GET: api/Search/3
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPropertyDetails(int id)
        {
            var property = await _searchService.GetPropertyDetailsAsync(id);

            if (property == null)
            {
                return NotFound(new { Message = "Property not found" });
            }
            return Ok(property);
        }
    }
}
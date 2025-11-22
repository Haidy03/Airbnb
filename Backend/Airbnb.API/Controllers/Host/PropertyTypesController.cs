using Airbnb.API.DTOs.Properties;
using Airbnb.API.Models;
using AirbnbApi.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PropertyTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PropertyTypesController> _logger;

        public PropertyTypesController(
            ApplicationDbContext context,
            ILogger<PropertyTypesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all active property types
        /// GET: api/PropertyTypes
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PropertyTypeDto>>> GetAllPropertyTypes()
        {
            try
            {
                var propertyTypes = await _context.PropertyTypes
                    .Where(pt => pt.IsActive)
                    .OrderBy(pt => pt.DisplayOrder)
                    .Select(pt => new PropertyTypeDto
                    {
                        Id = pt.Id,
                        Code = pt.Code,
                        Name = pt.Name,
                        Description = pt.Description,
                        IconType = pt.IconType,
                        Category = pt.Category,
                        DisplayOrder = pt.DisplayOrder
                    })
                    .ToListAsync();

                return Ok(propertyTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property types");
                return StatusCode(500, new { message = "An error occurred while retrieving property types" });
            }
        }

        /// <summary>
        /// Get property types by category
        /// GET: api/PropertyTypes/category/RESIDENTIAL
        /// </summary>
        [HttpGet("category/{category}")]
        public async Task<ActionResult<IEnumerable<PropertyTypeDto>>> GetPropertyTypesByCategory(string category)
        {
            try
            {
                var propertyTypes = await _context.PropertyTypes
                    .Where(pt => pt.IsActive && pt.Category == category.ToUpper())
                    .OrderBy(pt => pt.DisplayOrder)
                    .Select(pt => new PropertyTypeDto
                    {
                        Id = pt.Id,
                        Code = pt.Code,
                        Name = pt.Name,
                        Description = pt.Description,
                        IconType = pt.IconType,
                        Category = pt.Category,
                        DisplayOrder = pt.DisplayOrder
                    })
                    .ToListAsync();

                return Ok(propertyTypes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property types by category: {Category}", category);
                return StatusCode(500, new { message = "An error occurred while retrieving property types" });
            }
        }

        /// <summary>
        /// Get property type by code
        /// GET: api/PropertyTypes/code/HOUSE
        /// </summary>
        [HttpGet("code/{code}")]
        public async Task<ActionResult<PropertyTypeDto>> GetPropertyTypeByCode(string code)
        {
            try
            {
                var propertyType = await _context.PropertyTypes
                    .Where(pt => pt.Code == code.ToUpper())
                    .Select(pt => new PropertyTypeDto
                    {
                        Id = pt.Id,
                        Code = pt.Code,
                        Name = pt.Name,
                        Description = pt.Description,
                        IconType = pt.IconType,
                        Category = pt.Category,
                        DisplayOrder = pt.DisplayOrder
                    })
                    .FirstOrDefaultAsync();

                if (propertyType == null)
                {
                    return NotFound(new { message = $"Property type with code '{code}' not found" });
                }

                return Ok(propertyType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property type by code: {Code}", code);
                return StatusCode(500, new { message = "An error occurred while retrieving the property type" });
            }
        }

        /// <summary>
        /// Get property type by ID
        /// GET: api/PropertyTypes/5
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PropertyTypeDto>> GetPropertyTypeById(int id)
        {
            try
            {
                var propertyType = await _context.PropertyTypes
                    .Where(pt => pt.Id == id)
                    .Select(pt => new PropertyTypeDto
                    {
                        Id = pt.Id,
                        Code = pt.Code,
                        Name = pt.Name,
                        Description = pt.Description,
                        IconType = pt.IconType,
                        Category = pt.Category,
                        DisplayOrder = pt.DisplayOrder
                    })
                    .FirstOrDefaultAsync();

                if (propertyType == null)
                {
                    return NotFound(new { message = $"Property type with ID {id} not found" });
                }

                return Ok(propertyType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving property type by ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the property type" });
            }
        }
    }
}
using Airbnb.API.DTOs.Properties;
using Airbnb.API.Services.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Host
{
    [ApiController]
    [Route("api/host/[controller]")]
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;
        private readonly ILogger<PropertyController> _logger;
        private readonly IMapper _mapper;

        public PropertyController(
            IPropertyService propertyService,
            ILogger<PropertyController> logger,
            IMapper mapper)
        {
            _propertyService = propertyService;
            _logger = logger;
            _mapper = mapper;
        }

        // Helper method for testing only
        private string GetHostId()
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return string.IsNullOrEmpty(hostId) ? "test-host-12345" : hostId;
        }

        // ----------------------------------------------------------------------
        // GET ALL PROPERTIES
        // ----------------------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetMyProperties()
        {
            try
            {
                var hostId = GetHostId();
                var properties = await _propertyService.GetHostPropertiesAsync(hostId);

                var dto = _mapper.Map<IEnumerable<PropertyResponseDto>>(properties);

                return Ok(new
                {
                    success = true,
                    data = dto,
                    count = dto.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host properties");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // GET PROPERTY BY ID
        // ----------------------------------------------------------------------
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPropertyById(int id)
        {
            try
            {
                var hostId = GetHostId();
                var property = await _propertyService.GetPropertyByIdAsync(id);

                if (property == null)
                    return NotFound(new { success = false, message = "Property not found" });

                if (property.HostId != hostId)
                    return Forbid();

                var dto = _mapper.Map<PropertyResponseDto>(property);

                return Ok(new { success = true, data = dto });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching property {PropertyId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // CREATE PROPERTY
        // ----------------------------------------------------------------------
        [HttpPost]
        public async Task<IActionResult> CreateProperty([FromBody] CreatePropertyDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var hostId = GetHostId();

                // Mapping DTO → Entity happens in the service OR here if needed
                var property = await _propertyService.CreatePropertyAsync(hostId, dto);

                var resultDto = _mapper.Map<PropertyResponseDto>(property);

                return CreatedAtAction(nameof(GetPropertyById),
                    new { id = property.Id },
                    new
                    {
                        success = true,
                        data = resultDto,
                        message = "Property created successfully"
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating property");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // UPDATE PROPERTY
        // ----------------------------------------------------------------------
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] UpdatePropertyDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var hostId = GetHostId();

                var updatedProperty = await _propertyService.UpdatePropertyAsync(id, hostId, dto);

                var responseDto = _mapper.Map<PropertyResponseDto>(updatedProperty);

                return Ok(new
                {
                    success = true,
                    data = responseDto,
                    message = "Property updated successfully"
                });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { success = false, message = "Property not found" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating property {PropertyId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // DELETE PROPERTY
        // ----------------------------------------------------------------------
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            try
            {
                var hostId = GetHostId();

                var result = await _propertyService.DeletePropertyAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Property not found" });

                return Ok(new { success = true, message = "Property deleted successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting property {PropertyId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // UPLOAD IMAGE
        // ----------------------------------------------------------------------
        [HttpPost("{id}/images")]
        public async Task<IActionResult> UploadPropertyImage(int id, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "No file uploaded" });

                var hostId = GetHostId();

                var image = await _propertyService.UploadPropertyImageAsync(id, hostId, file);

                return Ok(new
                {
                    success = true,
                    data = image,
                    message = "Image uploaded successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading property image");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // DELETE IMAGE
        // ----------------------------------------------------------------------
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeletePropertyImage(int imageId)
        {
            try
            {
                var hostId = GetHostId();

                var result = await _propertyService.DeletePropertyImageAsync(imageId, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Image not found" });

                return Ok(new { success = true, message = "Image deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting property image");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // SET PRIMARY IMAGE
        // ----------------------------------------------------------------------
        [HttpPatch("images/{imageId}/set-primary")]
        public async Task<IActionResult> SetPrimaryImage(int imageId)
        {
            try
            {
                var hostId = GetHostId();

                var result = await _propertyService.SetPrimaryImageAsync(imageId, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Image not found" });

                return Ok(new { success = true, message = "Primary image set successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // PUBLISH PROPERTY
        // ----------------------------------------------------------------------
        [HttpPost("{id}/publish")]
        public async Task<IActionResult> PublishProperty(int id)
        {
            try
            {
                var hostId = GetHostId();

                var property = await _propertyService.GetPropertyByIdAsync(id);

                if (property == null)
                    return NotFound(new { success = false, message = "Property not found" });

                if (property.HostId != hostId)
                    return Forbid();

                var validationErrors = ValidatePropertyForPublishing(_mapper.Map<PropertyResponseDto>(property));
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Property is not ready to publish",
                        errors = validationErrors
                    });
                }

                await _propertyService.PublishPropertyAsync(id, hostId);

                var dto = _mapper.Map<PropertyResponseDto>(await _propertyService.GetPropertyByIdAsync(id));

                return Ok(new
                {
                    success = true,
                    message = "Property published successfully",
                    data = dto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing property");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // UNPUBLISH PROPERTY
        // ----------------------------------------------------------------------
        [HttpPost("{id}/unpublish")]
        public async Task<IActionResult> UnpublishProperty(int id)
        {
            try
            {
                var hostId = GetHostId();

                var property = await _propertyService.GetPropertyByIdAsync(id);

                if (property == null)
                    return NotFound(new { success = false, message = "Property not found" });

                if (property.HostId != hostId)
                    return Forbid();

                await _propertyService.UnpublishPropertyAsync(id, hostId);

                var dto = _mapper.Map<PropertyResponseDto>(await _propertyService.GetPropertyByIdAsync(id));

                return Ok(new
                {
                    success = true,
                    message = "Property unpublished successfully",
                    data = dto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unpublishing property");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // Validate before publishing
        // ----------------------------------------------------------------------
        private List<string> ValidatePropertyForPublishing(PropertyResponseDto property)
        {
            var errors = new List<string>();

            if (string.IsNullOrEmpty(property.Title) || property.Title.Length < 10)
                errors.Add("Title must be at least 10 characters");

            if (string.IsNullOrEmpty(property.Description) || property.Description.Length < 50)
                errors.Add("Description must be at least 50 characters");

            if (property.Images == null || !property.Images.Any())
                errors.Add("At least one image is required");

            if (property.PricePerNight <= 0)
                errors.Add("Valid price per night is required");

            if (string.IsNullOrEmpty(property.Address))
                errors.Add("Property address is required");

            if (string.IsNullOrEmpty(property.City))
                errors.Add("City is required");

            if (string.IsNullOrEmpty(property.Country))
                errors.Add("Country is required");

            return errors;
        }
    }
}

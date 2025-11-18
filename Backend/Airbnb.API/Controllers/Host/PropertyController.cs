using Airbnb.API.DTOs.Properties;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Host
{
    [ApiController]
    [Route("api/host/[controller]")]
    //[Authorize] // Require authentication
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;
        private readonly ILogger<PropertyController> _logger;

        public PropertyController(
            IPropertyService propertyService,
            ILogger<PropertyController> logger)
        {
            _propertyService = propertyService;
            _logger = logger;
        }

        /// <summary>
        /// Get all properties for the authenticated host
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyProperties()
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    // FOR TESTING ONLY - Remove in production
                    hostId = "test-host-12345";
                    Console.WriteLine("⚠️ Using test host ID for development");
                }

                var properties = await _propertyService.GetHostPropertiesAsync(hostId);

                return Ok(new
                {
                    success = true,
                    data = properties,
                    count = properties.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting host properties");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Get a specific property by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPropertyById(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var property = await _propertyService.GetPropertyByIdAsync(id);

                if (property == null)
                    return NotFound(new { success = false, message = "Property not found" });

                // Verify host owns this property
                if (property.HostId != hostId)
                    return Forbid();

                return Ok(new
                {
                    success = true,
                    data = property
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting property {PropertyId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Create a new property
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateProperty([FromBody] CreatePropertyDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                // FOR TESTING ONLY - Remove in production
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    // Use a test user ID for development
                    hostId = "test-host-12345";
                }

                var property = await _propertyService.CreatePropertyAsync(hostId, dto);
                _logger.LogInformation("Property {PropertyId} created by host {HostId}", property.Id, hostId);

                return CreatedAtAction(
                    nameof(GetPropertyById),
                    new { id = property.Id },
                    new { success = true, data = property, message = "Property created successfully" }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating property");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Update an existing property
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] UpdatePropertyDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized("User not authenticated");

                var property = await _propertyService.UpdatePropertyAsync(id, hostId, dto);

                _logger.LogInformation("Property {PropertyId} updated by host {HostId}", id, hostId);

                return Ok(new
                {
                    success = true,
                    data = property,
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

        /// <summary>
        /// Delete a property
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized("User not authenticated");

                var result = await _propertyService.DeletePropertyAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Property not found" });

                _logger.LogInformation("Property {PropertyId} deleted by host {HostId}", id, hostId);

                return Ok(new
                {
                    success = true,
                    message = "Property deleted successfully"
                });
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

        /// <summary>
        /// Toggle property active status (list/unlist)
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> TogglePropertyStatus(int id)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized("User not authenticated");

                var result = await _propertyService.TogglePropertyStatusAsync(id, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Property not found" });

                _logger.LogInformation("Property {PropertyId} status toggled by host {HostId}", id, hostId);

                return Ok(new
                {
                    success = true,
                    message = "Property status updated successfully"
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling property status {PropertyId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Upload property images
        /// </summary>
        [HttpPost("{id}/images")]
        [HttpPost("{id}/images")]
        public async Task<IActionResult> UploadPropertyImage(int id, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "No file uploaded" });

                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                {
                    // FOR TESTING ONLY - Remove in production
                    hostId = "test-host-12345";
                    Console.WriteLine("⚠️ Using test host ID for image upload");
                }

                var image = await _propertyService.UploadPropertyImageAsync(id, hostId, file);

                _logger.LogInformation("Image uploaded for property {PropertyId} by host {HostId}", id, hostId);

                return Ok(new
                {
                    success = true,
                    data = image,
                    message = "Image uploaded successfully"
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
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image for property {PropertyId}", id);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Delete a property image
        /// </summary>
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeletePropertyImage(int imageId)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized("User not authenticated");

                var result = await _propertyService.DeletePropertyImageAsync(imageId, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Image not found" });

                return Ok(new
                {
                    success = true,
                    message = "Image deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image {ImageId}", imageId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        /// <summary>
        /// Set primary image for property
        /// </summary>
        [HttpPatch("images/{imageId}/set-primary")]
        public async Task<IActionResult> SetPrimaryImage(int imageId)
        {
            try
            {
                var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                if (string.IsNullOrEmpty(hostId))
                    return Unauthorized("User not authenticated");

                var result = await _propertyService.SetPrimaryImageAsync(imageId, hostId);

                if (!result)
                    return NotFound(new { success = false, message = "Image not found" });

                return Ok(new
                {
                    success = true,
                    message = "Primary image set successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image {ImageId}", imageId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }
}
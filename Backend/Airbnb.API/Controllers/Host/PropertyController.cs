using Airbnb.API.DTOs.Properties;
using Airbnb.API.Models;
using Airbnb.API.Services.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Host
{
    [ApiController]
    [Route("api/host/[controller]")]
    [Authorize]
    public class PropertyController : ControllerBase
    {
        private readonly IPropertyService _propertyService;
        private readonly ILogger<PropertyController> _logger;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;

        public PropertyController(
            IPropertyService propertyService,
            ILogger<PropertyController> logger,
            IMapper mapper,
            UserManager<ApplicationUser> userManager)
        {
            _propertyService = propertyService;
            _logger = logger;
            _mapper = mapper;
            _userManager = userManager;
        }

        private string GetHostId()
        {
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                         ?? User.FindFirstValue("sub")                  
                         ?? User.FindFirstValue("id")                   
                         ?? User.FindFirstValue("uid");                 

            if (string.IsNullOrEmpty(hostId))
            {
                throw new UnauthorizedAccessException("User ID not found in token.");
            }

            return hostId;
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
        [HttpGet("{id:int}")]
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
            // 1. Get the ID once at the start
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Safety check: ensure ID exists
            if (string.IsNullOrEmpty(hostId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            // 2. Perform the Verification Check
            var user = await _userManager.FindByIdAsync(hostId);

            if (user == null || !user.IsVerified)
            {
                return StatusCode(403, new
                {
                    message = "Identity verification required.",
                    details = "You must verify your ID before listing a property."
                });
            }

            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                // 3. Use the existing 'hostId' variable here (Do not redeclare it)
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
                return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
            }
        }

        // ----------------------------------------------------------------------
        // UPDATE PROPERTY
        // ----------------------------------------------------------------------
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] UpdatePropertyDto dto)
        {
            Console.WriteLine("---------------- DEBUG START ----------------");
            Console.WriteLine($"Received Update for ID: {id}");
            Console.WriteLine($"HasExteriorCamera (Raw DTO): {dto.HasExteriorCamera}");
            Console.WriteLine($"HasNoiseMonitor (Raw DTO): {dto.HasNoiseMonitor}");
            Console.WriteLine($"HasWeapons (Raw DTO): {dto.HasWeapons}");
            Console.WriteLine("---------------- DEBUG END ----------------");
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
        [HttpDelete("{id:int}")]
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



        [HttpPost("{id:int}/images")]
        public async Task<IActionResult> UploadPropertyImage(int id, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "No file uploaded" });

                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(new { success = false, message = "File size exceeds 5MB limit" });

                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    return BadRequest(new { success = false, message = "Invalid file type" });

                var hostId = GetHostId();

                var image = await _propertyService.UploadPropertyImageAsync(id, hostId, file);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        id = image.Id,
                        imageUrl = image.ImageUrl,
                        isPrimary = image.IsPrimary,
                        displayOrder = image.DisplayOrder
                    },
                    message = "Image uploaded successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading property image");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to upload image",
                    details = ex.Message
                });
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
            catch (UnauthorizedAccessException)
            {
                return Forbid();
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
            catch (UnauthorizedAccessException)
            {
                return Forbid();
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

        // ----------------------------------------------------------------------
        // CREATE DRAFT (Matches CreatePropertyDto)
        // ----------------------------------------------------------------------
        [HttpPost("draft")]
        public async Task<IActionResult> CreateDraft()
        {
            try
            {
                var hostId = GetHostId();

                var draftDto = new CreatePropertyDto
                {
                    Title = "Untitled Listing",
                    Description = "Draft description...",

                    PropertyTypeId = 1,

                    Address = "Draft Address",
                    City = "Draft City",
                    Country = "Draft Country",
                    PostalCode = "00000",
                    Latitude = 0,
                    Longitude = 0,

                    // Capacity Defaults
                    NumberOfBedrooms = 1,
                    NumberOfBeds = 1,
                    NumberOfBathrooms = 1,
                    MaxGuests = 1,

                    // Pricing Defaults
                    PricePerNight = 0, 
                    CleaningFee = 0,

                    // Amenities
                    AmenityIds = new List<int>(), 

                    // Rules
                    MinimumStay = 1
                };

                var property = await _propertyService.CreatePropertyAsync(hostId, draftDto);

                // Map back to response DTO
                var resultDto = _mapper.Map<PropertyResponseDto>(property);

                return Ok(new
                {
                    success = true,
                    data = resultDto,
                    message = "Draft created successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating draft");
                // Returns the inner error so you can see if it's a Foreign Key issue (like PropertyTypeId)
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
            }
        }

        // ----------------------------------------------------------------------
        // SUBMIT FOR APPROVAL
        // ----------------------------------------------------------------------
        [HttpPost("{id}/submit-for-approval")]
        public async Task<IActionResult> SubmitForApproval(int id)
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
                        message = "Property is not ready to submit",
                        errors = validationErrors
                    });
                }

                await _propertyService.PublishPropertyAsync(id, hostId);

                var dto = _mapper.Map<PropertyResponseDto>(await _propertyService.GetPropertyByIdAsync(id));

                return Ok(new
                {
                    success = true,
                    message = "Property submitted for approval. You will be notified once it's reviewed.",
                    data = dto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting property for approval");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        // ----------------------------------------------------------------------
        // ACTIVATE PROPERTY 
        // ----------------------------------------------------------------------
        [HttpPost("{id}/activate")]
        public async Task<IActionResult> ActivateProperty(int id)
        {
            try
            {
                var hostId = GetHostId();

                var property = await _propertyService.GetPropertyByIdAsync(id);

                if (property == null)
                    return NotFound(new { success = false, message = "Property not found" });

                if (property.HostId != hostId)
                    return Forbid();

                await _propertyService.ActivatePropertyAsync(id, hostId);

                var dto = _mapper.Map<PropertyResponseDto>(await _propertyService.GetPropertyByIdAsync(id));

                return Ok(new
                {
                    success = true,
                    message = "Property activated successfully",
                    data = dto
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating property");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ----------------------------------------------------------------------
        // DEACTIVATE PROPERTY
        // ----------------------------------------------------------------------
        [HttpPost("{id}/deactivate")]
        public async Task<IActionResult> DeactivateProperty(int id)
        {
            try
            {
                var hostId = GetHostId();

                

                await _propertyService.UnpublishPropertyAsync(id, hostId);
                var property = await _propertyService.GetPropertyByIdAsync(id);
                var dto = _mapper.Map<PropertyResponseDto>(property);

                return Ok(new
                {
                    success = true,
                    message = "Property deactivated successfully",
                    data = dto
                });
            }
            catch (InvalidOperationException ex) 
            {
                
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating property");
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("amenities")]
        public async Task<IActionResult> GetAmenities()
        {
            try
            {
                var amenities = await _propertyService.GetAmenitiesListAsync();
                return Ok(new { success = true, data = amenities });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching amenities");
                return StatusCode(500, new { success = false, message = "Error fetching amenities" });
            }
        }
    }
}

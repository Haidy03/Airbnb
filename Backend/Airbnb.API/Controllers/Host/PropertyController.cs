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

        // Helper method for testing only
        private string GetHostId()
        {
            // 1. Try to get ID from standard ClaimTypes
            var hostId = User.FindFirstValue(ClaimTypes.NameIdentifier) // Usually maps to 'nameid'
                         ?? User.FindFirstValue("sub")                  // Standard JWT subject
                         ?? User.FindFirstValue("id")                   // Common custom claim
                         ?? User.FindFirstValue("uid");                 // Another common custom claim

            // 2. Security Check: If no ID found, throw error (Don't return "test-host" anymore!)
            if (string.IsNullOrEmpty(hostId))
            {
                // This ensures the code fails safely if the user isn't logged in properly
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
                // ✅ Validate file
                if (file == null || file.Length == 0)
                    return BadRequest(new { success = false, message = "No file uploaded" });

                // ✅ Validate file size (5MB)
                if (file.Length > 5 * 1024 * 1024)
                    return BadRequest(new { success = false, message = "File size exceeds 5MB limit" });

                // ✅ Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    return BadRequest(new { success = false, message = "Invalid file type" });

                var hostId = GetHostId();

                // ✅ Upload image
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

                // ✅ Controller delegates to service
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

                // ✅ Controller delegates to service
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
        // ✅ NEW: CREATE DRAFT (Matches CreatePropertyDto)
        // ----------------------------------------------------------------------
        [HttpPost("draft")]
        public async Task<IActionResult> CreateDraft()
        {
            try
            {
                var hostId = GetHostId();

                // We create the DTO with placeholder values to satisfy database constraints.
                var draftDto = new CreatePropertyDto
                {
                    Title = "Untitled Listing",
                    Description = "Draft description...",

                    // ⚠️ IMPORTANT: This ID must exist in your PropertyTypes table!
                    // If your DB uses IDs starting at 1, use 1.
                    PropertyTypeId = 1,

                    // Location Defaults (Strings are required in your DTO)
                    Address = "Draft Address",
                    City = "Draft City",
                    Country = "Draft Country",
                    PostalCode = "00000",
                    Latitude = 0,
                    Longitude = 0,

                    // Capacity Defaults
                    NumberOfBedrooms = 1,
                    NumberOfBathrooms = 1,
                    MaxGuests = 1,

                    // Pricing Defaults
                    PricePerNight = 0, // 0 is fine for a draft
                    CleaningFee = 0,

                    // Amenities
                    AmenityIds = new List<int>(), // Empty list is fine

                    // Rules
                    MinimumStay = 1
                };

                // Save to DB
                // Ensure your Service sets property.Status = PropertyStatus.Draft
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
        // SUBMIT FOR APPROVAL (بدلاً من Publish مباشرة)
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
        // ACTIVATE PROPERTY (بعد موافقة Admin)
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
                    message = "Property deactivated successfully",
                    data = dto
                });
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

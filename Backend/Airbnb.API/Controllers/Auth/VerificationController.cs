using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Airbnb.API.Services.Interfaces;

namespace Airbnb.API.Controllers.Auth
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VerificationController : ControllerBase
    {
        private readonly IAuthService _authService;
        // You might need a new IFileService to handle uploads cleanly

        public VerificationController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("upload-id")]
        public async Task<IActionResult> UploadIdentification(IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 1. Validate File (Image only, max 5MB)
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            // 2. Save File (Ideally use a helper service)
            // For security, rename the file to UserId_Guid.jpg
            var fileName = $"{userId}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads", "Identifications");

            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

            var filePath = Path.Combine(uploadPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 3. Update User Record via Service
            var result = await _authService.SubmitVerificationRequestAsync(userId, filePath);

            if (!result) return BadRequest("Error submitting request.");

            return Ok(new { message = "ID uploaded successfully. Verification is pending." });
        }
    }
}
using Airbnb.API.DTOs.Common;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Airbnb.API.Controllers.Guest
{
    [Route("api/[controller]")]
    [ApiController]
    public class TranslationController : ControllerBase
    {
        private readonly ITranslationService _translationService;

        public TranslationController(ITranslationService translationService)
        {
            _translationService = translationService;
        }

        [HttpPost]
        public async Task<IActionResult> Translate([FromBody] TranslationRequestDto request)
        {
            if (string.IsNullOrEmpty(request.Text))
                return BadRequest("Text is required");

            try
            {
                var result = await _translationService.TranslateToArabicAsync(request.Text);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // If Google blocks the request (too many requests), handle it gracefully
                return StatusCode(500, new { message = "Translation failed", error = ex.Message });
            }
        }
    }
}
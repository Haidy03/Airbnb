using Airbnb.API.DTOs.Common;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Guest
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;

        public ChatController(IChatService chatService)
        {
            _chatService = chatService;
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] ChatRequestDto request)
        {
            // 1. Get User ID from Token
            // If user is not logged in (Guest), use a Session ID or IP, 
            // but for now let's assume they are logged in or use "Guest" as ID.
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "Anonymous_Guest";

            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest("Message cannot be empty");

            try
            {
                // 2. Pass ID to Service
                var response = await _chatService.GetResponseAsync(request.Message, userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Chat error", error = ex.Message });
            }
        }
    }
}
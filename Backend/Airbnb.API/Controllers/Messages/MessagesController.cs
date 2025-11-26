using Airbnb.API.DTOs.Messages;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(
            IMessageService messageService,
            ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        // Helper method to get current user ID
        private string GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return string.IsNullOrEmpty(userId) ? "test-user-12345" : userId;
        }

        // ==========================================
        // GET ALL CONVERSATIONS
        // ==========================================
        // GET: api/Messages/conversations?mode=host
        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations([FromQuery] string mode = "guest")
        {
            try
            {
                var userId = GetCurrentUserId();

                // ✅ تمرير الـ mode للسيرفس
                var conversations = await _messageService.GetUserConversationsAsync(userId, mode);

                return Ok(new
                {
                    success = true,
                    data = conversations,
                    count = conversations.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversations");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // GET CONVERSATION BY ID
        // ==========================================
        [HttpGet("conversations/{conversationId:int}")]
        public async Task<IActionResult> GetConversation(int conversationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var conversation = await _messageService.GetConversationByIdAsync(conversationId, userId);

                if (conversation == null)
                    return NotFound(new { success = false, message = "Conversation not found" });

                return Ok(new { success = true, data = conversation });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting conversation {ConversationId}", conversationId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // CREATE CONVERSATION
        // ==========================================
        [HttpPost("conversations")]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var userId = GetCurrentUserId();
                var conversation = await _messageService.CreateConversationAsync(userId, dto);

                return CreatedAtAction(
                    nameof(GetConversation),
                    new { conversationId = conversation.Id },
                    new { success = true, data = conversation, message = "Conversation created successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating conversation");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // GET CONVERSATION MESSAGES
        // ==========================================
        [HttpGet("conversations/{conversationId:int}/messages")]
        public async Task<IActionResult> GetMessages(
            int conversationId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var userId = GetCurrentUserId();
                var messages = await _messageService.GetConversationMessagesAsync(
                    conversationId, userId, pageNumber, pageSize);

                return Ok(new
                {
                    success = true,
                    data = messages,
                    count = messages.Count(),
                    pageNumber,
                    pageSize
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting messages for conversation {ConversationId}", conversationId);
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // SEND MESSAGE
        // ==========================================
        [HttpPost("messages")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, errors = ModelState });

                var userId = GetCurrentUserId();
                var message = await _messageService.SendMessageAsync(userId, dto);

                return Ok(new
                {
                    success = true,
                    data = message,
                    message = "Message sent successfully"
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // MARK MESSAGE AS READ
        // ==========================================
        [HttpPatch("messages/{messageId:int}/read")]
        public async Task<IActionResult> MarkMessageAsRead(int messageId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _messageService.MarkMessageAsReadAsync(messageId, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Message not found" });

                return Ok(new { success = true, message = "Message marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking message as read");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // MARK CONVERSATION AS READ
        // ==========================================
        [HttpPatch("conversations/{conversationId:int}/read")]
        public async Task<IActionResult> MarkConversationAsRead(int conversationId)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _messageService.MarkConversationAsReadAsync(conversationId, userId);

                if (!result)
                    return NotFound(new { success = false, message = "Conversation not found" });

                return Ok(new { success = true, message = "Conversation marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking conversation as read");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // GET UNREAD COUNT
        // ==========================================
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = GetCurrentUserId();
                var count = await _messageService.GetUnreadCountAsync(userId);

                return Ok(new { success = true, count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }

        // ==========================================
        // DELETE MESSAGE
        // ==========================================
        [HttpDelete("messages/{messageId:int}")]
        public async Task<IActionResult> DeleteMessage(int messageId)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _messageService.DeleteMessageAsync(messageId, userId);

                return Ok(new { success = true, message = "Message deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting message");
                return StatusCode(500, new { success = false, message = "Internal server error" });
            }
        }
    }
}
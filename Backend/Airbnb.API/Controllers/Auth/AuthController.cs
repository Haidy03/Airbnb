using Airbnb.API.DTOs.Auth;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Auth
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IEmailService _emailService;

        public AuthController(IAuthService authService, IEmailService emailService)
        {
            _authService = authService;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var result = await _authService.RegisterUserAsync(registerDto);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "User registered successfully!" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var authResponse = await _authService.LoginUserAsync(loginDto);

                if (authResponse == null)
                {
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                return Ok(authResponse);
            }
            catch
            {
                return StatusCode(500, new { message = "An error occurred during login." });
            }
        }


        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var userProfile = await _authService.GetUserProfileAsync(userId);

            if (userProfile == null)
            {
                return NotFound("User not found.");
            }

            return Ok(userProfile);
        }

        [HttpPut("profile")]
        [Authorize] // This endpoint is protected and requires a valid token
        public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateProfileDto updateDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var result = await _authService.UpdateUserProfileAsync(userId, updateDto);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Profile updated successfully." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto forgotPasswordDto)
        {
            var token = await _authService.GeneratePasswordResetTokenAsync(forgotPasswordDto.Email);

            if (token == null)
            {
                return Ok(new { Message = "If an account with this email exists, a password reset link has been sent." });
            }

            var encodedToken = Uri.EscapeDataString(token);
            var resetLink = $"http://localhost:4200/reset-password?token={encodedToken}&email={forgotPasswordDto.Email}";

            var emailBody = $@"
                <h3>Reset Your Password</h3>
                <p>You requested a password reset for your Airbnb Clone account.</p>
                <p>Click the link below to reset it:</p>
                <a href='{resetLink}'>Reset Password</a>
                <br>
                <p>If you did not request this, please ignore this email.</p>";

            // Send the Email
            await _emailService.SendEmailAsync(forgotPasswordDto.Email, "Reset Your Password", emailBody);

            return Ok(new { Message = "If an account with this email exists, a password reset link has been sent." });
        }

        [HttpDelete("account")]
        [Authorize] // A user must be logged in to delete their own account
        public async Task<IActionResult> DeleteUserAccount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var result = await _authService.DeleteUserAsync(userId);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Your account has been successfully deactivated." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetDto)
        {
            var result = await _authService.ResetPasswordAsync(resetDto);

            if (!result.Succeeded)
            {
                
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Password has been reset successfully." });
        }


        [HttpPost("become-host")]
        [Authorize] 
        public async Task<IActionResult> BecomeHost()
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                
                var authResponse = await _authService.BecomeHostAsync(userId);

                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("upload-photo")]
        [Authorize] // User must be logged in
        public async Task<IActionResult> UploadPhoto(IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var photoUrl = await _authService.UploadProfilePhotoAsync(userId, file);
                return Ok(new { message = "Photo uploaded successfully", url = photoUrl });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPost("change-password")]
        [Authorize] // <--- Critical: User must be logged in
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var result = await _authService.ChangePasswordAsync(userId, changePasswordDto);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Password changed successfully." });
        }


    }
}
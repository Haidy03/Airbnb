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

        public AuthController(IAuthService authService)
        {
            _authService = authService;
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
            var authResponse = await _authService.LoginUserAsync(loginDto);

            if (authResponse == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            return Ok(authResponse);
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
            // Get the user's ID from the claims in their token
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Call the service to perform the update logic
            var result = await _authService.UpdateUserProfileAsync(userId, updateDto);

            if (!result.Succeeded)
            {
                // If the service returned errors (e.g., user not found), return a BadRequest
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
                // If the token is null (user not found), we still return a 200 OK.
                // This is a security measure to prevent user enumeration.
                return Ok(new { Message = "If an account with this email exists, a password reset link has been sent." });
            }

            // --- Simulate Sending Email ---
            // In a real application, you would use a service to send an email here.
            // For this project, we'll just log it to the console for testing.
            Console.WriteLine($"Password Reset Token for {forgotPasswordDto.Email}: {token}");
            // You could also return the token directly in the response for easy testing during development.
            // For example: return Ok(new { Token = token });
            // --- End Simulation ---

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
                // The errors could include "Invalid token", password complexity issues, etc.
                // For security, you might want to return a generic message in production,
                // but for development, returning the errors is helpful.
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Password has been reset successfully." });
        }
    }
}
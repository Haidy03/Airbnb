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

        //[HttpPost("login")]
        //public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        //{
        //    var authResponse = await _authService.LoginUserAsync(loginDto);

        //    if (authResponse == null)
        //    {
        //        return Unauthorized("Invalid credentials.");
        //    }

        //    return Ok(authResponse);
        //}


        //[HttpGet("profile")]
        //[Authorize]
        //public async Task<IActionResult> GetUserProfile()
        //{
        //    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        //    if (string.IsNullOrEmpty(userId))
        //    {
        //        return Unauthorized();
        //    }

        //    var userProfile = await _authService.GetUserProfileAsync(userId);

        //    if (userProfile == null)
        //    {
        //        return NotFound("User not found.");
        //    }

        //    return Ok(userProfile);
        //}

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                // بنحاول نعمل تسجيل دخول
                var authResponse = await _authService.LoginUserAsync(loginDto);

                // لو رجع null يبقى البيانات غلط
                if (authResponse == null)
                {
                    // بنرجع Unauthorized (401) مع رسالة خطأ واضحة
                    // الفرونت اند هيستلم الرسالة دي ويعرضها للمستخدم
                    return Unauthorized(new { message = "Invalid email or password." });
                }

                // لو نجح بنرجع البيانات
                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                // لو حصل أي خطأ غير متوقع (زي مشكلة في الداتا بيز)
                // بنسجله ونرجع رسالة عامة عشان منظهرش تفاصيل الخطأ للمستخدم
                // (ممكن تضيفي _logger هنا لو عايزة تسجلي الخطأ)
                return StatusCode(500, new { message = "An error occurred during login." });
            }
        }
        // ==========================================


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
                // Security: Don't reveal if user exists
                return Ok(new { Message = "If an account with this email exists, a password reset link has been sent." });
            }

            // Construct the Email
            // This link points to your Angular Frontend (localhost:4200)
            // The frontend will read the token from the URL and send it back to your API
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
                // The errors could include "Invalid token", password complexity issues, etc.
                // For security, you might want to return a generic message in production,
                // but for development, returning the errors is helpful.
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
            // 1. Get the ID of the currently logged-in user
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 2. Call the service
            var result = await _authService.ChangePasswordAsync(userId, changePasswordDto);

            if (!result.Succeeded)
            {
                // This will return errors like "Incorrect password" or "Password requires a digit"
                return BadRequest(result.Errors);
            }

            return Ok(new { Message = "Password changed successfully." });
        }


    }
}
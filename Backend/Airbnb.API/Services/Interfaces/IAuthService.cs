using Airbnb.API.DTOs.Auth;
using Microsoft.AspNetCore.Identity;

namespace Airbnb.API.Services.Interfaces
{
    public interface IAuthService
    {
        Task<IdentityResult> RegisterUserAsync(RegisterDto registerDto);
        Task<AuthResponseDto> LoginUserAsync(LoginDto loginDto);
        Task<UserProfileDto> GetUserProfileAsync(string userId);
        Task<IdentityResult> UpdateUserProfileAsync(string userId, UpdateProfileDto updateDto);
        Task<IdentityResult> DeleteUserAsync(string userId);
        Task<string> GeneratePasswordResetTokenAsync(string email);
        Task<IdentityResult> ResetPasswordAsync(ResetPasswordDto resetDto);
        Task<string> UploadProfilePhotoAsync(string userId, IFormFile file);
        Task<bool> SubmitVerificationRequestAsync(string userId, IFormFile file);
        Task<AuthResponseDto> BecomeHostAsync(string userId);
        Task<bool> SubmitVerificationRequestAsync(string userId, string filePath);
        Task<IdentityResult> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);


    }
}
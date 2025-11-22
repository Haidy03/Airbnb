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

    }
}
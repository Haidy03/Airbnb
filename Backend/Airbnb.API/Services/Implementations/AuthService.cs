using Airbnb.API.DTOs.Auth;
using Airbnb.API.Models;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Airbnb.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _userManager = userManager;
            _configuration = configuration;
        }

        public async Task<IdentityResult> RegisterUserAsync(RegisterDto registerDto)
        {
            var user = new ApplicationUser
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Email = registerDto.Email,
                UserName = registerDto.Email,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (result.Succeeded)
            {
                // Assign the default "Guest" role upon registration
                await _userManager.AddToRoleAsync(user, "Guest");
            }

            return result;
        }

        public async Task<AuthResponseDto> LoginUserAsync(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                // Return null or throw an exception to indicate failed login
                return null;
            }

            var token = await GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Email = user.Email
            };
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];

            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                expires: DateTime.UtcNow.AddHours(24),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<UserProfileDto> GetUserProfileAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                // Return null or throw an exception if the user is not found
                return null;
            }

            // Map the ApplicationUser to the UserProfileDto
            return new UserProfileDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email
            };
        }

        public async Task<IdentityResult> UpdateUserProfileAsync(string userId, UpdateProfileDto updateDto)
        {
            // Find the user by their ID
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                // This is a special case. If the user from a valid token doesn't exist, something is wrong.
                // We return an IdentityResult with a custom error.
                return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "User not found." });
            }

            // Update the user's properties with the values from the DTO
            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;
            user.Bio = updateDto.Bio;
            user.UpdatedAt = DateTime.UtcNow; // It's good practice to track when a record was last updated

            // Persist the changes to the database
            var result = await _userManager.UpdateAsync(user);

            return result;
        }

        public async Task<string> GeneratePasswordResetTokenAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                // Don't reveal that the user does not exist.
                // Return null, and the controller will handle sending a generic success message.
                return null;
            }

            // Generate the password reset token using the UserManager
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            return token;
        }

        public async Task<IdentityResult> DeleteUserAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "User not found." });
            }

            // --- This is the "Soft Delete" ---
            // We deactivate the user instead of permanently deleting them.
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            user.Email = null;
            user.NormalizedEmail = null;
            user.UserName = null;
            user.NormalizedUserName = null;

            var result = await _userManager.UpdateAsync(user);
            return result;
        }

        public async Task<IdentityResult> ResetPasswordAsync(ResetPasswordDto resetDto)
        {
            var user = await _userManager.FindByEmailAsync(resetDto.Email);
            if (user == null)
            {
                // Don't reveal that the user does not exist.
                // The token validation will fail anyway, but this is an extra precaution.
                // We return a generic error message that will be handled by the controller.
                return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "Invalid password reset request." });
            }

            // The UserManager handles everything: it checks if the token is valid for this user
            // and if it hasn't expired, then updates the password hash.
            var result = await _userManager.ResetPasswordAsync(user, resetDto.Token, resetDto.NewPassword);

            return result;
        }


        // Become a Host    
        public async Task<AuthResponseDto> BecomeHostAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new Exception("User not found");

          
            if (!await _userManager.IsInRoleAsync(user, "Host"))
            {
              
                var result = await _userManager.AddToRoleAsync(user, "Host");
                if (!result.Succeeded) throw new Exception("Failed to add host role");
            }

            var newToken = await GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = newToken,
                UserId = user.Id,
                Email = user.Email
            };
        }
    }
}
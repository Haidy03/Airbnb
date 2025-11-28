using Airbnb.API.DTOs.Auth;
using Airbnb.API.Models;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace Airbnb.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration, IWebHostEnvironment environment)
        {
            _userManager = userManager;
            _configuration = configuration;
            _environment = environment;
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
                PhoneNumber = registerDto.PhoneNumber,
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

            ApplicationUser user = null;

            // Check if input is Email or Phone
            if (loginDto.Identifier.Contains("@"))
            {
                user = await _userManager.FindByEmailAsync(loginDto.Identifier);
            }
            else
            {
                // We need to search users by Phone Number
                // Note: UserManager doesn't have FindByPhone, so we use Entity Framework directly or Users list
                user = _userManager.Users.FirstOrDefault(u => u.PhoneNumber == loginDto.Identifier);
            }

            if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
                return null;
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
                return null;
            }

            // Map the ApplicationUser to the UserProfileDto
            return new UserProfileDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                Address = user.Address,
                City = user.City,
                ProfileImageUrl = user.ProfileImageUrl,
                Country = user.Country
            };
        }

        public async Task<IdentityResult> UpdateUserProfileAsync(string userId, UpdateProfileDto updateDto)
        {
            // Find the user by their ID
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                // This is a special case. If the user from a valid token doesn't exist, something is wrong.
                return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "User not found." });
            }


            // Update the user's properties with the values from the DTO
            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;
            user.Bio = updateDto.Bio;

            // ==========================================
            // الإضافات الجديدة (Mapping)
            // ==========================================
            user.PhoneNumber = updateDto.PhoneNumber;
            user.DateOfBirth = updateDto.DateOfBirth;
            user.Address = updateDto.Address;
            user.City = updateDto.City;
            user.Country = updateDto.Country;
            if (!string.IsNullOrEmpty(updateDto.ProfileImageUrl))
            {
                user.ProfileImageUrl = updateDto.ProfileImageUrl;
            }

            user.UpdatedAt = DateTime.UtcNow; // Track update time

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

            // =========================================================
            // 1. FIX: Handle URL Encoding
            // =========================================================

            // This converts "%2F" back to "/" and "%2B" back to "+"
            string decodedToken = Uri.UnescapeDataString(resetDto.Token);

            // 2. Extra Safety: Sometimes web browsers turn '+' into ' ' (space).
            // If the token has spaces, put the plus signs back.
            // (Identity tokens are Base64 and should not have spaces).
            if (decodedToken.Contains(" "))
            {
                decodedToken = decodedToken.Replace(" ", "+");
            }

            // 3. Use the clean, decoded token
            var result = await _userManager.ResetPasswordAsync(user, decodedToken, resetDto.NewPassword);

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

        public async Task<bool> SubmitVerificationRequestAsync(string userId, string filePath)
        {
            // 1. Find the user
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return false;
            }

            // 2. Update the user's verification details
            user.IdentificationImagePath = filePath;
            user.VerificationStatus = "Pending"; // Set status so Admin sees it
            user.IsVerified = false; // Ensure they aren't verified yet

            // 3. Save changes to database
            var result = await _userManager.UpdateAsync(user);

            return result.Succeeded;
        }

        public async Task<string> UploadProfilePhotoAsync(string userId, IFormFile file)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new Exception("User not found");

            // A. Validate File
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file type. Only JPG/PNG/webp allowed.");

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
                throw new ArgumentException("File size exceeds 5MB.");

            // B. Create Path: wwwroot/uploads/profiles
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "profiles");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            // C. Generate Unique Filename (UserId_Guid.jpg)
            var fileName = $"{userId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // D. Save File
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // E. Update Database
            // We store the relative path so the frontend can load it: /uploads/profiles/filename.jpg
            var relativePath = $"/uploads/profiles/{fileName}";
            user.ProfileImageUrl = relativePath;

            await _userManager.UpdateAsync(user);

            return relativePath;
        }

        public async Task<bool> SubmitVerificationRequestAsync(string userId, IFormFile file)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return false;

            // Logic is similar, but we save to a different folder
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file type.");

            // Save to wwwroot/uploads/ids
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "ids");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{userId}_ID_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update User Status
            user.IdentificationImagePath = $"/uploads/ids/{fileName}";
            user.VerificationStatus = "Pending"; // Triggers Admin Review
            user.IsVerified = false;

            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        public async Task<IdentityResult> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return IdentityResult.Failed(new IdentityError { Description = "User not found." });
            }

            // This method automatically verifies the current password matches
            // and enforces password strength policies on the new password.
            var result = await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);

            return result;
        }
    }
}
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
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration, IWebHostEnvironment environment, SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _configuration = configuration;
            _environment = environment;
            _signInManager = signInManager;
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

        //public async Task<AuthResponseDto> LoginUserAsync(LoginDto loginDto)
        //{

        //    ApplicationUser user = null;

        //    // Check if input is Email or Phone
        //    if (loginDto.Identifier.Contains("@"))
        //    {
        //        user = await _userManager.FindByEmailAsync(loginDto.Identifier);
        //    }
        //    else
        //    {
        //        // We need to search users by Phone Number
        //        // Note: UserManager doesn't have FindByPhone, so we use Entity Framework directly or Users list
        //        user = _userManager.Users.FirstOrDefault(u => u.PhoneNumber == loginDto.Identifier);
        //    }

        //    if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
        //        return null;
        //    var token = await GenerateJwtToken(user);

        //    return new AuthResponseDto
        //    {
        //        Token = token,
        //        UserId = user.Id,
        //        Email = user.Email
        //    };
        //}
        public async Task<AuthResponseDto> LoginUserAsync(LoginDto loginDto)
        {
            // 1. محاولة البحث بالإيميل
            var user = await _userManager.FindByEmailAsync(loginDto.Identifier);

            // 2. لو ملقناش بالإيميل، نحاول باسم المستخدم (Username)
            if (user == null)
            {
                user = await _userManager.FindByNameAsync(loginDto.Identifier);
            }

            // 3. (التعديل الجديد) لو لسه ملقناش، نحاول برقم الهاتف
            if (user == null)
            {
                // بنبحث في قاعدة البيانات عن مستخدم عنده نفس رقم الهاتف
                // (تأكدي إن الرقم متسجل بنفس التنسيق +2010...)
                user = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == loginDto.Identifier);
            }

            // لو بعد كل ده ملقناش مستخدم، يبقى البيانات غلط
            if (user == null)
            {
                return null; // Controller will handle this as 401
            }

            // 4. التحقق من كلمة المرور
            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (!result.Succeeded)
            {
                return null;
            }

            // 5. إنشاء التوكن
            var token = await GenerateJwtToken(user);

            return new AuthResponseDto
            {
                Token = token,
                UserId = user.Id,
                Email = user.Email
            };
        }
        // ==========================================

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
            if (user == null) return null;

            return new UserProfileDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                ProfileImageUrl = user.ProfileImageUrl,
                IsVerified = user.IsVerified,
                VerificationStatus = user.VerificationStatus,

                // ✅ Map the new fields back to the DTO
                AboutMe = user.AboutMe,
                WhereToGo = user.WhereToGo,
                MyWork = user.MyWork,
                SpendTime = user.SpendTime,
                Pets = user.Pets,
                BornDecade = user.BornDecade,
                School = user.School,
                UselessSkill = user.UselessSkill,
                FunFact = user.FunFact,
                FavoriteSong = user.FavoriteSong,
                ObsessedWith = user.ObsessedWith,
                BiographyTitle = user.BiographyTitle,
                Languages = user.Languages,
                WhereILive = user.WhereILive
            };
        }

        public async Task<IdentityResult> UpdateUserProfileAsync(string userId, UpdateProfileDto updateDto)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "User not found." });
            }

            // 1. Basic Info
            user.FirstName = updateDto.FirstName;
            user.LastName = updateDto.LastName;

            // 2. Profile Image (Only update if provided and not null/empty)
            // Note: The upload endpoint handles the actual file, this just links string URL if needed.
            // We usually skip this if the frontend sends null to avoid wiping the photo.
            if (!string.IsNullOrEmpty(updateDto.ProfileImageUrl))
            {
                user.ProfileImageUrl = updateDto.ProfileImageUrl;
            }

            // 3. Extended Details - Manual Mapping
            // We check for nulls? No, if the user clears the text in frontend, 
            // we want to clear it in DB too. So we assign directly.

            // However, to be safe against partial updates, we can check != null
            // For this project, let's assume the frontend sends the whole object.

            user.AboutMe = updateDto.AboutMe;
            user.WhereToGo = updateDto.WhereToGo;
            user.MyWork = updateDto.MyWork;
            user.SpendTime = updateDto.SpendTime;
            user.Pets = updateDto.Pets;
            user.BornDecade = updateDto.BornDecade;
            user.School = updateDto.School;
            user.UselessSkill = updateDto.UselessSkill;
            user.FunFact = updateDto.FunFact;
            user.FavoriteSong = updateDto.FavoriteSong;
            user.ObsessedWith = updateDto.ObsessedWith;
            user.BiographyTitle = updateDto.BiographyTitle;
            user.Languages = updateDto.Languages;
            user.WhereILive = updateDto.WhereILive;

            user.UpdatedAt = DateTime.UtcNow;

            return await _userManager.UpdateAsync(user);
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

        //public async Task<IdentityResult> ResetPasswordAsync(ResetPasswordDto resetDto)
        //{
        //    var user = await _userManager.FindByEmailAsync(resetDto.Email);
        //    if (user == null)
        //    {
        //        // Don't reveal that the user does not exist.
        //        // The token validation will fail anyway, but this is an extra precaution.
        //        // We return a generic error message that will be handled by the controller.
        //        return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "Invalid password reset request." });
        //    }

        //    // =========================================================
        //    // 1. FIX: Handle URL Encoding
        //    // =========================================================

        //    // This converts "%2F" back to "/" and "%2B" back to "+"
        //    string decodedToken = Uri.UnescapeDataString(resetDto.Token);

        //    // 2. Extra Safety: Sometimes web browsers turn '+' into ' ' (space).
        //    // If the token has spaces, put the plus signs back.
        //    // (Identity tokens are Base64 and should not have spaces).
        //    if (decodedToken.Contains(" "))
        //    {
        //        decodedToken = decodedToken.Replace(" ", "+");
        //    }

        //    // 3. Use the clean, decoded token
        //    var result = await _userManager.ResetPasswordAsync(user, decodedToken, resetDto.NewPassword);

        //    return result;
        //}

        public async Task<IdentityResult> ResetPasswordAsync(ResetPasswordDto resetDto)
        {
            var user = await _userManager.FindByEmailAsync(resetDto.Email);
            if (user == null)
            {
                // Don't reveal that the user does not exist.
                return IdentityResult.Failed(new IdentityError { Code = "UserNotFound", Description = "Invalid password reset request." });
            }

            string decodedToken = Uri.UnescapeDataString(resetDto.Token);

            // ✅ 2. Extra Safety: Sometimes web browsers turn '+' into ' ' (space).
            if (decodedToken.Contains(" "))
            {
                decodedToken = decodedToken.Replace(" ", "+");
            }

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
            // 1. Find User
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new Exception("User not found");

            // 2. Validate File Existence
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file uploaded.");

            // 3. Validate Extensions
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
                throw new ArgumentException("Invalid file type. Only JPG, PNG, and WebP are allowed.");

            // 4. Validate Size (5MB)
            if (file.Length > 5 * 1024 * 1024)
                throw new ArgumentException("File size exceeds 5MB limit.");

            // 5. Determine Path (The Fix for 404s)
            // If _environment.WebRootPath is null, manually point to the wwwroot folder in the project
            string webRootPath = _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            var uploadsFolder = Path.Combine(webRootPath, "uploads", "profiles");

            // 6. Create Directory if it doesn't exist
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // 7. Generate Unique Filename (UserId_Guid.jpg) to prevent caching issues
            var fileName = $"{userId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // 8. Save File to Disk
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 9. Update Database Record
            // We store the relative path so the frontend can append the Base URL
            var relativePath = $"/uploads/profiles/{fileName}";

            user.ProfileImageUrl = relativePath;
            user.UpdatedAt = DateTime.UtcNow;

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
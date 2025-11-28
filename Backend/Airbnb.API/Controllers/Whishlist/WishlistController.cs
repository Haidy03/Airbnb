using Airbnb.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Airbnb.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class WishlistController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WishlistController(ApplicationDbContext context)
        {
            _context = context;
        }

        private string GetCurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

        // =================================================
        // 1. Toggle & Check EXPERIENCE
        // =================================================

        [HttpPost("toggle/{experienceId}")]
        public async Task<IActionResult> ToggleExperienceWishlist(int experienceId)
        {
            var userId = GetCurrentUserId();

            var existingItem = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.ExperienceId == experienceId);

            if (existingItem != null)
            {
                _context.Wishlists.Remove(existingItem);
                await _context.SaveChangesAsync();
                return Ok(new { isWishlisted = false, message = "Removed from wishlist" });
            }
            else
            {
                var newItem = new Wishlist { UserId = userId, ExperienceId = experienceId };
                _context.Wishlists.Add(newItem);
                await _context.SaveChangesAsync();
                return Ok(new { isWishlisted = true, message = "Added to wishlist" });
            }
        }

        [HttpGet("check/{experienceId}")]
        public async Task<IActionResult> CheckExperienceIsWishlisted(int experienceId)
        {
            var userId = GetCurrentUserId();
            var exists = await _context.Wishlists.AnyAsync(w => w.UserId == userId && w.ExperienceId == experienceId);
            return Ok(new { isWishlisted = exists });
        }

        // =================================================
        // 2. Toggle & Check PROPERTY (HOMES)
        // =================================================

        [HttpPost("toggle-property/{propertyId}")]
        public async Task<IActionResult> TogglePropertyWishlist(int propertyId)
        {
            var userId = GetCurrentUserId();

            // ملاحظة: تأكدي أن نوع PropertyId في جدول Wishlist هو (int?) ليتوافق مع هذا الكود
            // لو كان string في Property Table، لازم تغيري الباراميتر هنا لـ string
            // لكن بناءً على الكود السابق افترضنا انه int

            var existingItem = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.UserId == userId && w.PropertyId == propertyId);

            if (existingItem != null)
            {
                _context.Wishlists.Remove(existingItem);
                await _context.SaveChangesAsync();
                return Ok(new { isWishlisted = false, message = "Property removed from wishlist" });
            }
            else
            {
                var newItem = new Wishlist { UserId = userId, PropertyId = propertyId };
                _context.Wishlists.Add(newItem);
                await _context.SaveChangesAsync();
                return Ok(new { isWishlisted = true, message = "Property added to wishlist" });
            }
        }

        [HttpGet("check-property/{propertyId}")]
        public async Task<IActionResult> CheckPropertyIsWishlisted(int propertyId)
        {
            var userId = GetCurrentUserId();
            var exists = await _context.Wishlists.AnyAsync(w => w.UserId == userId && w.PropertyId == propertyId);
            return Ok(new { isWishlisted = exists });
        }

        // =================================================
        // 3. GET ALL WISHLIST ITEMS (Merged) - الحل هنا
        // =================================================

        [HttpGet]
        public async Task<IActionResult> GetMyWishlist()
        {
            var userId = GetCurrentUserId();

            // 1. جلب التجارب (Experiences)
            var experiences = await _context.Wishlists
                .Include(w => w.Experience).ThenInclude(e => e.Images)
                .Where(w => w.UserId == userId && w.ExperienceId != null)
                .Select(w => new
                {
                    Id = w.Experience.Id.ToString(),
                    Title = w.Experience.Title,
                    Price = w.Experience.PricePerPerson,
                    Type = "Experience",
                    // صورة التجربة
                    Image = w.Experience.Images.FirstOrDefault(i => i.IsPrimary).ImageUrl
                            ?? w.Experience.Images.FirstOrDefault().ImageUrl
                            ?? "assets/images/placeholder.jpg",
                    Rating = 0.0, // أو w.Experience.AverageRating
                    City = w.Experience.City ?? "",
                    Country = w.Experience.Country ?? "",
                    Currency = "EGP"
                })
                .ToListAsync();

            // 2. جلب البيوت (Properties)
            var properties = await _context.Wishlists
                .Include(w => w.Property).ThenInclude(p => p.Images) // تأكدي ان العلاقة Images موجودة في Property
                .Include(w => w.Property) // للوصول لبيانات الموقع لو موجودة مباشرة
                .Where(w => w.UserId == userId && w.PropertyId != null)
                .Select(w => new
                {
                    Id = w.Property.Id.ToString(),
                    Title = w.Property.Title,
                    Price = w.Property.PricePerNight,
                    Type = "Home",
                    // صورة البيت (تأكدي من أسماء الحقول في جدول PropertyImages عندك)
                    Image = w.Property.Images.FirstOrDefault(i => i.IsPrimary).ImageUrl
                            ?? "assets/images/placeholder-property.jpg",
                    Rating = 0.0,
                    City = w.Property.City ?? "",
                    Country = w.Property.Country ?? "",
                    Currency = "EGP"
                })
                .ToListAsync();

            // دمج القائمتين في قائمة واحدة
            var result = experiences.Concat(properties);

            return Ok(new { success = true, data = result });
        }
    }
}
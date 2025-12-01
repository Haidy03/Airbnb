using Airbnb.API.DTOs.Services;
using Airbnb.API.Services.Interfaces; // استخدام السيرفس
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicesController : ControllerBase
    {
        private readonly IServicesService _servicesService; 
        public ServicesController(IServicesService servicesService)
        {
            _servicesService = servicesService;
        }

        // GET: api/Services/featured
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedServices()
        {
            var result = await _servicesService.GetFeaturedServicesAsync();
            return Ok(new { success = true, data = result });
        }

        // GET: api/Services/category/Chefs
        [HttpGet("category/{categoryName}")]
        public async Task<IActionResult> GetServicesByCategory(string categoryName)
        {
            var result = await _servicesService.GetServicesByCategoryAsync(categoryName);
            return Ok(new { success = true, data = result });
        }

        // POST: api/Services
        [HttpPost]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> CreateService([FromBody] CreateServiceDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _servicesService.CreateServiceAsync(userId, dto);

            return Ok(new { success = true, message = "Service created successfully and pending approval." });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetServiceDetails(int id)
        {
            var service = await _servicesService.GetServiceByIdAsync(id);
            if (service == null) return NotFound(new { success = false, message = "Service not found" });

            return Ok(new { success = true, data = service });
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories()
        {
           var categories = await _servicesService.GetAllCategoriesAsync();
            return Ok(new { success = true, data = categories });
        }

        // ✅ 1. NEW: Get Host's Own Services (My Services Dashboard)
        [HttpGet("my-services")]
        [Authorize(Roles = "Host")]
        public async Task<IActionResult> GetMyServices()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _servicesService.GetHostServicesAsync(userId);
            return Ok(new { success = true, data = result });
        }

        // ✅ 2. NEW: Book a Service (Guest Action)
        [HttpPost("book")]
        [Authorize] // Guests and Hosts can book
        public async Task<IActionResult> BookService([FromBody] BookServiceDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var bookingId = await _servicesService.BookServiceAsync(userId, dto);

                return Ok(new
                {
                    success = true,
                    message = "Service booking created successfully",
                    bookingId = bookingId
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

    }
}
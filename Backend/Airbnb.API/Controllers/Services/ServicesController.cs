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
        private readonly IServicesService _servicesService; // تغيير النوع هنا

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
    }
}
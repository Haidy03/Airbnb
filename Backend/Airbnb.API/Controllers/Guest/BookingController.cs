using Airbnb.API.DTOs.Booking;
using Airbnb.API.Models;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Guest
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;
        private readonly UserManager<ApplicationUser> _userManager;

        public BookingController(IBookingService bookingService, UserManager<ApplicationUser> userManager)
        {
            _bookingService = bookingService;
            _userManager = userManager;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto createDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var user = await _userManager.FindByIdAsync(userId);
            //if (user == null || !user.IsVerified)
            //{
            //    return StatusCode(403, new 
            //    { 
            //        message = "Identity verification required.", 
            //        details = "You must verify your ID before making a booking." 
            //    });
            //}
            try
            {
                var result = await _bookingService.CreateBookingAsync(userId, createDto);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpGet("my-trips")]
        public async Task<IActionResult> GetMyTrips()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _bookingService.GetGuestBookingsAsync(userId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTripDetails(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var booking = await _bookingService.GetBookingByIdAsync(id, userId);

            if (booking == null)
            {
                return NotFound(new { message = "Booking not found" });
            }

            return Ok(booking);
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelTrip(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            try
            {
                var success = await _bookingService.CancelBookingAsync(id, userId);
                if (!success) return NotFound();
                return Ok(new { message = "Booking cancelled successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost("{id}/confirm-payment")]
        public async Task<IActionResult> ConfirmBookingPayment(int id)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // هذه الدالة ستقوم بتحويل الحالة من AwaitingPayment إلى Confirmed
                var success = await _bookingService.ConfirmBookingAfterPaymentAsync(id, userId);

                if (!success)
                    return BadRequest(new { message = "Cannot confirm booking. Either it's not awaiting payment or you are not the owner." });

                return Ok(new { message = "Booking Confirmed Successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

    }
}
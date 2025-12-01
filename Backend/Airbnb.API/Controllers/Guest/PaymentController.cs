using Airbnb.API.DTOs.Booking; // تأكدي من الـ Namespace
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Airbnb.API.Controllers.Guest
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;
        private readonly IBookingService _bookingService; // 1. نحتاج السيرفس دي عشان نجيب بيانات الحجز

        public PaymentController(PaymentService paymentService, IBookingService bookingService)
        {
            _paymentService = paymentService;
            _bookingService = bookingService;
        }

        // ---------------------------------------------------------
        // 1. للدفع الفوري (Instant Book) - إنشاء حجز جديد
        // ---------------------------------------------------------
        [HttpPost("create-checkout")]
        public IActionResult CreateCheckoutSession([FromBody] CheckoutRequest request)
        {
            try
            {
                var successUrl = "http://localhost:4200/payment-success";
                var cancelUrl = "http://localhost:4200/checkout";

                var paymentUrl = _paymentService.CreateCheckoutSession(
                    request.PropertyTitle,
                    request.Amount,
                    successUrl,
                    cancelUrl
                );

                return Ok(new { url = paymentUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // ---------------------------------------------------------
        // 2. ✅ الجديد: للدفع لحجز موجود (Request -> Approved -> Pay)
        // ---------------------------------------------------------
        [HttpPost("pay-booking/{bookingId}")]
        public async Task<IActionResult> PayForBooking(int bookingId)
        {
            try
            {
                // أ. معرفة المستخدم الحالي
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // ب. جلب بيانات الحجز من الداتا بيز (للأمان، لا نعتمد على الفرونت إند في السعر)
                var booking = await _bookingService.GetBookingByIdAsync(bookingId, userId);

                if (booking == null)
                    return NotFound(new { message = "Booking not found" });

                // ج. التأكد أن الحالة تسمح بالدفع
                if (booking.Status != "AwaitingPayment")
                {
                    return BadRequest(new { message = "This booking is not awaiting payment." });
                }

                // د. تجهيز روابط العودة
                // نمرر الـ bookingId في رابط النجاح عشان الفرونت يعرف يحدث مين
                var successUrl = $"http://localhost:4200/payment-success?bookingId={bookingId}";
                var cancelUrl = "http://localhost:4200/trips";

                // هـ. إنشاء رابط Stripe بالسعر المسجل في الحجز
                var paymentUrl = _paymentService.CreateCheckoutSession(
                    booking.PropertyTitle,
                    booking.TotalPrice, // السعر من الداتا بيز
                    successUrl,
                    cancelUrl
                );

                return Ok(new { url = paymentUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
        // ---------------------------------------------------------
        // 3. ✅ خدمة الدفع للخدمات (Services)
        // ---------------------------------------------------------
        [HttpPost("create-service-checkout")]
        public IActionResult CreateServiceCheckout([FromBody] ServiceCheckoutRequest request)
        {
            try
            {
                var successUrl = "http://localhost:4200/payment-success";
                var cancelUrl = "http://localhost:4200/trips"; // أو صفحة الخدمة

                // هنا نقوم بإنشاء جلسة Stripe مباشرة
                // ملاحظة: في تطبيق حقيقي يفضل جلب السعر من الداتابيز باستخدام ServiceId و PackageId لضمان الأمان

                var paymentUrl = _paymentService.CreateCheckoutSession(
                    request.ServiceName,
                    request.TotalPrice,
                    successUrl,
                    cancelUrl
                );

                return Ok(new { url = paymentUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

    }
    // DTO Helper
    public class ServiceCheckoutRequest
    {
        public string ServiceName { get; set; }
        public decimal TotalPrice { get; set; }
        public int ServiceId { get; set; }
    }
    public class CheckoutRequest
    {
        public string PropertyTitle { get; set; }
        public decimal Amount { get; set; }
    }
}
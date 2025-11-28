using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly PaymentService _paymentService;

    public PaymentController(PaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost("create-checkout")]
    public IActionResult CreateCheckoutSession(decimal amount, string propertyTitle)
    {
        // In a real app, you would get amount/title from the Booking ID, not the params

        // These URLs are where Stripe sends the user back to your Frontend
        var successUrl = "http://localhost:4200/payment-success";
        var cancelUrl = "http://localhost:4200/payment-failed";

        var paymentUrl = _paymentService.CreateCheckoutSession(propertyTitle, amount, successUrl, cancelUrl);

        return Ok(new { url = paymentUrl });
    }
}
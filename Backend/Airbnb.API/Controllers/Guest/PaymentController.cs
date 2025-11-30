using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[Route("api/[controller]")]
[ApiController]
 [Authorize] // ❌ علق عليها للاختبار
public class PaymentController : ControllerBase
{
    private readonly PaymentService _paymentService;

    public PaymentController(PaymentService paymentService)
    {
        _paymentService = paymentService;
    }

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
}

public class CheckoutRequest
{
    public string PropertyTitle { get; set; }
    public decimal Amount { get; set; }
}
using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Configuration;

public class PaymentService
{
    public PaymentService(IConfiguration config)
    {
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }

    public string CreateCheckoutSession(string propertyTitle, decimal amount, string successUrl, string cancelUrl)
    {
        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            Mode = "payment",

            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(amount * 100), 
                        Currency = "egp",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = propertyTitle,
                            Description = "Airbnb Clone Booking"
                        },
                    },
                    Quantity = 1,
                },
            },

            SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
            CancelUrl = cancelUrl,
        };

        var service = new SessionService();
        Session session = service.Create(options);

        return session.Url;
    }
}
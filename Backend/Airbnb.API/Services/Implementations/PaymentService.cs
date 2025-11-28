using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Configuration;

public class PaymentService
{
    public PaymentService(IConfiguration config)
    {
        // Initialize Stripe with your Secret Key
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }

    public string CreateCheckoutSession(string propertyTitle, decimal amount, string successUrl, string cancelUrl)
    {
        var options = new SessionCreateOptions
        {
            // 1. Session Type
            PaymentMethodTypes = new List<string> { "card" },
            Mode = "payment",

            // 2. Product Details
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(amount * 100), // Stripe uses cents (e.g. $10.00 = 1000)
                        Currency = "usd", // Use USD for testing to avoid weird currency errors
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = propertyTitle,
                            Description = "Airbnb Clone Booking"
                        },
                    },
                    Quantity = 1,
                },
            },

            // 3. Redirect URLs (Where to go after payment)
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
        };

        var service = new SessionService();
        Session session = service.Create(options);

        return session.Url; // This is the link you send to the frontend
    }
}
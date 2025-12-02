namespace Airbnb.API.DTOs.Admin
{
    public class PlatformSettingsDto
    {
        public string PlatformName { get; set; } = "Airbnb Clone";
        public decimal PlatformFeePercentage { get; set; } = 15;
        public string Currency { get; set; } = "EGP";
    }
}
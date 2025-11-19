namespace Airbnb.API.DTOs.Auth
{
    public class AuthResponseDto
    {
        public string Token { get; set; }
        public string UserId { get; set; }
        public string Email { get; set; }
    }
}
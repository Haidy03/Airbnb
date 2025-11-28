using Airbnb.API.DTOs.Common;

namespace Airbnb.API.Services.Interfaces
{
    public interface IChatService
    {
        // Added userId parameter
        Task<ChatResponseDto> GetResponseAsync(string userMessage, string userId);
    }
}
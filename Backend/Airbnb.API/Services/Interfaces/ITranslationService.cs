using Airbnb.API.DTOs.Common;

namespace Airbnb.API.Services.Interfaces
{
    public interface ITranslationService
    {
        Task<TranslationResponseDto> TranslateToArabicAsync(string text);
    }
}
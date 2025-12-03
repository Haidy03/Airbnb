using Airbnb.API.DTOs.Common;
using Airbnb.API.Services.Interfaces;
using GTranslate.Translators; // From the package

namespace Airbnb.API.Services.Implementations
{
    public class TranslationService : ITranslationService
    {
        private readonly GoogleTranslator _translator;

        public TranslationService()
        {
            _translator = new GoogleTranslator();
        }

        public async Task<TranslationResponseDto> TranslateToArabicAsync(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return new TranslationResponseDto
                {
                    OriginalText = text,
                    TranslatedText = text,
                    DetectedLanguage = "Unknown"
                };
            }

            var result = await _translator.TranslateAsync(text, "ar");

            return new TranslationResponseDto
            {
                OriginalText = text,
                TranslatedText = result.Translation,
                DetectedLanguage = result.SourceLanguage.Name
            };
        }
    }
}
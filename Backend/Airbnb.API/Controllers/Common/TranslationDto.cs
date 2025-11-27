namespace Airbnb.API.DTOs.Common
{
    public class TranslationRequestDto
    {
        public string Text { get; set; }
    }

    public class TranslationResponseDto
    {
        public string OriginalText { get; set; }
        public string TranslatedText { get; set; }
        public string DetectedLanguage { get; set; }
    }
}
using Airbnb.API.DTOs.Common;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Airbnb.API.Services.Implementations
{
    public class ChatService : IChatService
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache; // <-- 2. Add Cache

        // 3. Inject Cache
        public ChatService(
            IPropertyRepository propertyRepository,
            IConfiguration config,
            HttpClient httpClient,
            IMemoryCache cache)
        {
            _propertyRepository = propertyRepository;
            _config = config;
            _httpClient = httpClient;
            _cache = cache;
        }

        public async Task<ChatResponseDto> GetResponseAsync(string userMessage, string userId)
        {
            // ---------------------------------------------------------
            // A. RETRIEVE HISTORY
            // ---------------------------------------------------------
            string cacheKey = $"ChatHistory_{userId}";

            // Try to get existing history, or start new if none exists
            if (!_cache.TryGetValue(cacheKey, out List<string> conversationHistory))
            {
                conversationHistory = new List<string>();
            }

            // ---------------------------------------------------------
            // B. PREPARE DATA (Context)
            // ---------------------------------------------------------
            var properties = await _propertyRepository.GetFeaturedPropertiesAsync(20);
            var propertyContext = new StringBuilder();
            foreach (var p in properties)
            {
                propertyContext.AppendLine($"- ID: {p.Id}, Title: {p.Title}, City: {p.City}, Price: ${p.PricePerNight}");
            }

            // ---------------------------------------------------------
            // C. BUILD THE PROMPT WITH MEMORY
            // ---------------------------------------------------------
            // We format the history as: "User: ... \n AI: ... \n"
            var historyText = string.Join("\n", conversationHistory);

            var systemInstruction = $@"
                You are a smart Airbnb assistant. 
                Use the data below to answer.
                
                AVAILABLE PROPERTIES:
                {propertyContext}

                CONVERSATION HISTORY:
                {historyText}

                Current User Question: {userMessage}
                
                Answer the current question based on the history and properties. 
                Keep it short.
            ";

            // ---------------------------------------------------------
            // D. CALL GOOGLE API
            // ---------------------------------------------------------
            var apiKey = _config["Gemini:ApiKey"];
            var url = $"{_config["Gemini:Url"]}?key={apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = systemInstruction } } }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                // READ THE REAL ERROR FROM GOOGLE
                var errorContent = await response.Content.ReadAsStringAsync();

                // Log it to your console so you can see it in Visual Studio
                Console.WriteLine($"[Gemini Error] Status: {response.StatusCode}, Details: {errorContent}");

                // Return it to Swagger so you can read it
                return new ChatResponseDto { Response = $"Google API Error: {response.StatusCode} - {errorContent}" };
            }

            var responseString = await response.Content.ReadAsStringAsync();
            var geminiResponse = JsonSerializer.Deserialize<GeminiApiResponse>(responseString);
            var aiReply = geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text ?? "No response.";

            // ---------------------------------------------------------
            // E. UPDATE MEMORY
            // ---------------------------------------------------------
            // Add current exchange to history
            conversationHistory.Add($"User: {userMessage}");
            conversationHistory.Add($"AI: {aiReply}");

            // Keep only last 10 messages to prevent "Context Limit" errors
            if (conversationHistory.Count > 10)
            {
                conversationHistory.RemoveRange(0, conversationHistory.Count - 10);
            }

            // Save back to cache for 30 minutes
            _cache.Set(cacheKey, conversationHistory, TimeSpan.FromMinutes(30));

            return new ChatResponseDto { Response = aiReply };
        }
    }

    // Helper classes to parse Gemini Response
    public class GeminiApiResponse
    {
        [JsonPropertyName("candidates")]
        public List<Candidate> Candidates { get; set; }
    }
    public class Candidate
    {
        [JsonPropertyName("content")]
        public Content Content { get; set; }
    }
    public class Content
    {
        [JsonPropertyName("parts")]
        public List<Part> Parts { get; set; }
    }
    public class Part
    {
        [JsonPropertyName("text")]
        public string Text { get; set; }
    }
}
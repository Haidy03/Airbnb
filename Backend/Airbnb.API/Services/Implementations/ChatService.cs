using Airbnb.API.DTOs.Common;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Airbnb.API.Services.Implementations
{
    public class ChatService : IChatService
    {
        private readonly IPropertyRepository _propertyRepository;
        private readonly IExperienceRepository _experienceRepository;
        private readonly IServiceRepository _serviceRepository;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;

        public ChatService(
            IPropertyRepository propertyRepository,
            IExperienceRepository experienceRepository,
            IServiceRepository serviceRepository,
            IConfiguration config,
            HttpClient httpClient,
            IMemoryCache cache)
        {
            _propertyRepository = propertyRepository;
            _experienceRepository = experienceRepository;
            _serviceRepository = serviceRepository;
            _config = config;
            _httpClient = httpClient;
            _cache = cache;
        }

        public async Task<ChatResponseDto> GetResponseAsync(string userMessage, string userId)
        {
            // 1. RETRIEVE HISTORY
            string cacheKey = $"ChatHistory_{userId}";
            if (!_cache.TryGetValue(cacheKey, out List<string> conversationHistory))
            {
                conversationHistory = new List<string>();
            }

            // 2. FETCH DATA
            var properties = await _propertyRepository.GetFeaturedPropertiesAsync(5); // Reduced count to save tokens
            var experiences = await _experienceRepository.GetFeaturedExperiencesAsync(5);
            var services = await _serviceRepository.GetFeaturedServicesAsync();

            // 3. BUILD CONTEXT
            var contextBuilder = new StringBuilder();

            contextBuilder.AppendLine("=== HOMES / STAYS ===");
            foreach (var p in properties)
                contextBuilder.AppendLine($"- [HOME] ID: {p.Id}, Title: {p.Title}, City: {p.City}, Price: {p.PricePerNight} EGP");

            contextBuilder.AppendLine("\n=== EXPERIENCES ===");
            foreach (var e in experiences)
                contextBuilder.AppendLine($"- [EXPERIENCE] ID: {e.Id}, Title: {e.Title}, City: {e.City}, Price: {e.PricePerPerson} EGP");

            contextBuilder.AppendLine("\n=== SERVICES ===");
            foreach (var s in services)
            {
                var loc = !string.IsNullOrEmpty(s.City) ? s.City : (s.CoveredAreas ?? "General");
                contextBuilder.AppendLine($"- [SERVICE] ID: {s.Id}, Title: {s.Title}, Location: {loc}, Price: {s.PricePerUnit} EGP");
            }

            var historyText = string.Join("\n", conversationHistory);

            var systemInstruction = $@"
                You are a smart Airbnb assistant. Use the inventory below to answer.
                
                INVENTORY:
                {contextBuilder}

                HISTORY:
                {historyText}

                Recommend items from the list based on the user's request, if the user's request's isn't available, you start apologizing and try to suggest something close to the request
                If they ask for catering or yoga, check SERVICES or EXPERIENCES.
                don't make the reply too long.
            ";

            // 4. CALL OPENAI API
            var apiKey = _config["OpenAI:ApiKey"];
            var url = _config["OpenAI:Url"];
            var model = _config["OpenAI:Model"];

            var requestBody = new
            {
                model = model,
                messages = new[]
                {
                    new { role = "system", content = systemInstruction },
                    new { role = "user", content = userMessage }
                },
                temperature = 0.7
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            // ✅ OpenAI requires the Key in the Header, not the URL
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.PostAsync(url, jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[OpenAI Error] {response.StatusCode}: {errorContent}");
                return new ChatResponseDto { Response = "I am having trouble connecting to the AI brain right now." };
            }

            var responseString = await response.Content.ReadAsStringAsync();
            var openAiResponse = JsonSerializer.Deserialize<OpenAiApiResponse>(responseString);

            // Extract the text from OpenAI's structure
            var aiReply = openAiResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "No response.";

            // 5. UPDATE MEMORY
            conversationHistory.Add($"User: {userMessage}");
            conversationHistory.Add($"AI: {aiReply}");

            if (conversationHistory.Count > 10) conversationHistory.RemoveRange(0, conversationHistory.Count - 10);
            _cache.Set(cacheKey, conversationHistory, TimeSpan.FromMinutes(30));

            return new ChatResponseDto { Response = aiReply };
        }
    }

    // === NEW HELPER CLASSES FOR OPENAI ===
    public class OpenAiApiResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenAiChoice> Choices { get; set; }
    }

    public class OpenAiChoice
    {
        [JsonPropertyName("message")]
        public OpenAiMessage Message { get; set; }
    }

    public class OpenAiMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; }
    }
}
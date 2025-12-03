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
        private readonly IExperienceRepository _experienceRepository; // <--- NEW: Inject this
        private readonly IServiceRepository _serviceRepository;       // <--- NEW: Inject this
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;

        public ChatService(
            IPropertyRepository propertyRepository,
            IExperienceRepository experienceRepository, // <--- Add parameter
            IServiceRepository serviceRepository,       // <--- Add parameter
            IConfiguration config,
            HttpClient httpClient,
            IMemoryCache cache)
        {
            _propertyRepository = propertyRepository;
            _experienceRepository = experienceRepository; // <--- Assign
            _serviceRepository = serviceRepository;       // <--- Assign
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

            // 2. FETCH DATA (The Missing Part)
            var properties = await _propertyRepository.GetFeaturedPropertiesAsync(10);
            var experiences = await _experienceRepository.GetFeaturedExperiencesAsync(10); // <--- Get Experiences
            var services = await _serviceRepository.GetFeaturedServicesAsync();            // <--- Get Services

            // 3. BUILD CONTEXT
            var contextBuilder = new StringBuilder();

            // --- Properties ---
            contextBuilder.AppendLine("=== HOMES / STAYS ===");
            foreach (var p in properties)
            {
                contextBuilder.AppendLine($"- [HOME] ID: {p.Id}, Title: {p.Title}, City: {p.City}, Price: {p.PricePerNight} EGP/night");
            }

            // --- Experiences (NEW) ---
            contextBuilder.AppendLine("\n=== EXPERIENCES / ACTIVITIES ===");
            foreach (var e in experiences)
            {
                contextBuilder.AppendLine($"- [EXPERIENCE] ID: {e.Id}, Title: {e.Title}, City: {e.City}, Price: {e.PricePerPerson} EGP/person");
            }

            // --- Services (NEW) ---
            contextBuilder.AppendLine("\n=== SERVICES / PROFESSIONAL HELP ===");
            foreach (var s in services)
            {
                // Handle null city if it's an online/covered area service
                var loc = !string.IsNullOrEmpty(s.City) ? s.City : (s.CoveredAreas ?? "General");
                contextBuilder.AppendLine($"- [SERVICE] ID: {s.Id}, Title: {s.Title}, Location: {loc}, Price: {s.PricePerUnit} EGP");
            }

            // 4. BUILD PROMPT
            // We format the history as: "User: ... \n AI: ... \n"
            var historyText = string.Join("\n", conversationHistory);

            var systemInstruction = $@"
                You are a smart Airbnb assistant, you need to help with planning a stay or go on a trip or get a service, if the request was not available, you can start vy saying 'i wish i can help you but the service you asked for is currently unavailable', then start recommending other services, you must also end the sentence with a question like would like to go to another place?, or can i help you with anything else?
                Use the data below to answer.
                
                AVAILABLE INVENTORY:
                {contextBuilder}

                CONVERSATION HISTORY:
                {historyText}

                Current User Question: {userMessage}
                
                Answer the current question based on the history and inventory, and always ignore the metadata given like ID and studd you can just mention the names location and prices, you need to sound like a normal human
                If the user asks for 'Catering' or 'Yoga', look in the [SERVICE] or [EXPERIENCE] sections.
                Keep it short.
            ";

            // --- DEBUG LOGGING ---
            // Where to find this: In Visual Studio, go to "Output" window and select "ASP.NET Core Web Server" from the dropdown
            Console.WriteLine("================ AI PROMPT START ================");
            Console.WriteLine(contextBuilder.ToString()); // Print just the inventory to check
            Console.WriteLine("================ AI PROMPT END   ================");

            // 5. CALL GOOGLE
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
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[Gemini Error] Status: {response.StatusCode}, Details: {errorContent}");
                return new ChatResponseDto { Response = "I am having trouble connecting to the AI brain right now." };
            }

            var responseString = await response.Content.ReadAsStringAsync();
            var geminiResponse = JsonSerializer.Deserialize<GeminiApiResponse>(responseString);
            var aiReply = geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text ?? "No response.";

            // 6. UPDATE MEMORY
            conversationHistory.Add($"User: {userMessage}");
            conversationHistory.Add($"AI: {aiReply}");

            if (conversationHistory.Count > 10)
            {
                conversationHistory.RemoveRange(0, conversationHistory.Count - 10);
            }

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
namespace AirbnbApi.DTOs
{
    public class PropertyTypeDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string IconType { get; set; } = string.Empty;
        public string? Category { get; set; }
        public int DisplayOrder { get; set; }
    }
}
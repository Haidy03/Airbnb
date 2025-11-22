namespace Airbnb.API.DTOs.Admin
{
    public class PropertyTypeStatsDto
    {
        public string PropertyType { get; set; }
        public int Count { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}

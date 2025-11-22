namespace Airbnb.API.DTOs.Admin
{
    public class PropertyOccupancyDto
    {
        public int PropertyId { get; set; }
        public string PropertyTitle { get; set; }
        public double OccupancyRate { get; set; }
        public int TotalBookings { get; set; }
        public decimal Revenue { get; set; }
    }
}

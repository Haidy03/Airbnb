namespace Airbnb.API.DTOs.Admin
{
    public class OccupancyReportDto
    {
        public double OverallOccupancyRate { get; set; }
        public List<PropertyOccupancyDto> TopProperties { get; set; }
        public List<PropertyOccupancyDto> LowPerformingProperties { get; set; }
    }
}

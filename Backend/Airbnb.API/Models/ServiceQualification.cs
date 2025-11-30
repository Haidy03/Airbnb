namespace Airbnb.API.Models
{
    public class ServiceQualification
    {
        public int Id { get; set; }
        public int ServiceId { get; set; }
        public string Title { get; set; } // e.g. "4 years of experience"
        public string Description { get; set; } // e.g. "Personal trainer certification..."
        public string Icon { get; set; } // e.g. "bi-clock", "bi-award"
    }
}
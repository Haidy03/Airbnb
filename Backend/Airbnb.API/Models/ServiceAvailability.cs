using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Airbnb.API.Models
{
    public class ServiceAvailability
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ServiceId { get; set; }

        [JsonIgnore] 
        [ForeignKey("ServiceId")]
        public virtual Service Service { get; set; }

        [Required]
        public DayOfWeek DayOfWeek { get; set; }

      
        [Required]
        public TimeSpan StartTime { get; set; }
    }
}
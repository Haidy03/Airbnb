using System.ComponentModel.DataAnnotations;

namespace Airbnb.API.DTOs.Experiences
{
    public class BookExperienceDto
    {
        [Required]
        public int AvailabilityId { get; set; }

        [Required]
        [Range(1, 100)]
        public int NumberOfGuests { get; set; }

        [MaxLength(500)]
        public string? SpecialRequests { get; set; }
    }

    public class ExperienceBookingDto
    {
        public int Id { get; set; }
        public int ExperienceId { get; set; }
        public string ExperienceTitle { get; set; }
        public string? ExperienceImage { get; set; }
        public int AvailabilityId { get; set; } 
        public string GuestId { get; set; }
        public string GuestName { get; set; }

        public DateTime Date { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }

        public int NumberOfGuests { get; set; }
        public decimal PricePerPerson { get; set; }
        public decimal TotalPrice { get; set; }

        public string Status { get; set; }   //Pending=0, Confirmed=1, Cancelled=2, Completed=3
        public string? SpecialRequests { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }
}
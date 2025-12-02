//using System;
//using System.Collections.Generic;
//using System.ComponentModel.DataAnnotations;
//using System.ComponentModel.DataAnnotations.Schema;
//using System.Linq;

//namespace Airbnb.API.Models
//{
//    public class Conversation
//    {
//        [Key]
//        public int Id { get; set; }

//        public int? PropertyId { get; set; }

//        [ForeignKey("PropertyId")]
//        public virtual Property? Property { get; set; }

//        public int? BookingId { get; set; }

//        [ForeignKey("BookingId")]
//        public virtual Booking? Booking { get; set; }

//        [Required]
//        public string HostId { get; set; }

//        [ForeignKey("HostId")]
//        public virtual ApplicationUser Host { get; set; }

//        [Required]
//        public string GuestId { get; set; }

//        [ForeignKey("GuestId")]
//        public virtual ApplicationUser Guest { get; set; }

//        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

//        public DateTime? UpdatedAt { get; set; }

//        // Navigation Properties
//        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

//        // Computed Properties
//        [NotMapped]
//        public Message? LastMessage
//        {
//            get
//            {
//                return Messages?.OrderByDescending(m => m.SentAt).FirstOrDefault();
//            }
//        }

//        [NotMapped]
//        public int UnreadCount
//        {
//            get
//            {
//                return Messages?.Count(m => !m.IsRead && m.ReceiverId == HostId) ?? 0;
//            }
//        }
//    }
//}


using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace Airbnb.API.Models
{
    public class Conversation
    {
        [Key]
        public int Id { get; set; }

        public int? PropertyId { get; set; }

        [ForeignKey("PropertyId")]
        public virtual Property? Property { get; set; }
        public int? ServiceId { get; set; }
        [ForeignKey("ServiceId")]
        public virtual Service Service { get; set; }
        public int? BookingId { get; set; }

        [ForeignKey("BookingId")]
        public virtual Booking? Booking { get; set; }

        [Required]
        public string HostId { get; set; }

        [ForeignKey("HostId")]
        public virtual ApplicationUser Host { get; set; }

        [Required]
        public string GuestId { get; set; }

        [ForeignKey("GuestId")]
        public virtual ApplicationUser Guest { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

        // ✅ FIXED: LastMessage now properly ordered
        [NotMapped]
        public Message? LastMessage
        {
            get
            {
                return Messages?
                    .Where(m => m.DeletedAt == null) // Ignore deleted messages
                    .OrderByDescending(m => m.SentAt)
                    .FirstOrDefault();
            }
        }
    }
}
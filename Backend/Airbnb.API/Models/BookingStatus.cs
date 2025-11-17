using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public static class BookingStatus
    {
        public const string Pending = "Pending";
        public const string Confirmed = "Confirmed";
        public const string Cancelled = "Cancelled";
        public const string Completed = "Completed";
        public const string Rejected = "Rejected";
    }
}
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Airbnb.API.Models
{
    public static class ReviewType
    {
        public const string GuestToProperty = "GuestToProperty";
        public const string HostToGuest = "HostToGuest";
    }
}
using Airbnb.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Data
{
    public static class SeedServiceCategories
    {
        public static void Seed(ApplicationDbContext context)
        {
            if (context.ServiceCategories.Any()) return;

            var categories = new List<ServiceCategory>
            {
                new ServiceCategory { Name = "Catering", Icon = "https://cdn-icons-png.flaticon.com/512/1996/1996068.png", Description = "Food service for events" },
                new ServiceCategory { Name = "Chef", Icon = "https://cdn-icons-png.flaticon.com/512/1830/1830839.png", Description = "Personal cooking service" },
                new ServiceCategory { Name = "Hair styling", Icon = "https://cdn-icons-png.flaticon.com/512/3050/3050226.png", Description = "Professional hair styling" },
                new ServiceCategory { Name = "Makeup", Icon = "https://cdn-icons-png.flaticon.com/512/3050/3050253.png", Description = "Beauty and makeup" },
                new ServiceCategory { Name = "Massage", Icon = "https://cdn-icons-png.flaticon.com/512/2853/2853364.png", Description = "Relaxation and therapy" },
                new ServiceCategory { Name = "Nails", Icon = "https://cdn-icons-png.flaticon.com/512/3662/3662818.png", Description = "Manicure and pedicure" },
                new ServiceCategory { Name = "Personal training", Icon = "https://cdn-icons-png.flaticon.com/512/2548/2548530.png", Description = "Fitness coaching" },
                new ServiceCategory { Name = "Photography", Icon = "https://cdn-icons-png.flaticon.com/512/2983/2983067.png", Description = "Professional photography" },
                new ServiceCategory { Name = "Prepared meals", Icon = "https://cdn-icons-png.flaticon.com/512/706/706164.png", Description = "Ready-to-eat meals" },
                new ServiceCategory { Name = "Spa treatments", Icon = "https://cdn-icons-png.flaticon.com/512/2647/2647617.png", Description = "Wellness treatments" }
            };

            context.ServiceCategories.AddRange(categories);
            context.SaveChanges();
        }
    }
}
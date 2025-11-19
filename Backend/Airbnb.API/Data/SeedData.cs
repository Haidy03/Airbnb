using Airbnb.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            // 1. Check if database is already seeded
            if (context.Properties.Any())
            {
                return; // DB has been seeded
            }

            // 2. Create Amenities
            var amenities = new List<Amenity>
            {
                new Amenity { Name = "Wifi", Category = "Essentials", Icon = "wifi" },
                new Amenity { Name = "Kitchen", Category = "Essentials", Icon = "kitchen" },
                new Amenity { Name = "Air conditioning", Category = "Heating and cooling", Icon = "ac" },
                new Amenity { Name = "Pool", Category = "Features", Icon = "pool" },
                new Amenity { Name = "Beach access", Category = "Location", Icon = "beach" }
            };

            // Check if amenities exist before adding (just in case)
            if (!context.Amenities.Any())
            {
                await context.Amenities.AddRangeAsync(amenities);
                await context.SaveChangesAsync();
            }

            // 3. Create a Host User
            var hostUser = await userManager.FindByEmailAsync("host@test.com");
            if (hostUser == null)
            {
                hostUser = new ApplicationUser
                {
                    UserName = "host@test.com",
                    Email = "host@test.com",
                    FirstName = "Test",
                    LastName = "Host",
                    EmailConfirmed = true
                };
                await userManager.CreateAsync(hostUser, "Host@123");
                await userManager.AddToRoleAsync(hostUser, "Host");
            }

            // 4. Create Properties
            var properties = new List<Property>
            {
                new Property
                {
                    Title = "Luxury Nile View Apartment",
                    Description = "Amazing view of the Nile in Zamalek.",
                    HostId = hostUser.Id,
                    Address = "123 Zamalek St",
                    City = "Cairo",
                    Country = "Egypt",
                    PricePerNight = 2500, // 2500 EGP
                    MaxGuests = 4,
                    NumberOfBedrooms = 2,
                    NumberOfBathrooms = 2,
                    PropertyType = "Apartment",
                    IsActive = true,
                    IsApproved = true,
                    Images = new List<PropertyImage>
                    {
                        new PropertyImage { ImageUrl = "https://placehold.co/600x400?text=Nile+View", IsPrimary = true }
                    }
                },
                new Property
                {
                    Title = "Cozy Beach House",
                    Description = "Relax by the sea in beautiful Dahab.",
                    HostId = hostUser.Id,
                    Address = "Blue Hole Rd",
                    City = "Dahab",
                    Country = "Egypt",
                    PricePerNight = 1200, // Cheaper
                    MaxGuests = 2,
                    NumberOfBedrooms = 1,
                    NumberOfBathrooms = 1,
                    PropertyType = "House",
                    IsActive = true,
                    IsApproved = true,
                    Images = new List<PropertyImage>
                    {
                        new PropertyImage { ImageUrl = "https://placehold.co/600x400?text=Beach+House", IsPrimary = true }
                    }
                },
                new Property
                {
                    Title = "Modern Villa with Pool",
                    Description = "Huge villa perfect for parties.",
                    HostId = hostUser.Id,
                    Address = "El Gouna",
                    City = "Hurghada",
                    Country = "Egypt",
                    PricePerNight = 8000, // Expensive
                    MaxGuests = 10,
                    NumberOfBedrooms = 5,
                    NumberOfBathrooms = 4,
                    PropertyType = "Villa",
                    IsActive = true,
                    IsApproved = true,
                    Images = new List<PropertyImage>
                    {
                        new PropertyImage { ImageUrl = "https://placehold.co/600x400?text=Villa+Pool", IsPrimary = true }
                    }
                }
            };

            await context.Properties.AddRangeAsync(properties);
            await context.SaveChangesAsync();

            // 5. Link Amenities to Properties (Example: Villa gets Pool and Wifi)
            var villa = await context.Properties.FirstOrDefaultAsync(p => p.Title == "Modern Villa with Pool");
            var poolAmenity = await context.Amenities.FirstOrDefaultAsync(a => a.Name == "Pool");
            var wifiAmenity = await context.Amenities.FirstOrDefaultAsync(a => a.Name == "Wifi");

            if (villa != null && poolAmenity != null && wifiAmenity != null)
            {
                context.PropertyAmenities.Add(new PropertyAmenity { PropertyId = villa.Id, AmenityId = poolAmenity.Id });
                context.PropertyAmenities.Add(new PropertyAmenity { PropertyId = villa.Id, AmenityId = wifiAmenity.Id });
                await context.SaveChangesAsync();
            }
        }
    }
}
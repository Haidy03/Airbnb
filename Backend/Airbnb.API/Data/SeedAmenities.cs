using Microsoft.EntityFrameworkCore;
using Airbnb.API.Models;

namespace Airbnb.API.Data
{
    public static class SeedAmenities
    {
        public static void SeedData(ApplicationDbContext context)
        {
            if (!context.Amenities.Any())
            {
                var amenities = new List<Amenity>
                {
                    new Amenity { Name = "WiFi", Category = "Basic", Icon = "wifi", IsActive = true },
                    new Amenity { Name = "TV", Category = "Entertainment", Icon = "tv", IsActive = true },
                    new Amenity { Name = "Kitchen", Category = "Kitchen", Icon = "utensils", IsActive = true },
                    new Amenity { Name = "Washer", Category = "Basic", Icon = "washing-machine", IsActive = true },
                    new Amenity { Name = "Dryer", Category = "Basic", Icon = "wind", IsActive = true },
                    new Amenity { Name = "Air conditioning", Category = "HeatingCooling", Icon = "snowflake", IsActive = true },
                    new Amenity { Name = "Heating", Category = "HeatingCooling", Icon = "flame", IsActive = true },
                    new Amenity { Name = "Dedicated workspace", Category = "InternetOffice", Icon = "briefcase", IsActive = true },
                    new Amenity { Name = "Pool", Category = "Outdoor", Icon = "waves", IsActive = true },
                    new Amenity { Name = "Hot tub", Category = "Outdoor", Icon = "hot-tub", IsActive = true },
                    new Amenity { Name = "Free parking", Category = "Parking", Icon = "parking", IsActive = true },
                    new Amenity { Name = "EV charger", Category = "Parking", Icon = "zap", IsActive = true },
                    new Amenity { Name = "Smoke alarm", Category = "Safety", Icon = "alert-triangle", IsActive = true },
                    new Amenity { Name = "Carbon monoxide alarm", Category = "Safety", Icon = "alert-circle", IsActive = true },
                };

                context.Amenities.AddRange(amenities);
                context.SaveChanges();
            }
        }
    }
}
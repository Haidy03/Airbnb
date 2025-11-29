using Airbnb.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Data
{
    public static class SeedServices
    {
        public static async Task SeedDataAsync(ApplicationDbContext context)
        {
            // 1. Seed Categories (الفئات)
            if (!await context.ServiceCategories.AnyAsync())
            {
                var categories = new List<ServiceCategory>
                {
                    new ServiceCategory { Name = "Chefs", Icon = "assets/icons/chef.png", DisplayOrder = 1 },
                    new ServiceCategory { Name = "Training", Icon = "assets/icons/dumbbell.png", DisplayOrder = 2 },
                    new ServiceCategory { Name = "Beauty", Icon = "assets/icons/makeup.png", DisplayOrder = 3 },
                    new ServiceCategory { Name = "Cleaning", Icon = "assets/icons/cleaning.png", DisplayOrder = 4 }
                };
                await context.ServiceCategories.AddRangeAsync(categories);
                await context.SaveChangesAsync();
            }

            // 2. Seed a Sample Service (خدمة تجريبية)
            if (!await context.Services.AnyAsync())
            {
                // نحتاج أي Host ID موجود في الداتابيز
                var host = await context.Users.FirstOrDefaultAsync(u => u.Email == "host@test.com");
                var chefCategory = await context.ServiceCategories.FirstOrDefaultAsync(c => c.Name == "Chefs");

                if (host != null && chefCategory != null)
                {
                    var service = new Service
                    {
                        HostId = host.Id,
                        CategoryId = chefCategory.Id,
                        Title = "Authentic Roman Meal",
                        Description = "Enjoy a fully prepared Roman feast in your own kitchen.",
                        PricePerUnit = 3000,
                        PricingUnit = ServicePricingUnit.PerPerson,
                        MinimumCost = 9000, // ✅ Logic Test: لازم 3 أفراد عشان يوصل للرقم ده
                        Currency = "EGP",
                        LocationType = ServiceLocationType.Mobile, // الشيف بيجيلك
                        City = "Cairo",
                        Status = ServiceStatus.Active,
                        CreatedAt = DateTime.UtcNow,
                        AverageRating = 4.9,
                        Images = new List<ServiceImage>
                        {
                            new ServiceImage { Url = "https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-4.0.3", IsCover = true }
                        }
                    };

                    await context.Services.AddAsync(service);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
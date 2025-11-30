using Airbnb.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Data
{
    public static class SeedServices
    {
        public static async Task SeedDataAsync(ApplicationDbContext context)
        {
            // لو الخدمة موجودة، لا تضفها مرة أخرى
            if (await context.Services.AnyAsync(s => s.Title == "Sun-sweat by Nishant")) return;

            // 1. نأتي بالـ Host (يفترض أنك قمت بإنشاء مستخدم Host سابقاً)
            var hostUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "host@test.com");
            if (hostUser == null) return;

            // تحديث صورة الهوست لتكون مشابهة للصورة
            hostUser.ProfileImageUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200";
            hostUser.FirstName = "Nishant";

            // 2. التصنيف
            var category = await context.ServiceCategories.FirstOrDefaultAsync(c => c.Name == "Wellness");
            if (category == null)
            {
                category = new ServiceCategory { Name = "Wellness", Icon = "bi-heart-pulse" };
                context.ServiceCategories.Add(category);
                await context.SaveChangesAsync();
            }

            // 3. إنشاء الخدمة
            var service = new Service
            {
                HostId = hostUser.Id,
                CategoryId = category.Id,
                Title = "Sun-sweat by Nishant",
                Description = "Elevate your day with a holistic approach, including breathwork and nature-cooling.",
                // هذا السعر الأولي (Starting from)
                PricePerUnit = 4765,
                PricingUnit = ServicePricingUnit.PerPerson,
                Currency = "EGP", // العملة
                LocationType = ServiceLocationType.OnSite,
                City = "San Diego", // المدينة التي تظهر في الديزاين
                Address = "Mission Beach",
                Status = ServiceStatus.Active,
                CreatedAt = DateTime.UtcNow,
                AverageRating = 4.95,
                ReviewCount = 124,
                GuestRequirements = "Guests ages 18 and up can attend.",
                CancellationPolicy = "Cancel at least 1 day before for a full refund."
            };

            context.Services.Add(service);
            await context.SaveChangesAsync();

            // 4. الصور (صورة الغلاف)
            context.ServiceImages.Add(new ServiceImage
            {
                ServiceId = service.Id,
                Url = "https://images.unsplash.com/photo-1546549032-9571cd6b27df?q=80&w=1200", // صورة يوجا عالبحر
                IsCover = true
            });

            // 5. الباقات (Packages) - الجزء الأيمن في الصورة
            var packages = new List<ServicePackage>
            {
                new ServicePackage
                {
                    ServiceId = service.Id,
                    Title = "Sun-sweat mini session",
                    Description = "Start with breathwork and follow up with circuit training to boost your heart rate.",
                    Price = 4765,
                    Duration = "30 mins",
                    ImageUrl = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=300"
                },
                new ServicePackage
                {
                    ServiceId = service.Id,
                    Title = "Sun-sweat session",
                    Description = "Elevate your day with breathwork, a workout designed for your specific fitness goals, and a calming nature cooldown.",
                    Price = 7147,
                    Duration = "1 hr",
                    ImageUrl = "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=300"
                },
                new ServicePackage
                {
                    ServiceId = service.Id,
                    Title = "Sun-sweat prime session",
                    Description = "Enjoy a workout with video footage, breathwork, and a nature-cooling session.",
                    Price = 9530,
                    Duration = "1 hr",
                    ImageUrl = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=300"
                }
            };
            context.ServicePackages.AddRange(packages);
            await context.SaveChangesAsync();
        }
    }
}
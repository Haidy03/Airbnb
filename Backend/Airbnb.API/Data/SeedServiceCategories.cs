using Airbnb.API.Models;

namespace Airbnb.API.Data
{
    public static class SeedServiceCategories
    {
        public static void Seed(ApplicationDbContext context)
        {
            // هام: لو الجدول مليان داتا قديمة (Icon text)، لازم نمسحها أو نعمل تحديث
            // للتسهيل: اعملي Delete للداتا من الداتابيز أو استخدمي الكود ده عشان يحدث الداتا لو الاسم موجود

            var categories = new List<ServiceCategory>
            {
                new ServiceCategory
                {
                    Name = "Catering",
                    Icon = "https://cdn-icons-png.flaticon.com/512/9425/9425785.png", // Chafing Dish
                    Description = "Food service for events",
                    DisplayOrder = 1, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Chef",
                    Icon = "https://cdn-icons-png.flaticon.com/512/3461/3461974.png", // Cutting Board
                    Description = "Personal cooking service",
                    DisplayOrder = 2, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Hair styling",
                    Icon = "https://cdn-icons-png.flaticon.com/512/3712/3712166.png", // Hair Dryer
                    Description = "Professional hair styling",
                    DisplayOrder = 3, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Makeup",
                    Icon = "https://cdn-icons-png.flaticon.com/512/3050/3050253.png", // Cosmetics
                    Description = "Beauty and makeup",
                    DisplayOrder = 4, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Massage",
                    Icon = "https://cdn-icons-png.flaticon.com/512/3133/3133649.png", // Massage Table
                    Description = "Relaxation and therapy",
                    DisplayOrder = 5, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Nails",
                    Icon = "https://cdn-icons-png.flaticon.com/512/3662/3662818.png", // Nail Polish
                    Description = "Manicure and pedicure",
                    DisplayOrder = 6, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Personal training",
                    Icon = "https://cdn-icons-png.flaticon.com/512/2964/2964514.png", // Kettlebell
                    Description = "Fitness coaching",
                    DisplayOrder = 7, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Photography",
                    Icon = "https://cdn-icons-png.flaticon.com/512/2983/2983067.png", // Camera
                    Description = "Professional photography",
                    DisplayOrder = 8, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Prepared meals",
                    Icon = "https://cdn-icons-png.flaticon.com/512/1046/1046751.png", // Bento/Meal
                    Description = "Ready-to-eat meals",
                    DisplayOrder = 9, IsActive = true
                },
                new ServiceCategory
                {
                    Name = "Spa treatments",
                    Icon = "https://cdn-icons-png.flaticon.com/512/2647/2647617.png", // Stones/Lotus
                    Description = "Wellness treatments",
                    DisplayOrder = 10, IsActive = true
                }
            };

            // منطق بسيط: لو التصنيف موجود حدثه، لو مش موجود ضيفه
            foreach (var cat in categories)
            {
                var existingCat = context.ServiceCategories.FirstOrDefault(c => c.Name == cat.Name);
                if (existingCat != null)
                {
                    existingCat.Icon = cat.Icon; // تحديث الأيقونة
                    existingCat.DisplayOrder = cat.DisplayOrder;
                }
                else
                {
                    context.ServiceCategories.Add(cat);
                }
            }

            context.SaveChanges();
        }
    }
}
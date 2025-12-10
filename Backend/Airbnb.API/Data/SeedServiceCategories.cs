using Airbnb.API.Models;

namespace Airbnb.API.Data
{
    public static class SeedServiceCategories
    {
        public static void Seed(ApplicationDbContext context)
        {

            var categories = new List<ServiceCategory>
{
new ServiceCategory { Name = "Catering", Icon = "https://img.icons8.com/ios/500/meal.png" },
new ServiceCategory { Name = "Chef", Icon = "https://img.icons8.com/ios/500/chef-hat.png" },
new ServiceCategory { Name = "Hair styling", Icon = "https://img.icons8.com/ios/500/hair-dryer.png" },
new ServiceCategory { Name = "Makeup", Icon = "https://img.icons8.com/ios/500/cosmetic-brush.png" },
new ServiceCategory { Name = "Massage", Icon = "https://img.icons8.com/ios/500/spa.png" },
new ServiceCategory { Name = "Nails", Icon = "https://img.icons8.com/ios/500/nail-polish.png" },
new ServiceCategory { Name = "Personal training", Icon = "https://img.icons8.com/ios/500/dumbbell.png" },
new ServiceCategory { Name = "Photography", Icon = "https://img.icons8.com/ios/500/camera.png" },
new ServiceCategory { Name = "Prepared meals", Icon = "https://img.icons8.com/ios/500/ingredients.png" },
new ServiceCategory { Name = "Spa treatments", Icon = "https://img.icons8.com/ios/500/spa-flower.png" }
 };

            foreach (var cat in categories)
            {
                var existingCat = context.ServiceCategories.FirstOrDefault(c => c.Name == cat.Name);
                if (existingCat != null)
                {
                    existingCat.Icon = cat.Icon;
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
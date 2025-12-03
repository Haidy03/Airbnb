using Airbnb.API.Models;

namespace Airbnb.API.Data
{
    public static class SeedServiceCategories
    {
        public static void Seed(ApplicationDbContext context)
        {

            var categories = new List<ServiceCategory>
{
new ServiceCategory { Name = "Catering", Icon = "https://cdn-icons-png.flaticon.com/512/3480/3480822.png" },
new ServiceCategory { Name = "Chef", Icon = "https://cdn-icons-png.flaticon.com/512/1831/1831251.png" },
new ServiceCategory { Name = "Hair styling", Icon = "https://cdn-icons-png.flaticon.com/512/3037/3037316.png" },
new ServiceCategory { Name = "Makeup", Icon = "https://cdn-icons-png.flaticon.com/512/2913/2913212.png" },
new ServiceCategory { Name = "Massage", Icon = "https://cdn-icons-png.flaticon.com/512/2784/2784428.png" },
new ServiceCategory { Name = "Nails", Icon = "https://cdn-icons-png.flaticon.com/512/3051/3051726.png" },
new ServiceCategory { Name = "Personal training", Icon = "https://cdn-icons-png.flaticon.com/512/2936/2936886.png" },
new ServiceCategory { Name = "Photography", Icon = "https://cdn-icons-png.flaticon.com/512/3342/3342137.png" },
new ServiceCategory { Name = "Prepared meals", Icon = "https://cdn-icons-png.flaticon.com/512/1046/1046784.png" },
new ServiceCategory { Name = "Spa treatments", Icon = "https://cdn-icons-png.flaticon.com/512/2647/2647880.png" } };

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
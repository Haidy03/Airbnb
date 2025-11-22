using Airbnb.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Property> Properties { get; set; }
        public DbSet<PropertyType> PropertyTypes { get; set; } // NEW
        public DbSet<PropertyImage> PropertyImages { get; set; }
        public DbSet<Amenity> Amenities { get; set; }
        public DbSet<PropertyAmenity> PropertyAmenities { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<PropertyAvailability> PropertyAvailabilities { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================================
            // PropertyType Configuration (NEW)
            // ============================================
            modelBuilder.Entity<PropertyType>(entity =>
            {
                entity.HasKey(pt => pt.Id);
                entity.HasIndex(pt => pt.Code).IsUnique();
                entity.HasIndex(pt => pt.Category);
                entity.Property(pt => pt.IsActive).HasDefaultValue(true);
            });

            // ============================================
            // Property Configuration
            // ============================================
            modelBuilder.Entity<Property>(entity =>
            {
                entity.HasKey(p => p.Id);

                // Index for search optimization
                entity.HasIndex(p => new { p.City, p.Country });
                entity.HasIndex(p => p.IsActive);
                entity.HasIndex(p => p.PricePerNight);
                entity.HasIndex(p => new { p.Latitude, p.Longitude });

                // Relationship: Property -> Host (User)
                entity.HasOne(p => p.Host)
                    .WithMany(u => u.Properties)
                    .HasForeignKey(p => p.HostId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relationship: Property -> PropertyType (NEW)
                entity.HasOne(p => p.PropertyType)
                    .WithMany(pt => pt.Properties)
                    .HasForeignKey(p => p.PropertyTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Decimal precision
                entity.Property(p => p.PricePerNight)
                    .HasPrecision(18, 2);
                entity.Property(p => p.CleaningFee)
                    .HasPrecision(18, 2);
            });

            // ============================================
            // PropertyImage Configuration
            // ============================================
            modelBuilder.Entity<PropertyImage>(entity =>
            {
                entity.HasKey(pi => pi.Id);

                entity.HasIndex(pi => new { pi.PropertyId, pi.IsPrimary });

                entity.HasOne(pi => pi.Property)
                    .WithMany(p => p.Images)
                    .HasForeignKey(pi => pi.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // Amenity Configuration
            // ============================================
            modelBuilder.Entity<Amenity>(entity =>
            {
                entity.HasKey(a => a.Id);

                entity.HasIndex(a => a.Name).IsUnique();
                entity.HasIndex(a => a.Category);
            });

            // ============================================
            // PropertyAmenity Configuration (Many-to-Many)
            // ============================================
            modelBuilder.Entity<PropertyAmenity>(entity =>
            {
                entity.HasKey(pa => pa.Id);

                entity.HasIndex(pa => new { pa.PropertyId, pa.AmenityId }).IsUnique();

                entity.HasOne(pa => pa.Property)
                    .WithMany(p => p.PropertyAmenities)
                    .HasForeignKey(pa => pa.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(pa => pa.Amenity)
                    .WithMany(a => a.PropertyAmenities)
                    .HasForeignKey(pa => pa.AmenityId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // Booking Configuration
            // ============================================
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasKey(b => b.Id);

                entity.HasIndex(b => new { b.PropertyId, b.CheckInDate, b.CheckOutDate });
                entity.HasIndex(b => b.GuestId);
                entity.HasIndex(b => b.Status);
                entity.HasIndex(b => b.CreatedAt);

                entity.HasOne(b => b.Property)
                    .WithMany(p => p.Bookings)
                    .HasForeignKey(b => b.PropertyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.Guest)
                    .WithMany(u => u.GuestBookings)
                    .HasForeignKey(b => b.GuestId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(b => b.PricePerNight).HasPrecision(18, 2);
                entity.Property(b => b.CleaningFee).HasPrecision(18, 2);
                entity.Property(b => b.TotalPrice).HasPrecision(18, 2);

                entity.HasCheckConstraint(
                    "CK_Booking_CheckOutAfterCheckIn",
                    "[CheckOutDate] > [CheckInDate]"
                );
            });

            // ============================================
            // Review Configuration
            // ============================================
            modelBuilder.Entity<Review>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.HasIndex(r => r.BookingId);
                entity.HasIndex(r => r.PropertyId);
                entity.HasIndex(r => new { r.ReviewerId, r.RevieweeId });
                entity.HasIndex(r => r.CreatedAt);

                entity.HasOne(r => r.Booking)
                    .WithMany(b => b.Reviews)
                    .HasForeignKey(r => r.BookingId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Property)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(r => r.PropertyId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Reviewer)
                    .WithMany(u => u.ReviewsGiven)
                    .HasForeignKey(r => r.ReviewerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Reviewee)
                    .WithMany(u => u.ReviewsReceived)
                    .HasForeignKey(r => r.RevieweeId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(r => new { r.BookingId, r.ReviewerId, r.ReviewType })
                    .IsUnique();
            });

            // ============================================
            // PropertyAvailability Configuration
            // ============================================
            modelBuilder.Entity<PropertyAvailability>(entity =>
            {
                entity.HasKey(pa => pa.Id);

                entity.HasIndex(pa => new { pa.PropertyId, pa.Date }).IsUnique();

                entity.HasOne(pa => pa.Property)
                    .WithMany(p => p.Availabilities)
                    .HasForeignKey(pa => pa.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(pa => pa.CustomPrice).HasPrecision(18, 2);
            });

            // ============================================
            // Seed PropertyTypes Data
            // ============================================
            SeedPropertyTypes(modelBuilder);
        }

        private void SeedPropertyTypes(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PropertyType>().HasData(
                new PropertyType { Id = 1, Code = "HOUSE", Name = "House", Description = "A standalone house", IconType = "house", DisplayOrder = 1, Category = "RESIDENTIAL", IsActive = true },
                new PropertyType { Id = 2, Code = "APARTMENT", Name = "Apartment", Description = "A unit in a multi-unit building", IconType = "apartment", DisplayOrder = 2, Category = "RESIDENTIAL", IsActive = true },
                new PropertyType { Id = 3, Code = "BARN", Name = "Barn", Description = "A converted barn", IconType = "barn", DisplayOrder = 3, Category = "UNIQUE", IsActive = true },
                new PropertyType { Id = 4, Code = "BED_BREAKFAST", Name = "Bed & breakfast", Description = "A small lodging establishment", IconType = "bed-breakfast", DisplayOrder = 4, Category = "RESIDENTIAL", IsActive = true },
                new PropertyType { Id = 5, Code = "BOAT", Name = "Boat", Description = "A watercraft for accommodation", IconType = "boat", DisplayOrder = 5, Category = "UNIQUE", IsActive = true },
                new PropertyType { Id = 6, Code = "CABIN", Name = "Cabin", Description = "A small house in a rural area", IconType = "cabin", DisplayOrder = 6, Category = "OUTDOOR", IsActive = true },
                new PropertyType { Id = 7, Code = "CAMPER", Name = "Camper/RV", Description = "A recreational vehicle", IconType = "camper", DisplayOrder = 7, Category = "OUTDOOR", IsActive = true },
                new PropertyType { Id = 8, Code = "CASA_PARTICULAR", Name = "Casa particular", Description = "A Cuban home stay", IconType = "casa", DisplayOrder = 8, Category = "RESIDENTIAL", IsActive = true },
                new PropertyType { Id = 9, Code = "CASTLE", Name = "Castle", Description = "A historic castle", IconType = "castle", DisplayOrder = 9, Category = "UNIQUE", IsActive = true },
                new PropertyType { Id = 10, Code = "CAVE", Name = "Cave", Description = "A natural cave dwelling", IconType = "cave", DisplayOrder = 10, Category = "UNIQUE", IsActive = true },
                new PropertyType { Id = 11, Code = "CONTAINER", Name = "Container", Description = "A shipping container home", IconType = "container", DisplayOrder = 11, Category = "UNIQUE", IsActive = true },
                new PropertyType { Id = 12, Code = "CYCLADIC_HOME", Name = "Cycladic home", Description = "A traditional Greek island home", IconType = "cycladic", DisplayOrder = 12, Category = "UNIQUE", IsActive = true }
            );
        }
    }
}
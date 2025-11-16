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
                    .OnDelete(DeleteBehavior.Restrict); // Don't delete properties if user is deleted

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

                // Relationship: PropertyImage -> Property
                entity.HasOne(pi => pi.Property)
                    .WithMany(p => p.Images)
                    .HasForeignKey(pi => pi.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade); // Delete images when property is deleted
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

                // Composite unique index to prevent duplicates
                entity.HasIndex(pa => new { pa.PropertyId, pa.AmenityId }).IsUnique();

                // Relationship: PropertyAmenity -> Property
                entity.HasOne(pa => pa.Property)
                    .WithMany(p => p.PropertyAmenities)
                    .HasForeignKey(pa => pa.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Relationship: PropertyAmenity -> Amenity
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

                // Indexes for query optimization
                entity.HasIndex(b => new { b.PropertyId, b.CheckInDate, b.CheckOutDate });
                entity.HasIndex(b => b.GuestId);
                entity.HasIndex(b => b.Status);
                entity.HasIndex(b => b.CreatedAt);

                // Relationship: Booking -> Property
                entity.HasOne(b => b.Property)
                    .WithMany(p => p.Bookings)
                    .HasForeignKey(b => b.PropertyId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relationship: Booking -> Guest (User)
                entity.HasOne(b => b.Guest)
                    .WithMany(u => u.GuestBookings)
                    .HasForeignKey(b => b.GuestId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Decimal precision
                entity.Property(b => b.PricePerNight).HasPrecision(18, 2);
                entity.Property(b => b.CleaningFee).HasPrecision(18, 2);
                entity.Property(b => b.TotalPrice).HasPrecision(18, 2);

                // Check constraint: CheckOut must be after CheckIn
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

                // Indexes
                entity.HasIndex(r => r.BookingId);
                entity.HasIndex(r => r.PropertyId);
                entity.HasIndex(r => new { r.ReviewerId, r.RevieweeId });
                entity.HasIndex(r => r.CreatedAt);

                // Relationship: Review -> Booking
                entity.HasOne(r => r.Booking)
                    .WithMany(b => b.Reviews)
                    .HasForeignKey(r => r.BookingId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relationship: Review -> Property
                entity.HasOne(r => r.Property)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(r => r.PropertyId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relationship: Review -> Reviewer (User)
                entity.HasOne(r => r.Reviewer)
                    .WithMany(u => u.ReviewsGiven)
                    .HasForeignKey(r => r.ReviewerId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Relationship: Review -> Reviewee (User)
                entity.HasOne(r => r.Reviewee)
                    .WithMany(u => u.ReviewsReceived)
                    .HasForeignKey(r => r.RevieweeId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Unique constraint: One review per booking per reviewer
                entity.HasIndex(r => new { r.BookingId, r.ReviewerId, r.ReviewType })
                    .IsUnique();
            });

            // ============================================
            // PropertyAvailability Configuration
            // ============================================
            modelBuilder.Entity<PropertyAvailability>(entity =>
            {
                entity.HasKey(pa => pa.Id);

                // Unique constraint: One record per property per date
                entity.HasIndex(pa => new { pa.PropertyId, pa.Date }).IsUnique();

                // Relationship: PropertyAvailability -> Property
                entity.HasOne(pa => pa.Property)
                    .WithMany(p => p.Availabilities)
                    .HasForeignKey(pa => pa.PropertyId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Decimal precision
                entity.Property(pa => pa.CustomPrice).HasPrecision(18, 2);
            });
        }
    }
}
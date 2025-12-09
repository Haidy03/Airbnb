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
        public DbSet<PropertyType> PropertyTypes { get; set; }
        public DbSet<PropertyImage> PropertyImages { get; set; }
        public DbSet<Amenity> Amenities { get; set; }
        public DbSet<PropertyAmenity> PropertyAmenities { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<PropertyAvailability> PropertyAvailabilities { get; set; }
        public DbSet<UserVerification> UserVerifications { get; set; }

        //Messages DbSets
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<MessageAttachment> MessageAttachments { get; set; }
        public DbSet<Experience> Experiences { get; set; }
        public DbSet<ExperienceCategory> ExperienceCategories { get; set; }
        public DbSet<ExperienceImage> ExperienceImages { get; set; }
        public DbSet<ExperienceLanguage> ExperienceLanguages { get; set; }
        public DbSet<ExperienceAvailability> ExperienceAvailabilities { get; set; }
        public DbSet<ExperienceBooking> ExperienceBookings { get; set; }
        public DbSet<ExperienceReview> ExperienceReviews { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }

        public DbSet<Service> Services { get; set; }
        public DbSet<ServiceCategory> ServiceCategories { get; set; }
        public DbSet<ServiceImage> ServiceImages { get; set; }
        public DbSet<ServiceBooking> ServiceBookings { get; set; }
        public DbSet<ServiceReview> ServiceReviews { get; set; }
        public DbSet<ServiceAvailability> ServiceAvailabilities { get; set; }
        public DbSet<ServiceQualification> ServiceQualifications { get; set; }
        public DbSet<ServicePackage> ServicePackages { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ============================================
            // PropertyType Configuration
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

                // Relationship: Property -> PropertyType
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
            // Conversation Configuration
            // ============================================
            modelBuilder.Entity<Conversation>(entity =>
            {
                entity.HasKey(c => c.Id);

                // Indexes for performance
                entity.HasIndex(c => c.HostId);
                entity.HasIndex(c => c.GuestId);
                entity.HasIndex(c => c.PropertyId);
                entity.HasIndex(c => c.BookingId);
                entity.HasIndex(c => c.CreatedAt);

                // Unique constraint: one conversation per property between two users
                entity.HasIndex(c => new { c.HostId, c.GuestId, c.PropertyId })
                    .IsUnique()
                    .HasFilter("[PropertyId] IS NOT NULL"); // Allow multiple conversations without property

                // Relationships
                entity.HasOne(c => c.Host)
                    .WithMany()
                    .HasForeignKey(c => c.HostId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Guest)
                    .WithMany()
                    .HasForeignKey(c => c.GuestId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Property)
                    .WithMany()
                    .HasForeignKey(c => c.PropertyId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(c => c.Booking)
                    .WithMany()
                    .HasForeignKey(c => c.BookingId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ============================================
            // Message Configuration
            // ============================================
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(m => m.Id);

                // Indexes for performance
                entity.HasIndex(m => m.ConversationId);
                entity.HasIndex(m => m.SenderId);
                entity.HasIndex(m => m.ReceiverId);
                entity.HasIndex(m => m.SentAt);
                entity.HasIndex(m => new { m.ReceiverId, m.IsRead });
                entity.HasIndex(m => m.DeletedAt);

                // Relationships
                entity.HasOne(m => m.Conversation)
                    .WithMany(c => c.Messages)
                    .HasForeignKey(m => m.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Receiver)
                    .WithMany()
                    .HasForeignKey(m => m.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Default values
                entity.Property(m => m.IsRead).HasDefaultValue(false);
                entity.Property(m => m.IsDelivered).HasDefaultValue(false);
                entity.Property(m => m.SentAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // ============================================
            // MessageAttachment Configuration
            // ============================================
            modelBuilder.Entity<MessageAttachment>(entity =>
            {
                entity.HasKey(ma => ma.Id);

                entity.HasIndex(ma => ma.MessageId);

                entity.HasOne(ma => ma.Message)
                    .WithMany(m => m.Attachments)
                    .HasForeignKey(ma => ma.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(ma => ma.UploadedAt)
                    .HasDefaultValueSql("GETUTCDATE()");
            });

            // Experience Configuration
            // ============================================
            modelBuilder.Entity<Experience>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => e.CategoryId);
                entity.HasIndex(e => e.HostId);
                entity.HasIndex(e => new { e.City, e.Country });
                entity.HasIndex(e => e.Type);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.IsActive);

                entity.HasOne(e => e.Host)
                    .WithMany()
                    .HasForeignKey(e => e.HostId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Category)
                    .WithMany(c => c.Experiences)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.PricePerPerson).HasPrecision(18, 2);
            });

            // ============================================
            // ExperienceCategory Configuration
            // ============================================
            modelBuilder.Entity<ExperienceCategory>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.HasIndex(c => c.Name).IsUnique();
            });

            // ============================================
            // ExperienceImage Configuration
            // ============================================
            modelBuilder.Entity<ExperienceImage>(entity =>
            {
                entity.HasKey(i => i.Id);
                entity.HasIndex(i => new { i.ExperienceId, i.IsPrimary });

                entity.HasOne(i => i.Experience)
                    .WithMany(e => e.Images)
                    .HasForeignKey(i => i.ExperienceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // ExperienceLanguage Configuration
            // ============================================
            modelBuilder.Entity<ExperienceLanguage>(entity =>
            {
                entity.HasKey(l => l.Id);
                entity.HasIndex(l => new { l.ExperienceId, l.LanguageCode }).IsUnique();

                entity.HasOne(l => l.Experience)
                    .WithMany(e => e.Languages)
                    .HasForeignKey(l => l.ExperienceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ============================================
            // ExperienceAvailability Configuration
            // ============================================
            modelBuilder.Entity<ExperienceAvailability>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.HasIndex(a => new { a.ExperienceId, a.Date, a.StartTime });

                entity.HasOne(a => a.Experience)
                    .WithMany(e => e.Availabilities)
                    .HasForeignKey(a => a.ExperienceId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(a => a.CustomPrice).HasPrecision(18, 2);
            });

            // ============================================
            // ExperienceBooking Configuration
            // ============================================
            modelBuilder.Entity<ExperienceBooking>(entity =>
            {
                entity.HasKey(b => b.Id);
                entity.HasIndex(b => b.ExperienceId);
                entity.HasIndex(b => b.GuestId);
                entity.HasIndex(b => b.Status);

                entity.HasOne(b => b.Experience)
                    .WithMany(e => e.Bookings)
                    .HasForeignKey(b => b.ExperienceId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.Availability)
                    .WithMany()
                    .HasForeignKey(b => b.AvailabilityId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(b => b.Guest)
                    .WithMany()
                    .HasForeignKey(b => b.GuestId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(b => b.PricePerPerson).HasPrecision(18, 2);
                entity.Property(b => b.TotalPrice).HasPrecision(18, 2);
            });

            // ============================================
            // ExperienceReview Configuration
            // ============================================
            modelBuilder.Entity<ExperienceReview>(entity =>
            {
                entity.HasKey(r => r.Id);
                entity.HasIndex(r => r.ExperienceId);
                entity.HasIndex(r => r.ReviewerId);
                entity.HasIndex(r => new { r.ExperienceBookingId, r.ReviewerId }).IsUnique();

                entity.HasOne(r => r.Experience)
                    .WithMany(e => e.Reviews)
                    .HasForeignKey(r => r.ExperienceId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Booking)
                    .WithMany(b => b.Reviews)
                    .HasForeignKey(r => r.ExperienceBookingId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Reviewer)
                    .WithMany()
                    .HasForeignKey(r => r.ReviewerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            // ============================================
            // Services
            // ============================================

            modelBuilder.Entity<Service>()
                .HasOne(s => s.Category)
                .WithMany()
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

                        modelBuilder.Entity<ServiceCategory>().HasData(
                            new ServiceCategory { Id = 1, Name = "Chefs", Icon = "chef-hat", DisplayOrder = 1 },
                            new ServiceCategory { Id = 2, Name = "Training", Icon = "dumbbell", DisplayOrder = 2 },
                            new ServiceCategory { Id = 3, Name = "Beauty", Icon = "spa", DisplayOrder = 3 },
                            new ServiceCategory { Id = 4, Name = "Cleaning", Icon = "broom", DisplayOrder = 4 }
                        );

            // ============================================
            // Seed Experience Categories
            // ============================================
            SeedExperienceCategories(modelBuilder);

            // ============================================
            // Seed PropertyTypes Data
            // ============================================
            SeedPropertyTypes(modelBuilder);

            // ============================================
            // ServiceBooking Configuration (Fix Cycles)
            // ============================================
            modelBuilder.Entity<ServiceBooking>(entity =>
            {
                entity.HasKey(b => b.Id);

                entity.HasOne(b => b.Service)
                    .WithMany() 
                    .HasForeignKey(b => b.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict); 

                
                entity.HasOne(b => b.Guest)
                    .WithMany()
                    .HasForeignKey(b => b.GuestId)
                    .OnDelete(DeleteBehavior.Restrict); 

               
                entity.HasOne(b => b.Package)
                    .WithMany()
                    .HasForeignKey(b => b.PackageId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(b => b.TotalPrice).HasPrecision(18, 2);
            });

            // ============================================
            // ServiceReview Configuration
            // ============================================
            modelBuilder.Entity<ServiceReview>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.HasOne(r => r.Service)
                    .WithMany(e => e.Reviews)
                    .HasForeignKey(r => r.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Booking)
                    .WithMany()
                    .HasForeignKey(r => r.ServiceBookingId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(r => r.Reviewer)
                    .WithMany()
                    .HasForeignKey(r => r.ReviewerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(r => r.ServiceBookingId).IsUnique();
            });
        }

        private void SeedExperienceCategories(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ExperienceCategory>().HasData(
                new ExperienceCategory { Id = 1, Name = "Food ", Icon = "🍽️", DisplayOrder = 10, IsActive = true },
                new ExperienceCategory { Id = 2, Name = "Art ", Icon = "🎨", DisplayOrder = 11, IsActive = true },
                new ExperienceCategory { Id = 11, Name = "Photography", Icon = "📸", DisplayOrder = 1, IsActive = true, Description = "Professional photography sessions" },
                new ExperienceCategory { Id = 12, Name = "Master chefs", Icon = "👨‍🍳", DisplayOrder = 2, IsActive = true, Description = "Personal chef experiences" },
                new ExperienceCategory { Id = 13, Name = "Traditional meals", Icon = "🍱", DisplayOrder = 3, IsActive = true, Description = "Ready-to-eat meal services" },
                new ExperienceCategory { Id = 14, Name = "Massage", Icon = "💆", DisplayOrder = 4, IsActive = true, Description = "Relaxing massage therapy" },
                new ExperienceCategory { Id = 15, Name = "Walking", Icon = "🏋️", DisplayOrder = 5, IsActive = true, Description = "Personal training sessions" },
                new ExperienceCategory { Id = 16, Name = "Culuture", Icon = "🎨", DisplayOrder = 6, IsActive = true, Description = "Professional makeup artists" },
                new ExperienceCategory { Id = 17, Name = "Cooking", Icon = "👨‍🍳", DisplayOrder = 7, IsActive = true, Description = "Hairstyling services" }
            );
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
using Airbnb.API.Data;
using Airbnb.API.Data;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Implementations;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Implementations;
using Airbnb.API.Services.Implementations;
using Airbnb.API.Services.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Identity.Client;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null
            );
        }
    )
);

// ============================================
// 2. Configure Identity
// ============================================
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// ============================================
// 3. Configure JWT Authentication
// ============================================
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// ============================================
// 4. Add Authorization Policies
// ============================================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireHostRole", policy => policy.RequireRole("Host", "Admin"));
    options.AddPolicy("RequireGuestRole", policy => policy.RequireRole("Guest", "Admin"));
});

// ============================================
// 5. Register Repositories
// ============================================
builder.Services.AddScoped<IPropertyRepository, PropertyRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();

builder.Services.AddScoped<IExperienceRepository, ExperienceRepository>();

// ============================================
// 6. Register Services
// ============================================
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<ICalendarService, CalendarService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddScoped<IEarningsService, EarningsService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IExperienceService, ExperienceService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddHttpClient<IChatService, ChatService>();
builder.Services.AddMemoryCache();



// ============================================
// 7. Add Controllers & Services
// ============================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });


builder.Services.AddAutoMapper(typeof(PropertyProfile));


// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://localhost:52290",
                "https://localhost:4200",
                "http://localhost:53829"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials()
              .WithExposedHeaders("Content-Disposition");
    });
});

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Airbnb Clone API",
        Version = "v1",
        Description = "API for Airbnb Clone Project"
    });

    c.CustomSchemaIds(type => type.ToString());

    // JWT Authentication in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});



// ============================================
// 8. Build App
// ============================================
var app = builder.Build();

// ============================================
// Seed Database
// ============================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        logger.LogInformation("🚀 Starting database seeding...");
        await SeedRolesAndAdmin(services);
        logger.LogInformation("✅ Roles and Admin seeded successfully");

        var context = services.GetRequiredService<ApplicationDbContext>();
        SeedAmenities.SeedData(context);
        logger.LogInformation("✅ Amenities seeded successfully");


        // ⭐ أضيفي الـ Seed Data للـ Reviews
        await SeedReviewData(services);
        logger.LogInformation("✅ Review test data seeded successfully");

        logger.LogInformation("🎉 All seeding completed successfully!");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding the database");
    }
}



// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}




// Enable static files (for image uploads)
app.UseStaticFiles();

//app.UseStaticFiles(new StaticFileOptions
//{
//    FileProvider = new PhysicalFileProvider(
//        Path.Combine(builder.Environment.WebRootPath, "uploads")),
//    RequestPath = "/uploads"
//});
app.UseHttpsRedirection();


app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// ============================================
// 10. Seed Roles & Admin Method
// ============================================

async Task SeedRolesAndAdmin(IServiceProvider serviceProvider)
{
    var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
    // Create Roles
    string[] roleNames = { "Admin", "Host", "Guest" };
    foreach (var roleName in roleNames)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
            logger.LogInformation($"   ✓ Created role: {roleName}");
        }
    }

    // Create Admin User
    var adminEmail = "admin@airbnb.com";
    var adminUser = await userManager.FindByEmailAsync(adminEmail);

    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FirstName = "Admin",
            LastName = "User",
            EmailConfirmed = true,
            IsActive = true,
            IsVerified = true
        };

        var result = await userManager.CreateAsync(adminUser, "Admin@123");
        await userManager.AddToRoleAsync(adminUser, "Admin");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
            logger.LogInformation($"   ✓ Created Admin user: {adminEmail}");
        }
        else
        {
            logger.LogError($"   ✗ Failed to create Admin: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
    }
}
// Replace your SeedReviewData function with this updated version:

async Task SeedReviewData(IServiceProvider serviceProvider)
{
    var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var logger = serviceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Create Guest User
        var guestEmail = "guest@test.com";
        var guest = await userManager.FindByEmailAsync(guestEmail);

        if (guest == null)
        {
            logger.LogInformation("   → Creating Guest user...");
            guest = new ApplicationUser
            {
                UserName = guestEmail,
                Email = guestEmail,
                FirstName = "Ahmed",
                LastName = "Mohamed",
                EmailConfirmed = true,
                IsActive = true,
                ProfileImageUrl = "https://i.pravatar.cc/150?img=1",
                PhoneNumber = "01234567890",
                CreatedAt = DateTime.UtcNow
            };

            var guestResult = await userManager.CreateAsync(guest, "Guest@123");
            if (guestResult.Succeeded)
            {
                await userManager.AddToRoleAsync(guest, "Guest");
                logger.LogInformation($"   ✓ Guest created: {guestEmail}");
            }
            else
            {
                logger.LogError($"   ✗ Failed to create Guest");
                return;
            }
        }

        // Create Host User
        var hostEmail = "host@test.com";
        var host = await userManager.FindByEmailAsync(hostEmail);

        if (host == null)
        {
            logger.LogInformation("   → Creating Host user...");
            host = new ApplicationUser
            {
                UserName = hostEmail,
                Email = hostEmail,
                FirstName = "Sara",
                LastName = "Ali",
                EmailConfirmed = true,
                IsActive = true,
                ProfileImageUrl = "https://i.pravatar.cc/150?img=2",
                PhoneNumber = "01098765432",
                CreatedAt = DateTime.UtcNow
            };

            var hostResult = await userManager.CreateAsync(host, "Host@123");
            if (hostResult.Succeeded)
            {
                await userManager.AddToRoleAsync(host, "Host");
                logger.LogInformation($"   ✓ Host created: {hostEmail}");
            }
            else
            {
                logger.LogError($"   ✗ Failed to create Host");
                return;
            }
        }

        // Reload users from DB to get IDs
        guest = await userManager.FindByEmailAsync(guestEmail);
        host = await userManager.FindByEmailAsync(hostEmail);

        if (guest == null || host == null)
        {
            logger.LogError("   ✗ Users not found after creation");
            return;
        }

        // Create Property - ✅ USING PropertyTypeId now!
        if (!await context.Properties.AnyAsync())
        {
            logger.LogInformation("   → Creating test property...");

            var property = new Property
            {
                Title = "Luxury Villa in Cairo",
                Description = "Beautiful villa with stunning Nile view, perfect for families and groups. Fully equipped with modern amenities.",
                PricePerNight = 1500,
                CleaningFee = 200,
                MaxGuests = 6,
                NumberOfBedrooms = 3,
                NumberOfBathrooms = 2,
                PropertyTypeId = 1, // ✅ CHANGED: Use PropertyTypeId (1 = House)
                Country = "Egypt",
                City = "Cairo",
                Address = "Zamalek, Cairo",
                Latitude = 30.0444,
                Longitude = 31.2357,
                HostId = host.Id,
                CreatedAt = DateTime.UtcNow
            };

            context.Properties.Add(property);
            await context.SaveChangesAsync();
            logger.LogInformation($"   ✓ Property created (ID: {property.Id})");
        }

        var testProperty = await context.Properties.FirstOrDefaultAsync();
        if (testProperty == null)
        {
            logger.LogError("   ✗ Property not found after creation");
            return;
        }

        // Create Completed Booking
        if (!await context.Bookings.AnyAsync())
        {
            logger.LogInformation("   → Creating completed booking...");

            var booking = new Booking
            {
                PropertyId = testProperty.Id,
                GuestId = guest.Id,
                CheckInDate = DateTime.UtcNow.AddDays(-10).Date,
                CheckOutDate = DateTime.UtcNow.AddDays(-3).Date,
                NumberOfGuests = 2,
                NumberOfNights = 7,
                PricePerNight = testProperty.PricePerNight,
                CleaningFee = testProperty.CleaningFee ?? 0,
                TotalPrice = (testProperty.PricePerNight * 7) + (testProperty.CleaningFee ?? 0),
                Status = BookingStatus.Completed,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            };

            context.Bookings.Add(booking);
            await context.SaveChangesAsync();
            logger.LogInformation($"   ✓ Booking created (ID: {booking.Id})");
        }

        var completedBooking = await context.Bookings
            .FirstOrDefaultAsync(b => b.Status == BookingStatus.Completed);

        if (completedBooking == null)
        {
            logger.LogError("   ✗ No completed booking found");
            return;
        }

        // Create Sample Review
        if (!await context.Reviews.AnyAsync())
        {
            logger.LogInformation("   → Creating sample review...");

            var review = new Review
            {
                BookingId = completedBooking.Id,
                PropertyId = testProperty.Id,
                ReviewerId = guest.Id,
                RevieweeId = host.Id,
                ReviewType = ReviewType.GuestToProperty,
                Rating = 5,
                Comment = "Amazing place! The villa exceeded all expectations. Very clean, great location, and the host was incredibly helpful. Would definitely stay again!",
                CleanlinessRating = 5,
                CommunicationRating = 5,
                LocationRating = 4,
                ValueRating = 5,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                IsApproved = true
            };

            context.Reviews.Add(review);
            await context.SaveChangesAsync();
            logger.LogInformation($"   ✓ Review created (ID: {review.Id})");
        }

        logger.LogInformation("");
        logger.LogInformation("📊 DATABASE SUMMARY:");
        logger.LogInformation($"   • Users: {await context.Users.CountAsync()}");
        logger.LogInformation($"   • Properties: {await context.Properties.CountAsync()}");
        logger.LogInformation($"   • Bookings: {await context.Bookings.CountAsync()}");
        logger.LogInformation($"   • Reviews: {await context.Reviews.CountAsync()}");
        logger.LogInformation("");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Error in SeedReviewData");
        throw;
    }
}

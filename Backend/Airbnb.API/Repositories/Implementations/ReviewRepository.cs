using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;

namespace Airbnb.API.Repositories.Implementations
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly ApplicationDbContext _context;

        public ReviewRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================================
        // Basic CRUD Operations
        // ============================================

        public async Task<Review?> GetByIdAsync(int id)
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Reviewee)
                .Include(r => r.Property)
                .Include(r => r.Booking)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Review> AddAsync(Review review)
        {
            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();
            return review;
        }

        public async Task<Review> UpdateAsync(Review review)
        {
            _context.Reviews.Update(review);
            await _context.SaveChangesAsync();
            return review;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
                return false;

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
            return true;
        }

        // ============================================
        // Query Methods
        // ============================================

        public async Task<IEnumerable<Review>> GetAllAsync()
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Property)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewsByPropertyAsync(int propertyId, int page = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Reviewee)
                .Where(r => r.PropertyId == propertyId && r.ReviewType == ReviewType.GuestToProperty)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewsByGuestAsync(string guestId)
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Property)
                .Where(r => r.RevieweeId == guestId && r.ReviewType == ReviewType.HostToGuest)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetReviewsByReviewerAsync(string reviewerId)
        {
            return await _context.Reviews
                .Include(r => r.Property)
                .Include(r => r.Reviewee)
                .Where(r => r.ReviewerId == reviewerId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<Review?> GetReviewByBookingAsync(int bookingId, string reviewerId, string reviewType)
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Property)
                .FirstOrDefaultAsync(r =>
                    r.BookingId == bookingId &&
                    r.ReviewerId == reviewerId &&
                    r.ReviewType == reviewType);
        }

        // ============================================
        // Statistics
        // ============================================

        public async Task<double> GetAverageRatingByPropertyAsync(int propertyId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.PropertyId == propertyId && r.ReviewType == ReviewType.GuestToProperty)
                .ToListAsync();

            return reviews.Any() ? reviews.Average(r => r.Rating) : 0;
        }

        public async Task<int> GetTotalReviewsCountByPropertyAsync(int propertyId)
        {
            return await _context.Reviews
                .CountAsync(r => r.PropertyId == propertyId && r.ReviewType == ReviewType.GuestToProperty);
        }

        public async Task<Dictionary<string, double>> GetDetailedRatingsAverageAsync(int propertyId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.PropertyId == propertyId && r.ReviewType == ReviewType.GuestToProperty)
                .ToListAsync();

            var result = new Dictionary<string, double>();

            if (!reviews.Any())
                return result;

            var cleanlinessReviews = reviews.Where(r => r.CleanlinessRating.HasValue).ToList();
            var communicationReviews = reviews.Where(r => r.CommunicationRating.HasValue).ToList();
            var locationReviews = reviews.Where(r => r.LocationRating.HasValue).ToList();
            var valueReviews = reviews.Where(r => r.ValueRating.HasValue).ToList();

            if (cleanlinessReviews.Any())
                result["Cleanliness"] = cleanlinessReviews.Average(r => r.CleanlinessRating!.Value);

            if (communicationReviews.Any())
                result["Communication"] = communicationReviews.Average(r => r.CommunicationRating!.Value);

            if (locationReviews.Any())
                result["Location"] = locationReviews.Average(r => r.LocationRating!.Value);

            if (valueReviews.Any())
                result["Value"] = valueReviews.Average(r => r.ValueRating!.Value);

            return result;
        }

        // ============================================
        // Validation
        // ============================================

        public async Task<bool> HasUserReviewedBookingAsync(int bookingId, string userId, string reviewType)
        {
            return await _context.Reviews.AnyAsync(r =>
                r.BookingId == bookingId &&
                r.ReviewerId == userId &&
                r.ReviewType == reviewType);
        }

        public async Task<bool> ExistsAsync(int reviewId)
        {
            return await _context.Reviews.AnyAsync(r => r.Id == reviewId);
        }

        // ============================================
        // Complex Queries
        // ============================================

        public async Task<IEnumerable<Review>> GetReviewsWithUserInfoAsync(int propertyId, int page = 1, int pageSize = 10)
        {
            return await _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Reviewee)
                .Include(r => r.Property)
                .Include(r => r.Booking)
                .Where(r => r.PropertyId == propertyId && r.ReviewType == ReviewType.GuestToProperty)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<Review>> GetUserReviewsAsync(string userId)
        {
            return await _context.Reviews
                .Include(r => r.Property)
                .Include(r => r.Reviewer)
                .Include(r => r.Reviewee)
                .Where(r => r.ReviewerId == userId || r.RevieweeId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
    }
}

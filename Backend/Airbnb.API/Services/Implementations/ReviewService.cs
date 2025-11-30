using Airbnb.API.DTOs.Review;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Airbnb.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Airbnb.API.Services.Implementations
{
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;
        private readonly IReviewRepository _reviewRepository;

        public ReviewService(
            ApplicationDbContext context,
            IReviewRepository reviewRepository)
        {
            _context = context;
            _reviewRepository = reviewRepository;
        }

        public async Task<ReviewResponseDto> CreateReviewAsync(string userId, CreateReviewDto dto)
        {
            var booking = await _context.Bookings
                .Include(b => b.Property)
                .Include(b => b.Guest)
                .FirstOrDefaultAsync(b => b.Id == dto.BookingId);

            if (booking == null)
                throw new Exception("Booking not found");

            if (booking.Status != BookingStatus.Completed)
                throw new Exception("You can only review completed bookings");

            string reviewType;
            string revieweeId;

            if (booking.GuestId == userId)
            {
                reviewType = ReviewType.GuestToProperty;
                revieweeId = booking.Property.HostId;
            }
            else if (booking.Property.HostId == userId)
            {
                reviewType = ReviewType.HostToGuest;
                revieweeId = booking.GuestId;
            }
            else
            {
                throw new UnauthorizedAccessException("You are not authorized to review this booking");
            }

            // Use repository to check existing review
            var existingReview = await _reviewRepository.ReviewExistsForBookingAsync(dto.BookingId);
            if (existingReview)
                throw new InvalidOperationException("You have already reviewed this trip.");


            var review = new Review
            {
                BookingId = dto.BookingId,
                PropertyId = booking.PropertyId,
                ReviewerId = userId,
                RevieweeId = revieweeId,
                ReviewType = reviewType,
                Rating = dto.Rating,
                Comment = dto.Comment,
                CleanlinessRating = dto.CleanlinessRating,
                CommunicationRating = dto.CommunicationRating,
                LocationRating = dto.LocationRating,
                ValueRating = dto.ValueRating,
                CreatedAt = DateTime.UtcNow,
                IsApproved = true
            };

            // Use repository to add review
            await _reviewRepository.AddAsync(review);

            return await MapToResponseDto(review);
        }

        public async Task<ReviewResponseDto> UpdateReviewAsync(string userId, int reviewId, UpdateReviewDto dto)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);

            if (review == null)
                throw new Exception("Review not found");

            if (review.ReviewerId != userId)
                throw new UnauthorizedAccessException("You are not authorized to update this review");

            review.Rating = dto.Rating;
            review.Comment = dto.Comment;
            review.CleanlinessRating = dto.CleanlinessRating;
            review.CommunicationRating = dto.CommunicationRating;
            review.LocationRating = dto.LocationRating;
            review.ValueRating = dto.ValueRating;
            review.UpdatedAt = DateTime.UtcNow;

            await _reviewRepository.UpdateAsync(review);

            return await MapToResponseDto(review);
        }

        public async Task<bool> DeleteReviewAsync(string userId, int reviewId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);

            if (review == null)
                return false;

            if (review.ReviewerId != userId)
                throw new UnauthorizedAccessException("You are not authorized to delete this review");

            return await _reviewRepository.DeleteAsync(reviewId);
        }

        public async Task<ReviewResponseDto?> GetReviewByIdAsync(int reviewId)
        {
            var review = await _reviewRepository.GetByIdAsync(reviewId);

            if (review == null)
                return null;

            return await MapToResponseDto(review);
        }

        public async Task<PropertyReviewsSummaryDto> GetPropertyReviewsAsync(int propertyId, int page = 1, int pageSize = 10)
        {
            var property = await _context.Properties.FindAsync(propertyId);
            if (property == null)
                throw new Exception("Property not found");

            // Use repository to get reviews
            var reviews = await _reviewRepository.GetReviewsByPropertyAsync(propertyId, page, pageSize);

            // Use repository to get statistics
            var averageRating = await _reviewRepository.GetAverageRatingByPropertyAsync(propertyId);
            var totalReviews = await _reviewRepository.GetTotalReviewsCountByPropertyAsync(propertyId);
            var detailedRatings = await _reviewRepository.GetDetailedRatingsAverageAsync(propertyId);

            var reviewDtos = new List<ReviewResponseDto>();
            foreach (var review in reviews)
            {
                reviewDtos.Add(await MapToResponseDto(review));
            }

            return new PropertyReviewsSummaryDto
            {
                PropertyId = propertyId,
                AverageRating = averageRating,
                TotalReviews = totalReviews,
                AverageCleanlinessRating = detailedRatings.ContainsKey("Cleanliness")
                    ? detailedRatings["Cleanliness"] : null,
                AverageCommunicationRating = detailedRatings.ContainsKey("Communication")
                    ? detailedRatings["Communication"] : null,
                AverageLocationRating = detailedRatings.ContainsKey("Location")
                    ? detailedRatings["Location"] : null,
                AverageValueRating = detailedRatings.ContainsKey("Value")
                    ? detailedRatings["Value"] : null,
                Reviews = reviewDtos
            };
        }

        public async Task<GuestReviewsSummaryDto> GetGuestReviewsAsync(string guestId)
        {
            var guest = await _context.Users.FindAsync(guestId);
            if (guest == null)
                throw new Exception("Guest not found");

            var reviews = await _reviewRepository.GetReviewsByGuestAsync(guestId);

            var reviewDtos = new List<ReviewResponseDto>();
            foreach (var review in reviews)
            {
                reviewDtos.Add(await MapToResponseDto(review));
            }

            return new GuestReviewsSummaryDto
            {
                GuestId = guestId,
                GuestName = $"{guest.FirstName} {guest.LastName}",
                AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0,
                TotalReviews = reviews.Count(),
                Reviews = reviewDtos
            };
        }

        public async Task<CanReviewResponseDto> CanUserReviewAsync(string userId, int bookingId)
        {
            var booking = await _context.Bookings
                .Include(b => b.Property)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                return new CanReviewResponseDto { CanReview = false, Reason = "Booking not found" };

            if (booking.Status != BookingStatus.Completed)
                return new CanReviewResponseDto { CanReview = false, Reason = "Booking is not completed yet" };

            string reviewType;
            if (booking.GuestId == userId)
                reviewType = ReviewType.GuestToProperty;
            else if (booking.Property.HostId == userId)
                reviewType = ReviewType.HostToGuest;
            else
                return new CanReviewResponseDto { CanReview = false, Reason = "You are not part of this booking" };

            // Use repository to check if already reviewed
            var hasReviewed = await _reviewRepository.HasUserReviewedBookingAsync(
                bookingId, userId, reviewType);

            if (hasReviewed)
                return new CanReviewResponseDto { CanReview = false, Reason = "You have already reviewed this booking" };

            return new CanReviewResponseDto { CanReview = true, BookingId = bookingId };
        }

        public async Task<List<ReviewResponseDto>> GetUserReviewsAsync(string userId)
        {
            var reviews = await _reviewRepository.GetUserReviewsAsync(userId);

            var reviewDtos = new List<ReviewResponseDto>();
            foreach (var review in reviews)
            {
                reviewDtos.Add(await MapToResponseDto(review));
            }

            return reviewDtos;
        }

        private async Task<ReviewResponseDto> MapToResponseDto(Review review)
        {
            var reviewer = await _context.Users.FindAsync(review.ReviewerId);
            var reviewee = await _context.Users.FindAsync(review.RevieweeId);
            var property = await _context.Properties.FindAsync(review.PropertyId);

            return new ReviewResponseDto
            {
                Id = review.Id,
                BookingId = review.BookingId,
                PropertyId = review.PropertyId,
                PropertyTitle = property?.Title ?? "",
                ReviewType = review.ReviewType,
                Rating = review.Rating,
                Comment = review.Comment,
                CleanlinessRating = review.CleanlinessRating,
                CommunicationRating = review.CommunicationRating,
                LocationRating = review.LocationRating,
                ValueRating = review.ValueRating,
                ReviewerId = review.ReviewerId,
                ReviewerName = $"{reviewer?.FirstName} {reviewer?.LastName}",
                ReviewerProfileImage = reviewer?.ProfileImageUrl,
                RevieweeId = review.RevieweeId,
                RevieweeName = $"{reviewee?.FirstName} {reviewee?.LastName}",
                CreatedAt = review.CreatedAt,
                UpdatedAt = review.UpdatedAt,
                IsApproved = review.IsApproved
            };
        }



        public async Task<HostReviewsResponseDto> GetHostReviewsAsync(string hostId)
        {
           
            var reviews = await _context.Reviews
                .Include(r => r.Booking)
                .Include(r => r.Property)
                .Include(r => r.Reviewer)
                .Where(r => r.Property.HostId == hostId && r.ReviewType == ReviewType.GuestToProperty)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            if (!reviews.Any())
            {
                return new HostReviewsResponseDto();
            }

           
            var stats = new HostReviewsResponseDto
            {
                TotalReviews = reviews.Count,
                OverallRating = Math.Round(reviews.Average(r => r.Rating), 2),

                CleanlinessAvg = reviews.Any(r => r.CleanlinessRating.HasValue)
                    ? Math.Round(reviews.Where(r => r.CleanlinessRating.HasValue).Average(r => r.CleanlinessRating.Value), 1) : 0,

                CommunicationAvg = reviews.Any(r => r.CommunicationRating.HasValue)
                    ? Math.Round(reviews.Where(r => r.CommunicationRating.HasValue).Average(r => r.CommunicationRating.Value), 1) : 0,

                LocationAvg = reviews.Any(r => r.LocationRating.HasValue)
                    ? Math.Round(reviews.Where(r => r.LocationRating.HasValue).Average(r => r.LocationRating.Value), 1) : 0,

                ValueAvg = reviews.Any(r => r.ValueRating.HasValue)
                    ? Math.Round(reviews.Where(r => r.ValueRating.HasValue).Average(r => r.ValueRating.Value), 1) : 0,

             
                Reviews = new List<ReviewResponseDto>()
            };

            foreach (var review in reviews)
            {
                stats.Reviews.Add(await MapToResponseDto(review));
            }

            return stats;
        }
    }
}

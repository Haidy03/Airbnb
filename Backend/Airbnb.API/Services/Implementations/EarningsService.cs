using Airbnb.API.DTOs.Earnings;
using Airbnb.API.Models;
using Airbnb.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

public class EarningsService : IEarningsService
{
    private readonly ApplicationDbContext _context;

    public EarningsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<EarningsDashboardDto> GetHostEarningsAsync(string hostId)
    {
        var today = DateTime.Today;

        // =========================================================
        // 1. Properties Bookings (Existing)
        // =========================================================
        var bookings = await _context.Bookings
            .Include(b => b.Property)
            .Include(b => b.Guest)
            .Where(b => b.Property.HostId == hostId &&
                        b.Status != BookingStatus.Cancelled &&
                        b.Status != BookingStatus.Rejected)
            .ToListAsync();
        // ✅ PAID: Confirmed (Money transferred) OR Completed. regardless of date.
        var paidBookings = bookings.Where(b => b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed);
        // ✅ EXPECTED: Pending approval OR Awaiting Payment.
        var expectedBookings = bookings.Where(b => b.Status == BookingStatus.Pending || b.Status == BookingStatus.AwaitingPayment);

        var propTransactions = bookings
            .Select(b => new TransactionDto
            {
                BookingId = b.Id,
                GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
                PropertyTitle = b.Property.Title,
                Date = b.CheckInDate.AddDays(1),
                Amount = b.TotalPrice,
                Status = (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Completed) ? "Paid" : "Pending",
                Type = "Home"
             }).ToList();

        // =========================================================
        // 2. Experiences Bookings (Existing)
        // =========================================================
        var experienceBookings = await _context.ExperienceBookings
                .Include(b => b.Experience)
                .Include(b => b.Guest)
                .Include(b => b.Availability)
                .Where(b => b.Experience.HostId == hostId &&
                            b.Status != ExperienceBookingStatus.Cancelled)
                .ToListAsync();

        // ✅ PAID
        var paidExpBookings = experienceBookings
            .Where(b => b.Status == ExperienceBookingStatus.Confirmed || b.Status == ExperienceBookingStatus.Completed);

        // ✅ EXPECTED (Assuming pending means not confirmed/completed yet)
        var expectedExpBookings = experienceBookings
            .Where(b => b.Status != ExperienceBookingStatus.Confirmed && b.Status != ExperienceBookingStatus.Completed);

        var expTransactions = experienceBookings.Select(b => new TransactionDto
        {
            BookingId = b.Id,
            GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
            PropertyTitle = b.Experience.Title,
            Date = b.Availability.Date,
            Amount = b.TotalPrice,
            Type = "Experience",
            Status = (b.Status == ExperienceBookingStatus.Confirmed || b.Status == ExperienceBookingStatus.Completed) ? "Paid" : "Pending"
        }).ToList();

        // =========================================================
        // Services Bookings
        // =========================================================
        var serviceBookings = await _context.ServiceBookings
                .Include(b => b.Service)
                .Include(b => b.Guest)
                .Where(b => b.Service.HostId == hostId &&
                            b.Status != "Cancelled" && b.Status != "Rejected")
                .ToListAsync();

        // ✅ PAID
        var paidServiceBookings = serviceBookings
            .Where(b => b.Status == "Confirmed" || b.Status == "Completed");

        // ✅ EXPECTED
        var expectedServiceBookings = serviceBookings
            .Where(b => b.Status == "Pending" || b.Status == "AwaitingPayment");

        var serviceTransactions = serviceBookings.Select(b => new TransactionDto
        {
            BookingId = b.Id,
            GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
            PropertyTitle = b.Service.Title,
            Date = b.BookingDate,
            Amount = b.TotalPrice,
            Type = "Service",
            Status = (b.Status == "Confirmed" || b.Status == "Completed") ? "Paid" : "Pending"
        }).ToList();

        // =========================================================
        // 4. Aggregation & Chart
        // =========================================================

        var finalRecentTransactions = propTransactions
            .Concat(expTransactions)
            .Concat(serviceTransactions) 
            .OrderByDescending(t => t.Date)
            .Take(10)
            .ToList();

        var grandTotalEarnings = paidBookings.Sum(b => b.TotalPrice)
                               + paidExpBookings.Sum(b => b.TotalPrice)
                               + paidServiceBookings.Sum(b => b.TotalPrice);

        var grandPendingPayouts = expectedBookings.Sum(b => b.TotalPrice)
                               + expectedExpBookings.Sum(b => b.TotalPrice)
                               + expectedServiceBookings.Sum(b => b.TotalPrice);

        var thisMonthTotal =
              paidBookings.Where(b => b.CheckInDate.Month == today.Month && b.CheckInDate.Year == today.Year).Sum(b => b.TotalPrice)
            + paidExpBookings.Where(b => b.Availability.Date.Month == today.Month && b.Availability.Date.Year == today.Year).Sum(b => b.TotalPrice)
            + paidServiceBookings.Where(b => b.BookingDate.Month == today.Month && b.BookingDate.Year == today.Year).Sum(b => b.TotalPrice); 

        var chartData = new List<MonthlyChartDataDto>();
        for (int i = 5; i >= 0; i--)
        {
            var date = today.AddMonths(-i);

            var monthProp = paidBookings
                .Where(b => b.CheckInDate.Month == date.Month && b.CheckInDate.Year == date.Year)
                .Sum(b => b.TotalPrice);

            var monthExp = paidExpBookings
                .Where(b => b.Availability.Date.Month == date.Month && b.Availability.Date.Year == date.Year)
                .Sum(b => b.TotalPrice);

            var monthSvc = paidServiceBookings 
                .Where(b => b.BookingDate.Month == date.Month && b.BookingDate.Year == date.Year)
                .Sum(b => b.TotalPrice);

            chartData.Add(new MonthlyChartDataDto
            {
                Month = date.ToString("MMM"),
                Year = date.Year,
                Amount = monthProp + monthExp + monthSvc
            });
        }

        // =========================================================
        // 5. Return Result
        // =========================================================
        return new EarningsDashboardDto
        {
            TotalEarnings = grandTotalEarnings,
            PendingPayouts = grandPendingPayouts,
            ThisMonthEarnings = thisMonthTotal,
            ChartData = chartData,
            RecentTransactions = finalRecentTransactions
        };
    }
}
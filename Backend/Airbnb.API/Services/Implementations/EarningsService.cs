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
   
        var bookings = await _context.Bookings
            .Include(b => b.Property)
            .Include(b => b.Guest)
            .Where(b => b.Property.HostId == hostId &&
                        b.Status != BookingStatus.Cancelled &&
                        b.Status != BookingStatus.Rejected)
            .ToListAsync();

        var today = DateTime.Today;

        var paidBookings = bookings.Where(b => b.Status == BookingStatus.Completed || b.CheckInDate <= today);

        var pendingBookings = bookings.Where(b => b.Status == BookingStatus.Confirmed && b.CheckInDate > today);

        var chartData = new List<MonthlyChartDataDto>();
        for (int i = 5; i >= 0; i--)
        {
            var date = today.AddMonths(-i);
            var monthEarnings = paidBookings
                .Where(b => b.CheckInDate.Month == date.Month && b.CheckInDate.Year == date.Year)
                .Sum(b => b.TotalPrice);

            chartData.Add(new MonthlyChartDataDto
            {
                Month = date.ToString("MMM"),
                Year = date.Year,
                Amount = monthEarnings
            });
        }

        
        var transactions = bookings
            .OrderByDescending(b => b.CheckInDate)
            .Take(10)
            .Select(b => new TransactionDto
            {
                BookingId = b.Id,
                GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
                PropertyTitle = b.Property.Title,
                Date = b.CheckInDate.AddDays(1),
                Amount = b.TotalPrice,
                Status = b.CheckInDate <= today ? "Paid" : "Pending"
            })
            .ToList();

        return new EarningsDashboardDto
        {
            TotalEarnings = paidBookings.Sum(b => b.TotalPrice),
            PendingPayouts = pendingBookings.Sum(b => b.TotalPrice),
            ThisMonthEarnings = paidBookings
                .Where(b => b.CheckInDate.Month == today.Month && b.CheckInDate.Year == today.Year)
                .Sum(b => b.TotalPrice),
            ChartData = chartData,
            RecentTransactions = transactions
        };
    }
}
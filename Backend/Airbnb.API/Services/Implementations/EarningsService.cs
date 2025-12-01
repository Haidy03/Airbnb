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

        // ---------------------------------------------------------
        // 1. كود الشقق (القديم كما هو)
        // ---------------------------------------------------------
        var bookings = await _context.Bookings
            .Include(b => b.Property)
            .Include(b => b.Guest)
            .Where(b => b.Property.HostId == hostId &&
                        b.Status != BookingStatus.Cancelled &&
                        b.Status != BookingStatus.Rejected)
            .ToListAsync();

        var paidBookings = bookings.Where(b => b.Status == BookingStatus.Completed || b.CheckInDate <= today);
        var pendingBookings = bookings.Where(b => b.Status == BookingStatus.Confirmed && b.CheckInDate > today);

        // قائمة معاملات الشقق (كما هي)
        var transactions = bookings
            .OrderByDescending(b => b.CheckInDate)
            .Select(b => new TransactionDto
            {
                BookingId = b.Id,
                GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
                PropertyTitle = b.Property.Title,
                Date = b.CheckInDate.AddDays(1),
                Amount = b.TotalPrice,
                Status = b.CheckInDate <= today ? "Paid" : "Pending"
            })
            .ToList(); // شلت Take(10) من هنا عشان نعمل ترتيب كلي تحت

        // ---------------------------------------------------------
        // 2. كود التجارب (الجديد)
        // ---------------------------------------------------------
        var experienceBookings = await _context.ExperienceBookings
                .Include(b => b.Experience)
                .Include(b => b.Guest)
                .Include(b => b.Availability)
                .Where(b => b.Experience.HostId == hostId &&
                            b.Status != ExperienceBookingStatus.Cancelled)
                .ToListAsync();

        var paidExpBookings = experienceBookings
            .Where(b => b.Status == ExperienceBookingStatus.Completed || b.Availability.Date <= today);

        var pendingExpBookings = experienceBookings
            .Where(b => b.Status == ExperienceBookingStatus.Confirmed && b.Availability.Date > today);

        // قائمة معاملات التجارب
        var expTransactions = experienceBookings.Select(b => new TransactionDto
        {
            BookingId = b.Id,
            GuestName = $"{b.Guest.FirstName} {b.Guest.LastName}",
            PropertyTitle = b.Experience.Title,
            Date = b.Availability.Date,
            Amount = b.TotalPrice,
            Status = (b.Status == ExperienceBookingStatus.Completed || b.Availability.Date <= today) ? "Paid" : "Pending"
        }).ToList();

        // ---------------------------------------------------------
        // 3. التجميع (دمج القديم والجديد)
        // ---------------------------------------------------------

        // دمج القائمتين وترتيبهم وأخذ أحدث 10
        var finalRecentTransactions = transactions
            .Concat(expTransactions)
            .OrderByDescending(t => t.Date)
            .Take(10)
            .ToList();

        // حساب المجاميع الكلية
        var grandTotalEarnings = paidBookings.Sum(b => b.TotalPrice) + paidExpBookings.Sum(b => b.TotalPrice);
        var grandPendingPayouts = pendingBookings.Sum(b => b.TotalPrice) + pendingExpBookings.Sum(b => b.TotalPrice);

        // حساب هذا الشهر
        var thisMonthProp = paidBookings
                .Where(b => b.CheckInDate.Month == today.Month && b.CheckInDate.Year == today.Year)
                .Sum(b => b.TotalPrice);
        var thisMonthExp = paidExpBookings
            .Where(b => b.Availability.Date.Month == today.Month && b.Availability.Date.Year == today.Year)
            .Sum(b => b.TotalPrice);
        var grandThisMonthEarnings = thisMonthProp + thisMonthExp;

        // الشارت (Chart)
        var chartData = new List<MonthlyChartDataDto>();
        for (int i = 5; i >= 0; i--)
        {
            var date = today.AddMonths(-i);

            var monthEarningsProp = paidBookings
                .Where(b => b.CheckInDate.Month == date.Month && b.CheckInDate.Year == date.Year)
                .Sum(b => b.TotalPrice);

            var monthEarningsExp = paidExpBookings
                    .Where(b => b.Availability.Date.Month == date.Month && b.Availability.Date.Year == date.Year)
                    .Sum(b => b.TotalPrice);

            chartData.Add(new MonthlyChartDataDto
            {
                Month = date.ToString("MMM"),
                Year = date.Year,
                Amount = monthEarningsProp + monthEarningsExp
            });
        }

        // ---------------------------------------------------------
        // 4. الإرجاع (Return)
        // ---------------------------------------------------------
        return new EarningsDashboardDto
        {
            // ✅ هنا التعديل المهم: نستخدم المتغيرات المجمعة بدلاً من حساب الشقق فقط
            TotalEarnings = grandTotalEarnings,
            PendingPayouts = grandPendingPayouts,
            ThisMonthEarnings = grandThisMonthEarnings,

            ChartData = chartData,

            // ✅ نرجع القائمة المدمجة وليست قائمة الشقق فقط
            RecentTransactions = finalRecentTransactions
        };
    }
}
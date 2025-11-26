namespace Airbnb.API.DTOs.Earnings
{
    public class EarningsDashboardDto
    {
        public decimal TotalEarnings { get; set; } 
        public decimal PendingPayouts { get; set; }   
        public decimal ThisMonthEarnings { get; set; } 
        public List<MonthlyChartDataDto> ChartData { get; set; } = new();
        public List<TransactionDto> RecentTransactions { get; set; } = new();
    }

    public class MonthlyChartDataDto
    {
        public string Month { get; set; } 
        public int Year { get; set; }
        public decimal Amount { get; set; }
    }

    public class TransactionDto
    {
        public int BookingId { get; set; }
        public string GuestName { get; set; }
        public string PropertyTitle { get; set; }
        public DateTime Date { get; set; } 
        public decimal Amount { get; set; }
        public string Status { get; set; } 
    }
}
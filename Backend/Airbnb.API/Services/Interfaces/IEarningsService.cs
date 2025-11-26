using Airbnb.API.DTOs.Earnings;

public interface IEarningsService
{
    Task<EarningsDashboardDto> GetHostEarningsAsync(string hostId);
}
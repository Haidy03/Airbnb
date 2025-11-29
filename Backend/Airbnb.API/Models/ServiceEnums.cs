namespace Airbnb.API.Models
{
    
    public enum ServicePricingUnit
    {
        PerHour = 0,
        PerPerson = 1,
        PerSession = 2,
        FlatFee = 3
    }

   
    public enum ServiceLocationType
    {
        Mobile = 0, 
        OnSite = 1  
    }

    public enum ServiceStatus
    {
        Draft = 0,
        PendingApproval = 1,
        Active = 2,
        Inactive = 3,
        Rejected = 4
    }
}
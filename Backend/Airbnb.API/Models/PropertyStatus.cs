namespace Airbnb.API.Models
{
    public enum PropertyStatus
    {
        Draft = 0,              // قيد الإنشاء - لم تكتمل بعد
        PendingApproval = 1,    // مكتملة وبانتظار موافقة Admin
        Approved = 2,           // تمت الموافقة من Admin
        Rejected = 3,           // مرفوضة من Admin
        Active = 4,             // منشورة ومفعلة (ظاهرة للضيوف)
        Inactive = 5,           // غير مفعلة (Host أوقفها)
        Suspended = 6           // معلقة (Admin علقها)
    }
}

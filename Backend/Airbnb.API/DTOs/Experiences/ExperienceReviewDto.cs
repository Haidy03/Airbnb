// ✅ التعديل المطلوب
public class ExperienceReviewDto
{
    public int Id { get; set; }
    public string Comment { get; set; }
    public int Rating { get; set; }

    // 1. إضافة الـ ID عشان أزرار الحذف والتعديل تظهر
    public string ReviewerId { get; set; }
    public string ReviewerName { get; set; }
    public int? ValueRating { get; set; }
    public int? CommunicationRating { get; set; }
    public int? LocationRating { get; set; }
    public int? CleanlinessRating { get; set; }

    // 2. توحيد الاسم ليصبح مثل الـ Property
    public string ReviewerProfileImage { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ExperienceId { get; set; }

}
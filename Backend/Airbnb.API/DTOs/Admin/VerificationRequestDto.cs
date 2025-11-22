namespace Airbnb.API.DTOs.Admin
{
    public class VerificationRequestDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public string IdType { get; set; }
        public string IdNumber { get; set; }
        public string IdImageUrl { get; set; }
        public string Status { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string? AdminNotes { get; set; }
    }
}

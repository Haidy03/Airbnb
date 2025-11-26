using System.ComponentModel.DataAnnotations;

public class LoginDto
{
    // Allow Email OR Phone
    [Required]
    public string Identifier { get; set; }
    [Required]
    public string Password { get; set; }
}
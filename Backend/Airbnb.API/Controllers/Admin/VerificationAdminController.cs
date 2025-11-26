using Airbnb.API.Models;
using Airbnb.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/admin/verification")]
[ApiController]
[Authorize(Roles = "Admin")] // CRITICAL!
public class VerificationAdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;

    public VerificationAdminController(UserManager<ApplicationUser> userManager, IEmailService emailService)
    {
        _userManager = userManager;
        _emailService = emailService;
    }

    // 1. Get Pending Requests
    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingRequests()
    {
        var users = await _userManager.Users
            .Where(u => u.VerificationStatus == "Pending")
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, u.IdentificationImagePath })
            .ToListAsync();

        return Ok(users);
    }

    // 2. Approve
    [HttpPost("{userId}/approve")]
    public async Task<IActionResult> ApproveUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.IsVerified = true;
        user.VerificationStatus = "Approved";
        await _userManager.UpdateAsync(user);

        await _emailService.SendEmailAsync(user.Email, "ID Verified", "Congratulations! You are now a verified member.");

        return Ok(new { message = "User verified." });
    }

    // 3. Reject
    [HttpPost("{userId}/reject")]
    public async Task<IActionResult> RejectUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        user.IsVerified = false;
        user.VerificationStatus = "Rejected";
        // Optional: Delete the image to respect privacy
        await _userManager.UpdateAsync(user);

        await _emailService.SendEmailAsync(user.Email, "Verification Failed", "Your ID was not accepted. Please try again.");

        return Ok(new { message = "User rejected." });
    }
}
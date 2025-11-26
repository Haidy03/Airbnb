using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[Route("api/host/[controller]")]
[ApiController]
[Authorize]
public class EarningsController : ControllerBase
{
    private readonly IEarningsService _earningsService;

    public EarningsController(IEarningsService earningsService)
    {
        _earningsService = earningsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetEarnings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var data = await _earningsService.GetHostEarningsAsync(userId);
        return Ok(new { success = true, data });
    }
}
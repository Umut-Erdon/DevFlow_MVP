using DevFlow.Api.Data;
using DevFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevFlow.Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize(Roles = Roles.Admin + "," + Roles.DepartmentManager)]
public class ActivityController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() =>
        Ok(await db.ActivityLogs.OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync());
}

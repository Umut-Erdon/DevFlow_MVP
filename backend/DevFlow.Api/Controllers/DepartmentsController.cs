using DevFlow.Api.Data;
using DevFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevFlow.Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class DepartmentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await db.Departments.OrderBy(x => x.Name).ToListAsync());

    public record CreateDepartment(string Name, string? Description);
    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create(CreateDepartment request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Departman adı zorunludur." });
        var entity = new Department { Name = request.Name.Trim(), Description = request.Description };
        db.Departments.Add(entity);
        await db.SaveChangesAsync();
        return Ok(entity);
    }
}

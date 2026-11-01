using DevFlow.Api.Data;
using DevFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevFlow.Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class ProjectsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await db.Projects.OrderByDescending(x => x.StartDate).ToListAsync());

    public record ProjectRequest(string Name, string? Description, DateTime? EndDate, int? DepartmentId);
    [HttpPost, Authorize(Roles = Roles.Admin + "," + Roles.DepartmentManager)]
    public async Task<IActionResult> Create(ProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Proje adı zorunludur." });
        var project = new Project { Name = request.Name.Trim(), Description = request.Description,
            EndDate = request.EndDate, DepartmentId = request.DepartmentId };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return Ok(project);
    }
}

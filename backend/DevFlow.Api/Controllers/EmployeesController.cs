using DevFlow.Api.Data;
using DevFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevFlow.Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize(Roles = Roles.Admin + "," + Roles.DepartmentManager)]
public class EmployeesController(UserManager<AppUser> users, AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var list = await users.Users.Where(x => x.IsActive)
            .Select(x => new { x.Id, x.FirstName, x.LastName, x.Email, x.Position, x.DepartmentId })
            .ToListAsync();
        return Ok(list);
    }

    public record CreateEmployee(string FirstName, string LastName, string Email,
        string Position, int? DepartmentId, string Password, string Role);
    [HttpPost, Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create(CreateEmployee request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "E-posta ve şifre zorunludur." });
        if (await users.FindByEmailAsync(request.Email) is not null)
            return Conflict(new { message = "Bu e-posta zaten kayıtlı." });

        var role = new[] { Roles.Employee, Roles.DepartmentManager }.Contains(request.Role)
            ? request.Role : Roles.Employee;
        var user = new AppUser {
            UserName = request.Email, Email = request.Email,
            FirstName = request.FirstName, LastName = request.LastName,
            Position = request.Position, DepartmentId = request.DepartmentId,
            EmailConfirmed = true, CompanyId = 1
        };
        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);
        await users.AddToRoleAsync(user, role);
        return Ok(new { user.Id, user.Email, user.FirstName, user.LastName, role });
    }

    [HttpPatch("{id}/deactivate"), Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Deactivate(string id)
    {
        var user = await users.FindByIdAsync(id);
        if (user is null) return NotFound();
        user.IsActive = false;
        await users.UpdateAsync(user);
        return NoContent();
    }
}

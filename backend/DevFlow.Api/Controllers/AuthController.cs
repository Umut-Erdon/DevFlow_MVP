using DevFlow.Api.Models;
using DevFlow.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace DevFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(UserManager<AppUser> users, SignInManager<AppUser> signIn,
    JwtService jwt) : ControllerBase
{
    public record LoginRequest(string Email, string Password);
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive ||
            !await signIn.CheckPasswordSignInAsync(user, request.Password, false).ContinueWith(t => t.Result.Succeeded))
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });

        return Ok(new {
            token = await jwt.CreateToken(user),
            user = new { user.Id, user.Email, user.FirstName, user.LastName, user.Position,
                role = (await users.GetRolesAsync(user)).FirstOrDefault() ?? Roles.Employee }
        });
    }
}

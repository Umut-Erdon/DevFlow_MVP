using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DevFlow.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace DevFlow.Api.Services;

public class JwtService(IConfiguration configuration, UserManager<AppUser> userManager)
{
    public async Task<string> CreateToken(AppUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? ""),
            new(ClaimTypes.Email, user.Email ?? ""),
            new("companyId", user.CompanyId.ToString()),
            new("firstName", user.FirstName),
            new("lastName", user.LastName)
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        var section = configuration.GetSection("Jwt");
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(section["Key"]!));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(section["Issuer"], section["Audience"], claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(section["ExpiresInMinutes"]!)),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

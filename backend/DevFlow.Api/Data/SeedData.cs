
using DevFlow.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DevFlow.Api.Data;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider services)
    {
        var roles = services.GetRequiredService<RoleManager<IdentityRole>>();
        var users = services.GetRequiredService<UserManager<AppUser>>();
        var db = services.GetRequiredService<AppDbContext>();

        // ROLLER
        foreach (var role in new[]
        {
            Roles.Admin,
            Roles.DepartmentManager,
            Roles.Employee
        })
        {
            if (!await roles.RoleExistsAsync(role))
            {
                var result = await roles.CreateAsync(new IdentityRole(role));

                if (!result.Succeeded)
                    throw new Exception($"Rol oluşturulamadı: {role}");
            }
        }

        // YÖNETİCİ HESABI
        var admin = await users.FindByEmailAsync("admin@devflow.local");

        if (admin is null)
        {
            admin = new AppUser
            {
                UserName = "admin@devflow.local",
                Email = "admin@devflow.local",
                FirstName = "DevFlow",
                LastName = "Admin",
                Position = "Administrator",
                EmailConfirmed = true,
                CompanyId = 1
            };

            var result = await users.CreateAsync(admin, "DevFlow123!");

            if (!result.Succeeded)
                throw new Exception("Yönetici hesabı oluşturulamadı.");
        }

        if (!await users.IsInRoleAsync(admin, Roles.Admin))
            await users.AddToRoleAsync(admin, Roles.Admin);

        // ÇALIŞANLAR
        var employees = new[]
        {
            new { First = "Ahmet", Last = "Yılmaz", Department = "Yazılım Geliştirme", Position = "Software Developer" },
            new { First = "Elif", Last = "Demir", Department = "Frontend Geliştirme", Position = "Frontend Developer" },
            new { First = "Mehmet", Last = "Kaya", Department = "Backend Geliştirme", Position = "Backend Developer" },
            new { First = "Zeynep", Last = "Çelik", Department = "Yapay Zekâ ve Veri", Position = "AI Developer" },
            new { First = "Can", Last = "Şahin", Department = "UI/UX Tasarım", Position = "UI/UX Designer" },
            new { First = "Ece", Last = "Yıldız", Department = "Kalite ve Test", Position = "QA Specialist" },
            new { First = "Burak", Last = "Aydın", Department = "İnsan Kaynakları", Position = "HR Specialist" },
            new { First = "Merve", Last = "Arslan", Department = "Bilgi Teknolojileri", Position = "IT Specialist" },
            new { First = "Emre", Last = "Koç", Department = "Proje Yönetimi", Position = "Project Manager" },
            new { First = "Deniz", Last = "Kurt", Department = "İş Geliştirme", Position = "Business Development Specialist" }
        };

        foreach (var employee in employees)
        {
            var department = await db.Departments.FirstOrDefaultAsync(
                x => x.Name == employee.Department && x.CompanyId == 1);

            if (department is null)
                throw new Exception($"Departman bulunamadı: {employee.Department}. Önce SQL departman scriptini çalıştır.");

            var email = $"employee{Array.IndexOf(employees, employee) + 1:00}@devflow.local";

            var user = await users.FindByEmailAsync(email);

            if (user is null)
            {
                user = new AppUser
                {
                    UserName = email,
                    Email = email,
                    FirstName = employee.First,
                    LastName = employee.Last,
                    Position = employee.Position,
                    DepartmentId = department.Id,
                    CompanyId = 1,
                    EmailConfirmed = true
                };

                var createResult = await users.CreateAsync(user, "DevFlow123!");

                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    throw new Exception($"{email} oluşturulamadı: {errors}");
                }
            }
            else
            {
                user.DepartmentId = department.Id;
                user.Position = employee.Position;
                user.CompanyId = 1;

                var updateResult = await users.UpdateAsync(user);

                if (!updateResult.Succeeded)
                    throw new Exception($"{email} güncellenemedi.");
            }

            var role = email == "employee09@devflow.local"
                ? Roles.DepartmentManager
                : Roles.Employee;

            if (!await users.IsInRoleAsync(user, role))
            {
                var roleResult = await users.AddToRoleAsync(user, role);

                if (!roleResult.Succeeded)
                    throw new Exception($"{email} rolü atanamadı.");
            }
        }
    }
}

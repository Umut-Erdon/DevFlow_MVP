using DevFlow.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DevFlow.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser>(options)
{
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<WorkTask> WorkTasks => Set<WorkTask>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<AppUser>().HasIndex(x => new { x.CompanyId, x.Email });
        builder.Entity<Department>().HasIndex(x => new { x.CompanyId, x.Name }).IsUnique();
        builder.Entity<Project>().HasOne<Department>().WithMany().HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<WorkTask>().HasOne<Project>().WithMany().HasForeignKey(x => x.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.Entity<TaskComment>().HasOne<WorkTask>().WithMany().HasForeignKey(x => x.TaskId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

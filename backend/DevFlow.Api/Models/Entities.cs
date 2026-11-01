using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace DevFlow.Api.Models;

public static class Roles
{
    public const string Admin = "Admin";
    public const string DepartmentManager = "DepartmentManager";
    public const string Employee = "Employee";
}

public class AppUser : IdentityUser
{
    [MaxLength(80)] public string FirstName { get; set; } = "";
    [MaxLength(80)] public string LastName { get; set; } = "";
    [MaxLength(100)] public string Position { get; set; } = "";
    public int? DepartmentId { get; set; }
    public int CompanyId { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

public class Department
{
    public int Id { get; set; }
    [MaxLength(100)] public string Name { get; set; } = "";
    [MaxLength(500)] public string? Description { get; set; }
    public int CompanyId { get; set; } = 1;
    public string? ManagerId { get; set; }
}

public class Project
{
    public int Id { get; set; }
    [MaxLength(150)] public string Name { get; set; } = "";
    [MaxLength(1000)] public string? Description { get; set; }
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
    [MaxLength(30)] public string Status { get; set; } = "Planning";
    public int? DepartmentId { get; set; }
    public int CompanyId { get; set; } = 1;
}

public class WorkTask
{
    public int Id { get; set; }
    [MaxLength(180)] public string Title { get; set; } = "";
    [MaxLength(2000)] public string? Description { get; set; }
    public int? ProjectId { get; set; }
    public string? AssigneeId { get; set; }
    public string CreatedById { get; set; } = "";
    [MaxLength(30)] public string Priority { get; set; } = "Normal";
    [MaxLength(30)] public string Status { get; set; } = "Todo";
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CompanyId { get; set; } = 1;
}

public class TaskComment
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public string UserId { get; set; } = "";
    [MaxLength(1500)] public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ActivityLog
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    [MaxLength(100)] public string Action { get; set; } = "";
    [MaxLength(500)] public string Details { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CompanyId { get; set; } = 1;
}

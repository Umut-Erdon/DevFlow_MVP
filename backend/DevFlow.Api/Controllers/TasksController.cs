
using System.Security.Claims;
using DevFlow.Api.Data;
using DevFlow.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevFlow.Api.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class TasksController(AppDbContext db) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private bool IsManager => User.IsInRole(Roles.Admin) || User.IsInRole(Roles.DepartmentManager);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var query = db.WorkTasks.AsNoTracking();

        if (!IsManager)
            query = query.Where(x => x.AssigneeId == UserId);

        var tasks = await query.OrderBy(x => x.DueDate).ToListAsync();

        return Ok(tasks);
    }

    public record CreateTask(
        string Title,
        string? Description,
        int? ProjectId,
        string? AssigneeId,
        string Priority,
        DateTime? DueDate
    );

    [HttpPost, Authorize(Roles = Roles.Admin + "," + Roles.DepartmentManager)]
    public async Task<IActionResult> Create(CreateTask request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Görev başlığı zorunludur." });

        var task = new WorkTask
        {
            Title = request.Title.Trim(),
            Description = request.Description,
            ProjectId = request.ProjectId,
            AssigneeId = request.AssigneeId,
            Priority = request.Priority,
            DueDate = request.DueDate,
            CreatedById = UserId
        };

        db.WorkTasks.Add(task);

        db.ActivityLogs.Add(new ActivityLog
        {
            UserId = UserId,
            Action = "TaskCreated",
            Details = $"Görev oluşturuldu: {task.Title}"
        });

        await db.SaveChangesAsync();

        return Ok(task);
    }

    public record UpdateTaskStatusRequest(string Status);

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        UpdateTaskStatusRequest request)
    {
        var allowed = new[] { "Todo", "InProgress", "Review", "Done" };

        if (!allowed.Contains(request.Status))
            return BadRequest(new { message = "Geçersiz görev durumu." });

        var task = await db.WorkTasks.FirstOrDefaultAsync(x => x.Id == id);

        if (task is null)
            return NotFound();

        if (!IsManager && task.AssigneeId != UserId)
            return Forbid();

        var newStatus = request.Status;

        if (!IsManager && newStatus == "Done")
            newStatus = "Review";

        task.Status = newStatus;

        db.ActivityLogs.Add(new ActivityLog
        {
            UserId = UserId,
            Action = "TaskStatusChanged",
            Details = $"'{task.Title}' görevinin durumu: {task.Status}"
        });

        await db.SaveChangesAsync();

        return Ok(task);
    }

    public record AddComment(string Content);

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> Comment(int id, AddComment request)
    {
        var task = await db.WorkTasks.FirstOrDefaultAsync(x => x.Id == id);

        if (task is null)
            return NotFound();

        if (!IsManager && task.AssigneeId != UserId)
            return Forbid();

        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest();

        var comment = new TaskComment
        {
            TaskId = id,
            UserId = UserId,
            Content = request.Content.Trim()
        };

        db.TaskComments.Add(comment);

        db.ActivityLogs.Add(new ActivityLog
        {
            UserId = UserId,
            Action = "CommentAdded",
            Details = $"Göreve yorum eklendi: {task.Title}"
        });

        await db.SaveChangesAsync();

        return Ok(comment);
    }

    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        var task = await db.WorkTasks.FirstOrDefaultAsync(x => x.Id == id);

        if (task is null)
            return NotFound();

        if (!IsManager && task.AssigneeId != UserId)
            return Forbid();

        return Ok(
            await db.TaskComments
                .Where(x => x.TaskId == id)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync()
        );
    }
}

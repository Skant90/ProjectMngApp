<?php

namespace App\Models;

use App\Enums\TaskStatus;
use App\Enums\TaskPriority;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id', 'parent_task_id', 'title', 'description',
        'status', 'priority', 'assigned_to', 'created_by',
        'estimated_hours', 'spent_hours', 'due_date',
        'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
            'due_date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'estimated_hours' => 'float',
            'spent_hours' => 'float',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function parentTask(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_task_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'task_tag');
    }

    public function watchers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_watchers');
    }

    public function visibility(): HasMany
    {
        return $this->hasMany(TaskVisibility::class);
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(TaskChecklist::class)->orderBy('sort_order');
    }

    public function comments(): \Illuminate\Database\Eloquent\Collection
    {
        return Comment::where('entity_type', 'task')
            ->where('entity_id', $this->id)
            ->with('user')
            ->latest()
            ->get();
    }

    public function attachments(): \Illuminate\Database\Eloquent\Collection
    {
        return Attachment::where('entity_type', 'task')
            ->where('entity_id', $this->id)
            ->with('uploader')
            ->latest()
            ->get();
    }

    public function isOverdue(): bool
    {
        return $this->due_date
            && $this->due_date->isPast()
            && !in_array($this->status->value, ['done', 'cancelled']);
    }

    public function canBeViewedBy(User $user): bool
    {
        if ($user->isAdmin()) return true;

        $member = ProjectMember::where('project_id', $this->project_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$member) return false;
        if ($member->project_role === 'manager' || $member->can_view_all_tasks) return true;

        return TaskVisibility::where('task_id', $this->id)
            ->where('user_id', $user->id)
            ->where('can_view', true)
            ->exists();
    }
}

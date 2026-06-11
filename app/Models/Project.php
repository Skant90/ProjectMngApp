<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use App\Enums\ProjectPriority;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'status', 'priority',
        'start_date', 'end_date', 'created_by',
    ];

    protected $appends = ['progress'];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'priority' => ProjectPriority::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function getProgressAttribute(): int
    {
        $total = $this->tasks()->whereNull('parent_task_id')->count();
        if ($total === 0) return 0;
        $done = $this->tasks()->whereNull('parent_task_id')->where('status', 'done')->count();
        return (int) round(($done / $total) * 100);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot(['project_role', 'can_view_all_tasks', 'can_add_tasks', 'can_upload_files', 'can_invite_users'])
            ->withTimestamps();
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(ProjectContact::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function chatRooms(): HasMany
    {
        return $this->hasMany(ChatRoom::class);
    }

    public function activityLogs(): \Illuminate\Database\Eloquent\Collection
    {
        return ActivityLog::where('entity_type', 'project')
            ->where('entity_id', $this->id)
            ->with('user')
            ->latest()
            ->get();
    }
}

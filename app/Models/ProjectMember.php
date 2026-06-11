<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMember extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'project_id', 'user_id', 'project_role',
        'can_view_all_tasks', 'can_add_tasks', 'can_upload_files', 'can_invite_users',
    ];

    protected function casts(): array
    {
        return [
            'can_view_all_tasks' => 'boolean',
            'can_add_tasks' => 'boolean',
            'can_upload_files' => 'boolean',
            'can_invite_users' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

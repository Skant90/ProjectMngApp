<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskVisibility extends Model
{
    public $timestamps = false;

    protected $table = 'task_visibility';

    protected $fillable = [
        'task_id', 'user_id', 'can_view', 'can_comment', 'can_upload_files', 'can_edit_status',
    ];

    protected function casts(): array
    {
        return [
            'can_view' => 'boolean',
            'can_comment' => 'boolean',
            'can_upload_files' => 'boolean',
            'can_edit_status' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

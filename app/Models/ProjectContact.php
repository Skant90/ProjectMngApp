<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectContact extends Model
{
    protected $fillable = [
        'project_id', 'first_name', 'last_name', 'email',
        'phone', 'company', 'position', 'notes',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}

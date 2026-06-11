<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Attachment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'entity_type', 'entity_id', 'uploaded_by',
        'original_filename', 'stored_filename', 'file_path',
        'mime_type', 'file_size',
    ];

    protected $appends = ['download_url'];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function getDownloadUrlAttribute(): string
    {
        return route('attachments.download', $this->id);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function existsOnDisk(): bool
    {
        return Storage::disk('uploads')->exists($this->stored_filename);
    }
}

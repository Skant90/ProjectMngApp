<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Attachment;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentController extends Controller
{
    private const MAX_FILE_SIZE_MB = 100;

    private const ALLOWED_MIMES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        'application/zip', 'application/x-zip-compressed',
        'application/x-rar-compressed',
        'video/mp4', 'video/mpeg',
        'audio/mpeg', 'audio/wav',
    ];

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        \Log::info('Attachment upload attempt', [
            'has_file' => $request->hasFile('file'),
            'entity_type' => $request->input('entity_type'),
            'entity_id' => $request->input('entity_id'),
            'file_valid' => $request->hasFile('file') ? $request->file('file')->isValid() : null,
            'file_error' => $request->hasFile('file') ? $request->file('file')->getError() : null,
            'original_name' => $request->hasFile('file') ? $request->file('file')->getClientOriginalName() : null,
            'mime' => $request->hasFile('file') ? $request->file('file')->getMimeType() : null,
            'all_keys' => array_keys($request->all()),
        ]);

        $data = $request->validate([
            'entity_type' => ['required', 'in:project,task,comment'],
            'entity_id' => ['required', 'integer'],
            'file' => [
                'required',
                'file',
                'max:' . (self::MAX_FILE_SIZE_MB * 1024),
                'mimes:jpeg,jpg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,rar,mp4,mpeg,mp3,wav',
            ],
        ]);

        $file = $request->file('file');
        $mimeType = $file->getMimeType();

        if (!in_array($mimeType, self::ALLOWED_MIMES)) {
            return back()->withErrors(['file' => 'Typ pliku jest niedozwolony.']);
        }

        if ($data['entity_type'] === 'task') {
            $task = Task::findOrFail($data['entity_id']);
            $this->authorize('uploadFiles', $task);
        }

        $storedFilename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = Storage::disk('uploads')->putFileAs('', $file, $storedFilename);

        $attachment = Attachment::create([
            'entity_type' => $data['entity_type'],
            'entity_id' => $data['entity_id'],
            'uploaded_by' => Auth::id(),
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'file_path' => $path,
            'mime_type' => $mimeType,
            'file_size' => $file->getSize(),
        ]);

        ActivityLog::record('upload_file', $data['entity_type'], $data['entity_id'], null, $file->getClientOriginalName());

        if ($data['entity_type'] === 'task') {
            return redirect()->route('tasks.show', $data['entity_id'])->with('success', 'Plik przesłany.');
        }

        return back()->with('success', 'Plik przesłany.');
    }

    public function download(Attachment $attachment): \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\RedirectResponse
    {
        // Check access based on entity type
        if ($attachment->entity_type === 'task') {
            $task = Task::findOrFail($attachment->entity_id);
            $this->authorize('view', $task);
        } elseif ($attachment->entity_type === 'project') {
            $project = \App\Models\Project::findOrFail($attachment->entity_id);
            $this->authorize('view', $project);
        }

        if (!Storage::disk('uploads')->exists($attachment->stored_filename)) {
            abort(404, 'Plik nie istnieje.');
        }

        ActivityLog::record('download_file', $attachment->entity_type, $attachment->entity_id, null, $attachment->original_filename);

        return Storage::disk('uploads')->download(
            $attachment->stored_filename,
            $attachment->original_filename
        );
    }

    public function destroy(Attachment $attachment): \Illuminate\Http\RedirectResponse
    {
        if ($attachment->uploaded_by !== Auth::id() && !Auth::user()->isAdmin()) {
            abort(403);
        }

        Storage::disk('uploads')->delete($attachment->stored_filename);
        ActivityLog::record('delete_file', $attachment->entity_type, $attachment->entity_id, $attachment->original_filename);
        $attachment->delete();

        return back()->with('success', 'Plik usunięty.');
    }
}

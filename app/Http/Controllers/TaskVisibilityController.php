<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskVisibility;
use Illuminate\Http\Request;

class TaskVisibilityController extends Controller
{
    public function update(Request $request, Task $task): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'visibility' => ['required', 'array'],
            'visibility.*.user_id' => ['required', 'exists:users,id'],
            'visibility.*.can_view' => ['boolean'],
            'visibility.*.can_comment' => ['boolean'],
            'visibility.*.can_upload_files' => ['boolean'],
            'visibility.*.can_edit_status' => ['boolean'],
        ]);

        foreach ($data['visibility'] as $v) {
            TaskVisibility::updateOrCreate(
                ['task_id' => $task->id, 'user_id' => $v['user_id']],
                [
                    'can_view' => $v['can_view'] ?? false,
                    'can_comment' => $v['can_comment'] ?? false,
                    'can_upload_files' => $v['can_upload_files'] ?? false,
                    'can_edit_status' => $v['can_edit_status'] ?? false,
                ]
            );
        }

        return back()->with('success', 'Widoczność zadania zaktualizowana.');
    }
}

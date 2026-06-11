<?php

namespace App\Policies;

use App\Models\ProjectMember;
use App\Models\Task;
use App\Models\TaskVisibility;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $task->canBeViewedBy($user);
    }

    public function create(User $user, \App\Models\Project $project): bool
    {
        if ($user->isAdmin()) return true;
        $member = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->first();
        return $member && ($member->project_role === 'manager' || $member->can_add_tasks);
    }

    public function update(User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        $member = ProjectMember::where('project_id', $task->project_id)
            ->where('user_id', $user->id)
            ->first();
        if (!$member) return false;
        if ($member->project_role === 'manager') return true;

        $visibility = TaskVisibility::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->first();
        return $visibility && $visibility->can_edit_status;
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        return ProjectMember::where('project_id', $task->project_id)
            ->where('user_id', $user->id)
            ->where('project_role', 'manager')
            ->exists();
    }

    public function comment(User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        $member = ProjectMember::where('project_id', $task->project_id)
            ->where('user_id', $user->id)
            ->first();
        if (!$member) return false;
        if ($member->project_role === 'manager' || $member->can_view_all_tasks) return true;

        $visibility = TaskVisibility::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->first();
        return $visibility && $visibility->can_comment;
    }

    public function uploadFiles(User $user, Task $task): bool
    {
        if ($user->isAdmin()) return true;
        $member = ProjectMember::where('project_id', $task->project_id)
            ->where('user_id', $user->id)
            ->first();
        if (!$member) return false;
        if ($member->project_role === 'manager') return true;

        $visibility = TaskVisibility::where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->first();
        return $visibility && $visibility->can_upload_files;
    }
}

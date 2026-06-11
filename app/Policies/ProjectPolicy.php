<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, Project $project): bool
    {
        if ($user->isAdmin()) return true;
        return ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    public function create(User $user): bool
    {
        return $user->isAtLeastManager();
    }

    public function update(User $user, Project $project): bool
    {
        if ($user->isAdmin()) return true;
        return ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->where('project_role', 'manager')
            ->exists();
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->isAdmin();
    }

    public function manageMembers(User $user, Project $project): bool
    {
        if ($user->isAdmin()) return true;
        $member = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->first();
        return $member && ($member->project_role === 'manager' || $member->can_invite_users);
    }
}

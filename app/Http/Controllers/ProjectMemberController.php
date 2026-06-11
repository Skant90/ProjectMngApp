<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectContact;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectMemberController extends Controller
{
    public function store(Request $request, Project $project): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('manageMembers', $project);

        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'project_role' => ['required', 'in:manager,member,guest'],
            'can_view_all_tasks' => ['boolean'],
            'can_add_tasks' => ['boolean'],
            'can_upload_files' => ['boolean'],
            'can_invite_users' => ['boolean'],
        ]);

        ProjectMember::updateOrCreate(
            ['project_id' => $project->id, 'user_id' => $data['user_id']],
            $data
        );

        $user = User::find($data['user_id']);
        Notification::send(
            $data['user_id'],
            'project_added',
            'Dodano do projektu',
            "Zostałeś/aś dodany/a do projektu: {$project->name}",
            route('projects.show', $project)
        );

        ActivityLog::record('add_member', 'project', $project->id, null, $user?->email);

        return back()->with('success', 'Uczestnik dodany.');
    }

    public function destroy(Project $project, User $user): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('manageMembers', $project);

        if ($user->id === Auth::id() && !Auth::user()->isAdmin()) {
            return back()->withErrors(['error' => 'Nie możesz usunąć samego siebie z projektu.']);
        }

        ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->delete();

        ActivityLog::record('remove_member', 'project', $project->id, $user->email);

        return back()->with('success', 'Uczestnik usunięty.');
    }

    public function storeContact(Request $request, Project $project): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $project);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $project->contacts()->create($data);

        return back()->with('success', 'Kontakt dodany.');
    }

    public function destroyContact(Project $project, ProjectContact $contact): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $project);

        if ($contact->project_id !== $project->id) abort(404);
        $contact->delete();

        return back()->with('success', 'Kontakt usunięty.');
    }
}

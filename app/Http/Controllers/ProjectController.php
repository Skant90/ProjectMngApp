<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();

        $query = $user->isAdmin()
            ? Project::query()
            : Project::whereHas('members', fn ($q) => $q->where('user_id', $user->id));

        $query->with(['creator'])
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $projects = $query->orderBy('updated_at', 'desc')->paginate(15);

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => $request->only(['status', 'priority', 'search']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Project::class);

        $users = User::where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('Projects/Create', ['users' => $users]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('create', Project::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,paused,completed,archived'],
            'priority' => ['required', 'in:low,normal,high,critical'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'members' => ['nullable', 'array'],
            'members.*.user_id' => ['required', 'exists:users,id'],
            'members.*.project_role' => ['required', 'in:manager,member,guest'],
        ]);

        $project = Project::create([
            ...$data,
            'created_by' => Auth::id(),
        ]);

        // Add creator as manager
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => Auth::id(),
            'project_role' => 'manager',
            'can_view_all_tasks' => true,
            'can_add_tasks' => true,
            'can_upload_files' => true,
            'can_invite_users' => true,
        ]);

        if (!empty($data['members'])) {
            foreach ($data['members'] as $member) {
                if ($member['user_id'] === Auth::id()) continue;
                ProjectMember::firstOrCreate(
                    ['project_id' => $project->id, 'user_id' => $member['user_id']],
                    [
                        'project_role' => $member['project_role'],
                        'can_view_all_tasks' => $member['project_role'] !== 'guest',
                        'can_add_tasks' => $member['project_role'] === 'manager',
                        'can_upload_files' => true,
                        'can_invite_users' => $member['project_role'] === 'manager',
                    ]
                );
            }
        }

        ActivityLog::record('create', 'project', $project->id, null, $project->name);

        return redirect()->route('projects.show', $project)->with('success', 'Projekt został utworzony.');
    }

    public function show(Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'creator',
            'members.user',
            'contacts',
        ]);

        $project->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done'),
            'tasks as overdue_tasks_count' => fn ($q) => $q->whereNotNull('due_date')
                ->where('due_date', '<', today())
                ->whereNotIn('status', ['done', 'cancelled']),
        ]);

        return Inertia::render('Projects/Show', [
            'project' => $project,
        ]);
    }

    public function edit(Project $project): Response
    {
        $this->authorize('update', $project);

        $users = User::where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('Projects/Edit', [
            'project' => $project->load('members.user'),
            'users' => $users,
        ]);
    }

    public function update(Request $request, Project $project): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $project);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,paused,completed,archived'],
            'priority' => ['required', 'in:low,normal,high,critical'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $old = $project->only(['name', 'status', 'priority']);
        $project->update($data);
        ActivityLog::record('update', 'project', $project->id, $old, $project->fresh()->only(['name', 'status', 'priority']));

        return redirect()->route('projects.show', $project)->with('success', 'Projekt zaktualizowany.');
    }

    public function destroy(Project $project): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('delete', $project);

        ActivityLog::record('delete', 'project', $project->id, $project->name);
        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Projekt usunięty.');
    }

    public function archive(Project $project): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $project);

        $project->update(['status' => ProjectStatus::Archived]);
        ActivityLog::record('archive', 'project', $project->id);

        return back()->with('success', 'Projekt zarchiwizowany.');
    }
}

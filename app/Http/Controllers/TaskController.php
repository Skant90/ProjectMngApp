<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();

        $query = $user->isAdmin()
            ? Task::query()
            : Task::whereHas('project.members', fn ($q) => $q->where('user_id', $user->id))
                ->where(function ($q) use ($user) {
                    $q->whereHas('project.members', function ($q2) use ($user) {
                        $q2->where('user_id', $user->id)
                            ->where(fn ($q3) => $q3->where('project_role', 'manager')->orWhere('can_view_all_tasks', true));
                    })->orWhereHas('visibility', fn ($q2) => $q2->where('user_id', $user->id)->where('can_view', true));
                });

        $query->with(['project', 'assignee', 'tags'])
            ->whereNull('parent_task_id');

        if ($request->filled('project_id')) $query->where('project_id', $request->project_id);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('priority')) $query->where('priority', $request->priority);
        if ($request->filled('assigned_to')) $query->where('assigned_to', $request->assigned_to);
        if ($request->filled('search')) $query->where('title', 'like', "%{$request->search}%");
        if ($request->boolean('overdue')) {
            $query->whereNotNull('due_date')
                ->where('due_date', '<', today())
                ->whereNotIn('status', ['done', 'cancelled']);
        }
        if ($request->filled('my_tasks')) {
            $query->where('assigned_to', $user->id);
        }

        $tasks = $query->orderBy('due_date')->orderBy('priority', 'desc')->paginate(20);

        $projects = $user->isAdmin()
            ? Project::orderBy('name')->get(['id', 'name'])
            : $user->projects()->orderBy('name')->get(['projects.id', 'projects.name']);

        $tags = Tag::orderBy('name')->get();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'projects' => $projects,
            'tags' => $tags,
            'filters' => $request->only(['project_id', 'status', 'priority', 'assigned_to', 'search', 'overdue', 'my_tasks']),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = Auth::user();
        $projectId = $request->query('project_id');

        $projects = $user->isAdmin()
            ? Project::where('status', 'active')->orderBy('name')->get(['id', 'name'])
            : $user->projects()->where('projects.status', 'active')->get(['projects.id', 'projects.name']);

        $users = User::where('is_active', true)->orderBy('first_name')->get(['id', 'first_name', 'last_name']);
        $tags = Tag::orderBy('name')->get();

        return Inertia::render('Tasks/Create', [
            'projects' => $projects,
            'users' => $users,
            'tags' => $tags,
            'default_project_id' => $projectId ? (int) $projectId : null,
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'parent_task_id' => ['nullable', 'exists:tasks,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:todo,in_progress,review,blocked,done,cancelled'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['exists:tags,id'],
        ]);

        $project = Project::findOrFail($data['project_id']);
        $this->authorize('create', [Task::class, $project]);

        $task = Task::create([
            ...$data,
            'created_by' => Auth::id(),
        ]);

        if (!empty($data['tags'])) {
            $task->tags()->sync($data['tags']);
        }

        // Notify assigned user
        if ($task->assigned_to && $task->assigned_to !== Auth::id()) {
            Notification::send(
                $task->assigned_to,
                'task_assigned',
                'Przypisano zadanie',
                "Zostałeś/aś przypisany/a do zadania: {$task->title}",
                route('tasks.show', $task)
            );
        }

        ActivityLog::record('create', 'task', $task->id, null, $task->title);

        return redirect()->route('tasks.show', $task)->with('success', 'Zadanie utworzone.');
    }

    public function show(Task $task): Response
    {
        $this->authorize('view', $task);

        $task->load([
            'project',
            'assignee',
            'creator',
            'tags',
            'subtasks.assignee',
            'checklists',
            'watchers',
            'visibility.user',
        ]);

        $comments = \App\Models\Comment::where('entity_type', 'task')
            ->where('entity_id', $task->id)
            ->with('user')
            ->latest()
            ->get();

        $attachments = \App\Models\Attachment::where('entity_type', 'task')
            ->where('entity_id', $task->id)
            ->with('uploader')
            ->latest()
            ->get();

        $activityLog = ActivityLog::where('entity_type', 'task')
            ->where('entity_id', $task->id)
            ->with('user')
            ->latest()
            ->limit(20)
            ->get();

        $projectUsers = User::whereHas('projectMemberships', fn ($q) => $q->where('project_id', $task->project_id))
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name']);

        $tags = Tag::orderBy('name')->get();

        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'comments' => $comments,
            'attachments' => $attachments,
            'activity_log' => $activityLog,
            'project_users' => $projectUsers,
            'tags' => $tags,
        ]);
    }

    public function update(Request $request, Task $task): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', 'in:todo,in_progress,review,blocked,done,cancelled'],
            'priority' => ['sometimes', 'required', 'in:low,medium,high,urgent'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'estimated_hours' => ['nullable', 'numeric', 'min:0'],
            'spent_hours' => ['nullable', 'numeric', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['exists:tags,id'],
        ]);

        $old = $task->only(['status', 'priority', 'assigned_to', 'due_date']);

        if (isset($data['status']) && $data['status'] === 'done' && $task->status->value !== 'done') {
            $data['completed_at'] = now();
        }
        if (isset($data['status']) && $data['status'] === 'in_progress' && !$task->started_at) {
            $data['started_at'] = now();
        }

        $task->update($data);

        if (array_key_exists('tags', $data)) {
            $task->tags()->sync($data['tags'] ?? []);
        }

        // Notify on reassignment
        if (isset($data['assigned_to']) && $data['assigned_to'] !== $old['assigned_to'] && $data['assigned_to']) {
            Notification::send(
                $data['assigned_to'],
                'task_assigned',
                'Przypisano zadanie',
                "Zostałeś/aś przypisany/a do zadania: {$task->title}",
                route('tasks.show', $task)
            );
        }

        ActivityLog::record('update', 'task', $task->id, $old, $task->fresh()->only(['status', 'priority', 'assigned_to']));

        if ($request->wantsJson()) {
            return back()->with('success', 'Zadanie zaktualizowane.');
        }

        return redirect()->route('tasks.show', $task)->with('success', 'Zadanie zaktualizowane.');
    }

    public function destroy(Task $task): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('delete', $task);

        $projectId = $task->project_id;
        ActivityLog::record('delete', 'task', $task->id, $task->title);
        $task->delete();

        return redirect()->route('projects.show', $projectId)->with('success', 'Zadanie usunięte.');
    }

    public function kanban(Project $project): Response
    {
        $this->authorize('view', $project);
        $user = Auth::user();

        $tasksQuery = Task::where('project_id', $project->id)
            ->whereNull('parent_task_id')
            ->with(['assignee', 'tags']);

        if (!$user->isAdmin()) {
            $member = ProjectMember::where('project_id', $project->id)
                ->where('user_id', $user->id)
                ->first();

            if (!$member || (!$member->can_view_all_tasks && $member->project_role !== 'manager')) {
                $tasksQuery->whereHas('visibility', fn ($q) => $q->where('user_id', $user->id)->where('can_view', true));
            }
        }

        $tasks = $tasksQuery->get()->groupBy(fn ($t) => $t->status->value);

        return Inertia::render('Tasks/Kanban', [
            'project' => $project,
            'tasks_by_status' => $tasks,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $myTasksQuery = Task::with(['project', 'assignee'])
            ->where('assigned_to', $user->id)
            ->whereNotIn('status', ['done', 'cancelled']);

        $overdueTasks = (clone $myTasksQuery)
            ->whereNotNull('due_date')
            ->where('due_date', '<', today())
            ->orderBy('due_date')
            ->limit(5)
            ->get();

        $todayTasks = (clone $myTasksQuery)
            ->whereDate('due_date', today())
            ->orderBy('priority', 'desc')
            ->limit(5)
            ->get();

        $upcomingTasks = (clone $myTasksQuery)
            ->whereDate('due_date', '>', today())
            ->whereDate('due_date', '<=', today()->addDays(7))
            ->orderBy('due_date')
            ->limit(5)
            ->get();

        $projectsQuery = $user->isAdmin()
            ? Project::query()
            : Project::whereHas('members', fn ($q) => $q->where('user_id', $user->id));

        $projects = $projectsQuery
            ->where('status', 'active')
            ->withCount(['tasks', 'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'done')])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        $recentActivity = ActivityLog::with('user')
            ->when(!$user->isAdmin(), function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->latest()
            ->limit(10)
            ->get();

        $stats = [];
        if ($user->isAdmin()) {
            $stats = [
                'total_projects' => Project::count(),
                'active_projects' => Project::where('status', 'active')->count(),
                'total_tasks' => Task::count(),
                'overdue_tasks' => Task::whereNotNull('due_date')
                    ->where('due_date', '<', today())
                    ->whereNotIn('status', ['done', 'cancelled'])
                    ->count(),
            ];
        }

        return Inertia::render('Dashboard/Index', [
            'overdue_tasks' => $overdueTasks,
            'today_tasks' => $todayTasks,
            'upcoming_tasks' => $upcomingTasks,
            'projects' => $projects,
            'recent_activity' => $recentActivity,
            'stats' => $stats,
        ]);
    }
}

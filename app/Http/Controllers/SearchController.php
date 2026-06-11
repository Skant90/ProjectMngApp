<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function index(Request $request): Response
    {
        $q = $request->get('q', '');
        $results = ['projects' => [], 'tasks' => [], 'users' => []];

        if (strlen($q) >= 2) {
            $user = Auth::user();

            $projectsQuery = $user->isAdmin()
                ? Project::query()
                : Project::whereHas('members', fn ($pq) => $pq->where('user_id', $user->id));

            $results['projects'] = $projectsQuery
                ->where('name', 'like', "%{$q}%")
                ->limit(5)
                ->get(['id', 'name', 'status']);

            $tasksQuery = $user->isAdmin()
                ? Task::query()
                : Task::whereHas('project.members', fn ($tq) => $tq->where('user_id', $user->id));

            $results['tasks'] = $tasksQuery
                ->where('title', 'like', "%{$q}%")
                ->with('project:id,name')
                ->limit(10)
                ->get(['id', 'title', 'status', 'project_id']);

            if ($user->isAdmin()) {
                $results['users'] = User::where(function ($uq) use ($q) {
                    $uq->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                })->limit(5)->get(['id', 'first_name', 'last_name', 'email']);
            }
        }

        return Inertia::render('Search/Index', [
            'query' => $q,
            'results' => $results,
        ]);
    }
}

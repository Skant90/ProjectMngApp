<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->when($request->search, fn ($q) => $q->where(function ($q2) use ($request) {
                $q2->where('first_name', 'like', "%{$request->search}%")
                    ->orWhere('last_name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->when($request->role, fn ($q) => $q->where('role', $request->role))
            ->when(isset($request->is_active), fn ($q) => $q->where('is_active', $request->is_active))
            ->orderBy('first_name')
            ->paginate(20);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'is_active']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Create');
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'in:admin,manager,user,guest'],
            'is_active' => ['boolean'],
        ]);

        $user = User::create($data);
        ActivityLog::record('create_user', 'user', $user->id, null, $user->email);

        return redirect()->route('admin.users.index')->with('success', 'Użytkownik utworzony.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/Edit', ['user' => $user]);
    }

    public function update(Request $request, User $user): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'in:admin,manager,user,guest'],
            'is_active' => ['boolean'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $old = $user->only(['role', 'is_active']);
        $user->update($data);
        ActivityLog::record('update_user', 'user', $user->id, $old, $user->fresh()->only(['role', 'is_active']));

        return redirect()->route('admin.users.index')->with('success', 'Użytkownik zaktualizowany.');
    }

    public function destroy(User $user): \Illuminate\Http\RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'Nie możesz usunąć własnego konta.']);
        }

        ActivityLog::record('delete_user', 'user', $user->id, $user->email);
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'Użytkownik usunięty.');
    }

    public function toggleActive(User $user): \Illuminate\Http\RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return back()->withErrors(['error' => 'Nie możesz dezaktywować własnego konta.']);
        }

        $user->update(['is_active' => !$user->is_active]);
        ActivityLog::record('toggle_active', 'user', $user->id, null, $user->is_active ? 'active' : 'inactive');

        return back()->with('success', $user->is_active ? 'Użytkownik aktywowany.' : 'Użytkownik dezaktywowany.');
    }
}

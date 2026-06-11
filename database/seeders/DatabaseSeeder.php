<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'System',
            'email' => 'admin@projectmng.local',
            'password' => Hash::make('Admin@12345!'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Manager
        $manager = User::create([
            'first_name' => 'Anna',
            'last_name' => 'Kowalska',
            'email' => 'manager@projectmng.local',
            'password' => Hash::make('Manager@123!'),
            'role' => 'manager',
            'is_active' => true,
        ]);

        // Users
        $user1 = User::create([
            'first_name' => 'Piotr',
            'last_name' => 'Nowak',
            'email' => 'piotr@projectmng.local',
            'password' => Hash::make('User@12345!'),
            'role' => 'user',
            'is_active' => true,
        ]);

        $user2 = User::create([
            'first_name' => 'Maria',
            'last_name' => 'Wiśniewska',
            'email' => 'maria@projectmng.local',
            'password' => Hash::make('User@12345!'),
            'role' => 'user',
            'is_active' => true,
        ]);

        // Tags
        $tags = collect([
            ['name' => 'Pilne', 'color' => '#ef4444'],
            ['name' => 'Dokumentacja', 'color' => '#3b82f6'],
            ['name' => 'Klient', 'color' => '#8b5cf6'],
            ['name' => 'Serwis', 'color' => '#f59e0b'],
            ['name' => 'Testy', 'color' => '#10b981'],
            ['name' => 'Blokada', 'color' => '#6b7280'],
        ])->map(fn ($t) => Tag::create($t));

        // Sample project
        $project = Project::create([
            'name' => 'Wdrożenie systemu CRM',
            'description' => 'Projekt wdrożenia nowego systemu CRM dla działu sprzedaży.',
            'status' => 'active',
            'priority' => 'high',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonths(3)->toDateString(),
            'created_by' => $admin->id,
        ]);

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $admin->id,
            'project_role' => 'manager',
            'can_view_all_tasks' => true,
            'can_add_tasks' => true,
            'can_upload_files' => true,
            'can_invite_users' => true,
        ]);

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $manager->id,
            'project_role' => 'manager',
            'can_view_all_tasks' => true,
            'can_add_tasks' => true,
            'can_upload_files' => true,
            'can_invite_users' => true,
        ]);

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $user1->id,
            'project_role' => 'member',
            'can_view_all_tasks' => true,
            'can_add_tasks' => false,
            'can_upload_files' => true,
            'can_invite_users' => false,
        ]);

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $user2->id,
            'project_role' => 'member',
            'can_view_all_tasks' => true,
            'can_add_tasks' => false,
            'can_upload_files' => true,
            'can_invite_users' => false,
        ]);

        // Sample tasks
        $task1 = Task::create([
            'project_id' => $project->id,
            'title' => 'Analiza wymagań systemu CRM',
            'description' => 'Zebranie i analiza wymagań biznesowych od interesariuszy.',
            'status' => 'done',
            'priority' => 'high',
            'assigned_to' => $manager->id,
            'created_by' => $admin->id,
            'estimated_hours' => 16,
            'spent_hours' => 14,
            'due_date' => now()->subDays(10)->toDateString(),
            'completed_at' => now()->subDays(8),
        ]);
        $task1->tags()->attach([$tags[2]->id]); // Klient

        $task2 = Task::create([
            'project_id' => $project->id,
            'title' => 'Projektowanie architektury systemu',
            'description' => 'Zaprojektowanie architektury technicznej i bazy danych.',
            'status' => 'in_progress',
            'priority' => 'high',
            'assigned_to' => $user1->id,
            'created_by' => $manager->id,
            'estimated_hours' => 24,
            'spent_hours' => 10,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
        $task2->tags()->attach([$tags[1]->id]); // Dokumentacja

        $task3 = Task::create([
            'project_id' => $project->id,
            'title' => 'Konfiguracja środowiska developerskiego',
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_to' => $user2->id,
            'created_by' => $manager->id,
            'estimated_hours' => 8,
            'due_date' => now()->addDays(3)->toDateString(),
        ]);

        $task4 = Task::create([
            'project_id' => $project->id,
            'title' => 'Integracja z systemem fakturowania',
            'description' => 'Połączenie CRM z istniejącym systemem fakturowania.',
            'status' => 'blocked',
            'priority' => 'urgent',
            'assigned_to' => $user1->id,
            'created_by' => $manager->id,
            'estimated_hours' => 40,
            'due_date' => now()->subDays(2)->toDateString(),
        ]);
        $task4->tags()->attach([$tags[0]->id, $tags[5]->id]); // Pilne, Blokada

        // Subtask
        Task::create([
            'project_id' => $project->id,
            'parent_task_id' => $task2->id,
            'title' => 'Schemat bazy danych — wersja 1',
            'status' => 'done',
            'priority' => 'high',
            'assigned_to' => $user1->id,
            'created_by' => $manager->id,
            'estimated_hours' => 8,
            'spent_hours' => 7,
            'due_date' => now()->subDays(5)->toDateString(),
            'completed_at' => now()->subDays(4),
        ]);
    }
}

<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskVisibilityController;
use Illuminate\Support\Facades\Route;

// Auth
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Projects
    Route::resource('projects', ProjectController::class);
    Route::post('projects/{project}/archive', [ProjectController::class, 'archive'])->name('projects.archive');

    // Tasks
    Route::resource('tasks', TaskController::class);
    Route::get('projects/{project}/kanban', [TaskController::class, 'kanban'])->name('projects.kanban');

    // Project members & contacts
    Route::post('projects/{project}/members', [ProjectMemberController::class, 'store'])->name('projects.members.store');
    Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])->name('projects.members.destroy');
    Route::post('projects/{project}/contacts', [ProjectMemberController::class, 'storeContact'])->name('projects.contacts.store');
    Route::delete('projects/{project}/contacts/{contact}', [ProjectMemberController::class, 'destroyContact'])->name('projects.contacts.destroy');

    // Task visibility
    Route::put('tasks/{task}/visibility', [TaskVisibilityController::class, 'update'])->name('tasks.visibility');

    // Comments
    Route::post('comments', [CommentController::class, 'store'])->name('comments.store');
    Route::put('comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

    // Attachments
    Route::post('attachments', [AttachmentController::class, 'store'])->name('attachments.store');
    Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download'])->name('attachments.download');
    Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');

    // Chat
    Route::get('chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('chat/direct/create', [ChatController::class, 'createDirectForm'])->name('chat.direct.create');
    Route::post('chat/direct', [ChatController::class, 'createDirect'])->name('chat.direct');
    Route::post('chat/project/{project}', [ChatController::class, 'createProjectRoom'])->name('chat.project');
    Route::get('chat/{room}', [ChatController::class, 'show'])->name('chat.show');
    Route::post('chat/{room}/messages', [ChatController::class, 'sendMessage'])->name('chat.send');
    Route::get('chat/{room}/messages', [ChatController::class, 'messages'])->name('chat.messages');

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Search
    Route::get('search', [SearchController::class, 'index'])->name('search');

    // Admin
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', AdminUserController::class);
        Route::post('users/{user}/toggle-active', [AdminUserController::class, 'toggleActive'])->name('users.toggle-active');
        Route::get('settings', fn () => inertia('Admin/Settings'))->name('settings');
    });
});

<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        $notifications = Notification::where('user_id', Auth::id())
            ->latest()
            ->paginate(20);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markRead(Notification $notification): \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if ($notification->user_id !== Auth::id()) abort(403);

        $notification->update(['is_read' => true]);

        if (request()->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return back();
    }

    public function markAllRead(): \Illuminate\Http\RedirectResponse
    {
        Notification::where('user_id', Auth::id())->update(['is_read' => true]);
        return back()->with('success', 'Wszystkie powiadomienia oznaczone jako przeczytane.');
    }
}

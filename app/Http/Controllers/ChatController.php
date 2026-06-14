<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\ChatRoom;
use App\Models\Notification;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(): Response
    {
        $rooms = ChatRoom::whereHas('members', fn ($q) => $q->where('user_id', Auth::id()))
            ->with(['members', 'lastMessage.user'])
            ->latest()
            ->get();

        return Inertia::render('Chat/Index', ['rooms' => $rooms]);
    }

    public function createDirectForm(): Response
    {
        $users = User::where('id', '!=', Auth::id())
            ->where('is_active', true)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('Chat/Create', ['users' => $users]);
    }

    public function show(ChatRoom $room): Response
    {
        if (!$room->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $messages = ChatMessage::where('chat_room_id', $room->id)
            ->with(['user', 'attachment'])
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return Inertia::render('Chat/Room', [
            'room' => $room->load('members'),
            'messages' => $messages,
        ]);
    }

    public function messages(ChatRoom $room): \Illuminate\Http\JsonResponse
    {
        if (!$room->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $after = request()->query('after_id', 0);

        $messages = ChatMessage::where('chat_room_id', $room->id)
            ->where('id', '>', $after)
            ->with(['user', 'attachment'])
            ->orderBy('id')
            ->limit(50)
            ->get();

        return response()->json($messages);
    }

    public function sendMessage(Request $request, ChatRoom $room): \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if (!$room->members()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $message = ChatMessage::create([
            'chat_room_id' => $room->id,
            'user_id' => Auth::id(),
            'message' => $data['message'],
        ]);

        // Notify other room members
        $room->members()
            ->where('users.id', '!=', Auth::id())
            ->each(function ($member) use ($room, $message) {
                Notification::send(
                    $member->id,
                    'chat_message',
                    'Nowa wiadomość',
                    Auth::user()->full_name . ': ' . mb_substr($message->message, 0, 80),
                    route('chat.show', $room)
                );
            });

        if ($request->wantsJson()) {
            return response()->json($message->load('user'));
        }

        return back();
    }

    public function createDirect(Request $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'exists:users,id', 'different:' . Auth::id()],
        ]);

        $otherUser = User::findOrFail($data['user_id']);
        $me = Auth::user();

        // Check for existing direct room between these two users
        $existingRoom = ChatRoom::where('type', 'direct')
            ->whereHas('members', fn ($q) => $q->where('user_id', $me->id))
            ->whereHas('members', fn ($q) => $q->where('user_id', $otherUser->id))
            ->first();

        if ($existingRoom) {
            return redirect()->route('chat.show', $existingRoom);
        }

        $room = ChatRoom::create([
            'type' => 'direct',
            'name' => "{$me->full_name} & {$otherUser->full_name}",
            'created_by' => $me->id,
        ]);

        $room->members()->attach([$me->id, $otherUser->id]);

        return redirect()->route('chat.show', $room);
    }

    public function createProjectRoom(Project $project): \Illuminate\Http\RedirectResponse
    {
        $this->authorize('view', $project);

        $existing = ChatRoom::where('type', 'project')
            ->where('project_id', $project->id)
            ->first();

        if ($existing) {
            return redirect()->route('chat.show', $existing);
        }

        $room = ChatRoom::create([
            'type' => 'project',
            'project_id' => $project->id,
            'name' => "Projekt: {$project->name}",
            'created_by' => Auth::id(),
        ]);

        $project->users->each(fn ($user) => $room->members()->attach($user->id));

        return redirect()->route('chat.show', $room);
    }
}

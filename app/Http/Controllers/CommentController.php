<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $data = $request->validate([
            'entity_type' => ['required', 'in:project,task,file'],
            'entity_id' => ['required', 'integer'],
            'content' => ['required', 'string', 'max:5000'],
        ]);

        if ($data['entity_type'] === 'task') {
            $task = Task::findOrFail($data['entity_id']);
            $this->authorize('comment', $task);
        }

        $comment = Comment::create([
            ...$data,
            'user_id' => Auth::id(),
        ]);

        // Parse @mentions and notify
        preg_match_all('/@(\w+)/', $data['content'], $matches);
        if (!empty($matches[1])) {
            $mentionedUsers = User::whereIn('first_name', $matches[1])
                ->where('id', '!=', Auth::id())
                ->get();

            foreach ($mentionedUsers as $mentionedUser) {
                Notification::send(
                    $mentionedUser->id,
                    'mention',
                    'Wzmianka w komentarzu',
                    Auth::user()->full_name . ' wspomniał/a o Tobie w komentarzu.',
                    null
                );
            }
        }

        ActivityLog::record('comment', $data['entity_type'], $data['entity_id']);

        return back()->with('success', 'Komentarz dodany.');
    }

    public function update(Request $request, Comment $comment): \Illuminate\Http\RedirectResponse
    {
        if ($comment->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            abort(403);
        }

        $data = $request->validate(['content' => ['required', 'string', 'max:5000']]);

        $comment->update($data);

        return back()->with('success', 'Komentarz zaktualizowany.');
    }

    public function destroy(Comment $comment): \Illuminate\Http\RedirectResponse
    {
        if ($comment->user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            abort(403);
        }

        $comment->delete();

        return back()->with('success', 'Komentarz usunięty.');
    }
}

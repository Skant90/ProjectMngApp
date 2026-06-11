<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): mixed
    {
        if (!Auth::check() || !Auth::user()->isAdmin()) {
            abort(403, 'Brak dostępu.');
        }

        return $next($request);
    }
}

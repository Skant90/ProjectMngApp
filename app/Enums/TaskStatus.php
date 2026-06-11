<?php

namespace App\Enums;

enum TaskStatus: string
{
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case Review = 'review';
    case Blocked = 'blocked';
    case Done = 'done';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::Todo => 'Do zrobienia',
            self::InProgress => 'W trakcie',
            self::Review => 'Do sprawdzenia',
            self::Blocked => 'Zablokowane',
            self::Done => 'Zakończone',
            self::Cancelled => 'Anulowane',
        };
    }
}

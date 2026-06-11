<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Active = 'active';
    case Paused = 'paused';
    case Completed = 'completed';
    case Archived = 'archived';

    public function label(): string
    {
        return match($this) {
            self::Active => 'Aktywny',
            self::Paused => 'Wstrzymany',
            self::Completed => 'Zakończony',
            self::Archived => 'Zarchiwizowany',
        };
    }
}

<?php

namespace App\Enums;

enum ProjectPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Critical = 'critical';

    public function label(): string
    {
        return match($this) {
            self::Low => 'Niski',
            self::Normal => 'Normalny',
            self::High => 'Wysoki',
            self::Critical => 'Krytyczny',
        };
    }
}

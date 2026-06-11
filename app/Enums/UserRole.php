<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case User = 'user';
    case Guest = 'guest';

    public function label(): string
    {
        return match($this) {
            self::Admin => 'Administrator',
            self::Manager => 'Kierownik',
            self::User => 'Użytkownik',
            self::Guest => 'Gość',
        };
    }

    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    public function isAtLeastManager(): bool
    {
        return in_array($this, [self::Admin, self::Manager]);
    }
}

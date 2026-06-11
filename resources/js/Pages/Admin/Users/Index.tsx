import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { PaginatedData, User, PageProps } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface Props {
    users: PaginatedData<User>;
    filters: {
        search: string;
        role: string;
    };
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    manager: 'Kierownik',
    user: 'Użytkownik',
    guest: 'Gość',
};

const ROLE_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'warning' | 'destructive'> = {
    admin: 'destructive',
    manager: 'warning',
    user: 'secondary',
    guest: 'outline' as any,
};

function Pagination({ data }: { data: PaginatedData<unknown> }) {
    if (data.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-sm text-gray-500">
                Pokazuje {data.from}–{data.to} z {data.total}
            </p>
            <div className="flex gap-1">
                {data.links.map((link, i) => (
                    <Button
                        key={i}
                        variant={link.active ? 'default' : 'outline'}
                        size="sm"
                        disabled={!link.url}
                        onClick={() => link.url && router.visit(link.url)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

export default function AdminUsersIndex({ users, filters }: Props) {
    const { flash } = usePage<PageProps>().props;

    function handleFilter(key: string, value: string) {
        router.get(route('admin.users.index'), { ...filters, [key]: value }, { preserveState: true });
    }

    function toggleActive(user: User) {
        router.patch(route('admin.users.toggle-active', user.id), {}, { preserveScroll: true });
    }

    function deleteUser(user: User) {
        if (confirm(`Czy na pewno chcesz usunąć użytkownika ${user.full_name}?`)) {
            router.delete(route('admin.users.destroy', user.id));
        }
    }

    return (
        <AppLayout title="Zarządzanie użytkownikami">
            <Head title="Użytkownicy" />
            <div className="p-6 space-y-5">
                {flash?.success && (
                    <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Użytkownicy ({users.total})
                    </h2>
                    <Button asChild>
                        <Link href={route('admin.users.create')}>
                            <Plus className="h-4 w-4" />
                            Nowy użytkownik
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Szukaj użytkowników..."
                            defaultValue={filters.search}
                            className="pl-8"
                            onChange={e => handleFilter('search', e.target.value)}
                        />
                    </div>
                    <Select
                        value={filters.role}
                        onChange={e => handleFilter('role', e.target.value)}
                        placeholder="Wszystkie role"
                        className="sm:w-44"
                    >
                        <option value="admin">Administrator</option>
                        <option value="manager">Kierownik</option>
                        <option value="user">Użytkownik</option>
                        <option value="guest">Gość</option>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Użytkownik</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Email</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Rola</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Ostatnie logowanie</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {users.data.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                                Brak użytkowników spełniających kryteria.
                                            </td>
                                        </tr>
                                    )}
                                    {users.data.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                                        {user.first_name[0]}{user.last_name[0]}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">{user.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={ROLE_BADGE_VARIANTS[user.role] ?? 'secondary'}>
                                                    {ROLE_LABELS[user.role] ?? user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleActive(user)}
                                                    className={cn(
                                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                                                        user.is_active
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                                    )}
                                                >
                                                    {user.is_active ? 'Aktywny' : 'Nieaktywny'}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                                                {formatDate(user.last_login_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={route('admin.users.edit', user.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteUser(user)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {users.data.length > 0 && (
                            <div className="px-4 py-3">
                                <Pagination data={users} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

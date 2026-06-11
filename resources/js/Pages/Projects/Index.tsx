import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Card, CardContent } from '@/Components/ui/card';
import {
    cn,
    formatDate,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_COLORS,
    PROJECT_PRIORITY_LABELS,
} from '@/lib/utils';
import { PageProps, PaginatedData, Project } from '@/types';
import { Plus, Eye, Pencil, Search } from 'lucide-react';

interface Props {
    projects: PaginatedData<Project>;
    filters: { status?: string; priority?: string; search?: string };
}

export default function ProjectsIndex({ projects, filters }: Props) {
    const { auth, flash } = usePage<PageProps>().props;
    const canManage = auth.user.role === 'admin' || auth.user.role === 'manager';

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route('projects.index'),
                { search, status, priority },
                { preserveState: true, replace: true },
            );
        }, 400);
        return () => clearTimeout(timer);
    }, [search, status, priority]);

    return (
        <AppLayout title="Projekty">
            <Head title="Projekty" />
            <div className="p-6 space-y-4">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {flash.error}
                    </div>
                )}

                {/* Page header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Projekty
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({projects.total})
                        </span>
                    </h1>
                    {canManage && (
                        <Link href={route('projects.create')}>
                            <Button size="sm">
                                <Plus className="h-4 w-4" />
                                Nowy projekt
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filter bar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                <Input
                                    className="pl-8"
                                    placeholder="Szukaj projektów..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <Select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="sm:w-44"
                                placeholder="Wszystkie statusy"
                            >
                                <option value="active">Aktywny</option>
                                <option value="paused">Wstrzymany</option>
                                <option value="completed">Zakończony</option>
                                <option value="archived">Zarchiwizowany</option>
                            </Select>
                            <Select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="sm:w-44"
                                placeholder="Wszystkie priorytety"
                            >
                                <option value="low">Niski</option>
                                <option value="normal">Normalny</option>
                                <option value="high">Wysoki</option>
                                <option value="critical">Krytyczny</option>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                        Projekt
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                        Priorytet
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                        Twórca
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                                        Zadania
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-36 hidden lg:table-cell">
                                        Postęp
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                                        Termin
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                                        Akcje
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {projects.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
                                        >
                                            Brak projektów spełniających kryteria wyszukiwania.
                                        </td>
                                    </tr>
                                ) : (
                                    projects.data.map(project => {
                                        const progress = project.progress ?? 0;
                                        return (
                                            <tr
                                                key={project.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                {/* Name */}
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={route('projects.show', project.id)}
                                                        className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                                                    >
                                                        {project.name}
                                                    </Link>
                                                    {project.description && (
                                                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1 max-w-xs">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                            PROJECT_STATUS_COLORS[project.status],
                                                        )}
                                                    >
                                                        {PROJECT_STATUS_LABELS[project.status]}
                                                    </span>
                                                </td>

                                                {/* Priority */}
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {PROJECT_PRIORITY_LABELS[project.priority]}
                                                </td>

                                                {/* Creator */}
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                                    {project.creator?.full_name ?? '—'}
                                                </td>

                                                {/* Task count */}
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                                                    <span title="Ukończone / wszystkie">
                                                        {project.completed_tasks_count ?? 0}
                                                        <span className="text-gray-300 dark:text-gray-600">
                                                            {' '}
                                                            /{' '}
                                                        </span>
                                                        {project.tasks_count ?? 0}
                                                    </span>
                                                </td>

                                                {/* Progress bar */}
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                                                            style={{ height: 6 }}
                                                        >
                                                            <div
                                                                className="h-full rounded-full bg-brand-500 transition-all"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="w-9 text-right text-xs tabular-nums text-gray-500">
                                                            {progress}%
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Deadline */}
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                                                    {formatDate(project.end_date)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={route('projects.show', project.id)}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Podgląd projektu"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        {canManage && (
                                                            <Link href={route('projects.edit', project.id)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    title="Edytuj projekt"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {projects.last_page > 1 && (
                        <div className="flex flex-col gap-2 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Pokazano{' '}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {projects.from}–{projects.to}
                                </span>{' '}
                                z{' '}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {projects.total}
                                </span>{' '}
                                projektów
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {projects.links.map((link, i) => {
                                    if (!link.url && link.label === '...') {
                                        return (
                                            <span
                                                key={i}
                                                className="inline-flex h-8 min-w-[2rem] items-center justify-center px-1 text-sm text-gray-400"
                                            >
                                                &hellip;
                                            </span>
                                        );
                                    }
                                    return link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={cn(
                                                'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm transition-colors',
                                                link.active
                                                    ? 'bg-brand-600 text-white pointer-events-none'
                                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
                                            )}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="inline-flex h-8 min-w-[2rem] cursor-not-allowed items-center justify-center rounded-md border border-gray-200 px-2 text-sm text-gray-400 dark:border-gray-700"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

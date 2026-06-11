import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import {
    cn,
    formatDate,
    isOverdue,
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    TASK_PRIORITY_LABELS,
    TASK_PRIORITY_COLORS,
} from '@/lib/utils';
import { Task, Project, Tag, PaginatedData, PageProps, TaskStatus, TaskPriority } from '@/types';

interface Props {
    tasks: PaginatedData<Task>;
    projects: Project[];
    tags: Tag[];
    filters: {
        search?: string;
        project_id?: string;
        status?: string;
        priority?: string;
        assigned_to?: string;
        overdue?: string;
        my_tasks?: string;
    };
}

export default function TasksIndex({ tasks, projects, tags, filters }: Props) {
    const { flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [projectId, setProjectId] = useState(filters.project_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const [overdue, setOverdue] = useState(filters.overdue === '1');
    const [myTasks, setMyTasks] = useState(filters.my_tasks === '1');

    const applyFilters = (overrides: Record<string, string | undefined> = {}) => {
        const params: Record<string, string | undefined> = {
            search: search || undefined,
            project_id: projectId || undefined,
            status: status || undefined,
            priority: priority || undefined,
            overdue: overdue ? '1' : undefined,
            my_tasks: myTasks ? '1' : undefined,
            ...overrides,
        };

        router.get(route('tasks.index'), params as Record<string, string>, {
            preserveState: true,
            replace: true,
        });
    };

    useEffect(() => {
        const timeout = setTimeout(() => applyFilters(), 400);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleSelectChange = (setter: (v: string) => void, value: string) => {
        setter(value);
        applyFilters({ [setter === setProjectId ? 'project_id' : setter === setStatus ? 'status' : 'priority']: value || undefined });
    };

    const handleOverdueChange = (checked: boolean) => {
        setOverdue(checked);
        applyFilters({ overdue: checked ? '1' : undefined });
    };

    const handleMyTasksChange = (checked: boolean) => {
        setMyTasks(checked);
        applyFilters({ my_tasks: checked ? '1' : undefined });
    };

    const PRIORITY_DOT_COLORS: Record<TaskPriority, string> = {
        low: 'bg-gray-400',
        medium: 'bg-blue-500',
        high: 'bg-orange-500',
        urgent: 'bg-red-500',
    };

    return (
        <AppLayout title="Zadania">
            <Head title="Zadania" />

            <div className="space-y-5">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Zadania</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Łącznie: {tasks.total} {tasks.total === 1 ? 'zadanie' : 'zadań'}
                        </p>
                    </div>
                    <Link href={route('tasks.create')}>
                        <Button>
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Nowe zadanie
                        </Button>
                    </Link>
                </div>

                {/* Filter bar */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[200px] flex-1">
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Szukaj
                            </label>
                            <Input
                                type="text"
                                placeholder="Tytuł zadania..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="min-w-[160px]">
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Projekt
                            </label>
                            <Select
                                value={projectId}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setProjectId(v);
                                    applyFilters({ project_id: v || undefined });
                                }}
                                placeholder="Wszystkie projekty"
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="min-w-[150px]">
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Status
                            </label>
                            <Select
                                value={status}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setStatus(v);
                                    applyFilters({ status: v || undefined });
                                }}
                                placeholder="Wszystkie statusy"
                            >
                                {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="min-w-[150px]">
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Priorytet
                            </label>
                            <Select
                                value={priority}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setPriority(v);
                                    applyFilters({ priority: v || undefined });
                                }}
                                placeholder="Wszystkie priorytety"
                            >
                                {(Object.entries(TASK_PRIORITY_LABELS) as [TaskPriority, string][]).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="flex items-center gap-4 pb-1">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={overdue}
                                    onChange={(e) => handleOverdueChange(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                Przeterminowane
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={myTasks}
                                    onChange={(e) => handleMyTasksChange(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                Moje zadania
                            </label>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Tytuł
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Projekt
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Priorytet
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Osoba
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Termin
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Akcje
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {tasks.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Brak zadań spełniających kryteria filtrowania.
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.data.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                        >
                                            <td className="max-w-xs px-4 py-3">
                                                <Link
                                                    href={route('tasks.show', task.id)}
                                                    className="font-medium text-gray-900 hover:text-brand-600 dark:text-gray-100 dark:hover:text-brand-400"
                                                >
                                                    {task.title}
                                                </Link>
                                                {task.parent_task_id && (
                                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                                        Podzadanie
                                                    </p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {task.project ? (
                                                    <Link
                                                        href={route('projects.show', task.project_id)}
                                                        className="hover:text-brand-600 dark:hover:text-brand-400"
                                                    >
                                                        {task.project.name}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                        TASK_STATUS_COLORS[task.status]
                                                    )}
                                                >
                                                    {TASK_STATUS_LABELS[task.status]}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span
                                                    className={cn(
                                                        'flex items-center gap-1.5 text-sm font-medium',
                                                        TASK_PRIORITY_COLORS[task.priority]
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'inline-block h-2 w-2 flex-shrink-0 rounded-full',
                                                            PRIORITY_DOT_COLORS[task.priority]
                                                        )}
                                                    />
                                                    {TASK_PRIORITY_LABELS[task.priority]}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {task.assignee ? task.assignee.full_name : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                {task.due_date ? (
                                                    <span
                                                        className={cn(
                                                            isOverdue(task.due_date) && task.status !== 'done' && task.status !== 'cancelled'
                                                                ? 'font-medium text-red-600 dark:text-red-400'
                                                                : 'text-gray-600 dark:text-gray-400'
                                                        )}
                                                    >
                                                        {formatDate(task.due_date)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('tasks.show', task.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            Szczegóły
                                                        </Button>
                                                    </Link>
                                                    <Link href={route('tasks.edit', task.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            Edytuj
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tasks.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Wyświetlanie {tasks.from}–{tasks.to} z {tasks.total} wyników
                            </p>
                            <div className="flex items-center gap-1">
                                {tasks.links.map((link, i) => {
                                    if (!link.url && !link.active) {
                                        return (
                                            <span
                                                key={i}
                                                className="px-2 py-1 text-sm text-gray-400 dark:text-gray-500"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                            disabled={!link.url || link.active}
                                            className={cn(
                                                'rounded px-3 py-1 text-sm transition-colors',
                                                link.active
                                                    ? 'bg-brand-600 font-semibold text-white'
                                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
                                                !link.url && 'cursor-not-allowed opacity-40'
                                            )}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

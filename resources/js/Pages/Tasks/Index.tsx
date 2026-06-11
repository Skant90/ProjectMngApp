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
    TASK_PRIORITY_DOT_COLORS,
    PROJECT_STATUS_LABELS,
} from '@/lib/utils';
import { PaginatedData, Task, Project, Tag, PageProps } from '@/types';
import { useState, useCallback } from 'react';

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
    const { auth, flash } = usePage<PageProps>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [projectId, setProjectId] = useState(filters.project_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const [overdue, setOverdue] = useState(filters.overdue === '1');
    const [myTasks, setMyTasks] = useState(filters.my_tasks === '1');

    const applyFilters = useCallback(
        (overrides: Record<string, string | undefined> = {}) => {
            router.get(
                route('tasks.index'),
                {
                    search: search || undefined,
                    project_id: projectId || undefined,
                    status: status || undefined,
                    priority: priority || undefined,
                    overdue: overdue ? '1' : undefined,
                    my_tasks: myTasks ? '1' : undefined,
                    ...overrides,
                },
                { preserveState: true, replace: true },
            );
        },
        [search, projectId, status, priority, overdue, myTasks],
    );

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') applyFilters({ search: search || undefined });
    };

    const handleProjectChange = (value: string) => {
        setProjectId(value);
        applyFilters({ project_id: value || undefined });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        applyFilters({ status: value || undefined });
    };

    const handlePriorityChange = (value: string) => {
        setPriority(value);
        applyFilters({ priority: value || undefined });
    };

    const handleOverdueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setOverdue(checked);
        applyFilters({ overdue: checked ? '1' : undefined });
    };

    const handleMyTasksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setMyTasks(checked);
        applyFilters({ my_tasks: checked ? '1' : undefined });
    };

    return (
        <AppLayout title="Zadania">
            <Head title="Zadania" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {flash?.success && (
                    <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Zadania</h1>
                    <Link href={route('tasks.create')}>
                        <Button>+ Nowe zadanie</Button>
                    </Link>
                </div>

                {/* Filter bar */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
                    <Input
                        placeholder="Szukaj zadań…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onBlur={() => applyFilters({ search: search || undefined })}
                        className="w-52"
                    />

                    <Select
                        value={projectId}
                        onChange={handleProjectChange}
                        placeholder="Wszystkie projekty"
                        className="w-48"
                    >
                        <option value="">Wszystkie projekty</option>
                        {projects.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                                {p.name}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={status}
                        onChange={handleStatusChange}
                        placeholder="Dowolny status"
                        className="w-44"
                    >
                        <option value="">Dowolny status</option>
                        {Object.entries(TASK_STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>
                                {label}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={priority}
                        onChange={handlePriorityChange}
                        placeholder="Dowolny priorytet"
                        className="w-44"
                    >
                        <option value="">Dowolny priorytet</option>
                        {Object.entries(TASK_PRIORITY_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>
                                {label}
                            </option>
                        ))}
                    </Select>

                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={overdue}
                            onChange={handleOverdueChange}
                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        Przeterminowane
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={myTasks}
                            onChange={handleMyTasksChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Moje zadania
                    </label>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tytuł
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Projekt
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Priorytet
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Osoba
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Termin
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Akcje
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {tasks.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            Brak zadań spełniających kryteria.
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.data.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 max-w-xs">
                                                <Link
                                                    href={route('tasks.show', task.id)}
                                                    className="font-medium text-blue-700 hover:text-blue-900 hover:underline line-clamp-2"
                                                >
                                                    {task.title}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {task.project ? (
                                                    <Link
                                                        href={route('projects.show', task.project_id)}
                                                        className="hover:underline text-gray-700"
                                                    >
                                                        {task.project.name}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-xs font-medium',
                                                        TASK_STATUS_COLORS[task.status],
                                                    )}
                                                >
                                                    {TASK_STATUS_LABELS[task.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'flex items-center gap-1.5 text-sm font-medium',
                                                        TASK_PRIORITY_COLORS[task.priority],
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'inline-block h-2 w-2 rounded-full',
                                                            TASK_PRIORITY_DOT_COLORS[task.priority],
                                                        )}
                                                    />
                                                    {TASK_PRIORITY_LABELS[task.priority]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                                {task.assignee
                                                    ? task.assignee.full_name
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {task.due_date ? (
                                                    <span
                                                        className={cn(
                                                            isOverdue(task.due_date) && task.status !== 'done' && task.status !== 'cancelled'
                                                                ? 'text-red-600 font-semibold'
                                                                : 'text-gray-700',
                                                        )}
                                                    >
                                                        {formatDate(task.due_date)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <Link href={route('tasks.show', task.id)}>
                                                    <Button variant="ghost" size="sm">
                                                        Szczegóły
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tasks.last_page > 1 && (
                        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Wyniki {tasks.from}–{tasks.to} z {tasks.total}
                            </p>
                            <div className="flex items-center gap-1">
                                {tasks.links.map((link, i) => {
                                    if (link.label === '&laquo; Previous')
                                        return (
                                            <Link
                                                key={i}
                                                href={link.url ?? '#'}
                                                preserveState
                                                className={cn(
                                                    'px-3 py-1.5 rounded text-sm border',
                                                    !link.url
                                                        ? 'pointer-events-none opacity-40 bg-white border-gray-200 text-gray-400'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100',
                                                )}
                                            >
                                                ‹ Poprzednia
                                            </Link>
                                        );
                                    if (link.label === 'Next &raquo;')
                                        return (
                                            <Link
                                                key={i}
                                                href={link.url ?? '#'}
                                                preserveState
                                                className={cn(
                                                    'px-3 py-1.5 rounded text-sm border',
                                                    !link.url
                                                        ? 'pointer-events-none opacity-40 bg-white border-gray-200 text-gray-400'
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100',
                                                )}
                                            >
                                                Następna ›
                                            </Link>
                                        );
                                    return (
                                        <Link
                                            key={i}
                                            href={link.url ?? '#'}
                                            preserveState
                                            className={cn(
                                                'px-3 py-1.5 rounded text-sm border',
                                                link.active
                                                    ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100',
                                                !link.url && 'pointer-events-none opacity-40',
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

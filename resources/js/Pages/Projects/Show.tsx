import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    cn,
    formatDate,
    formatDateTime,
    isOverdue,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_COLORS,
    PROJECT_PRIORITY_LABELS,
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    TASK_PRIORITY_LABELS,
    TASK_PRIORITY_COLORS,
} from '@/lib/utils';
import {
    PageProps,
    Project,
    ProjectMember,
    ProjectContact,
    Task,
    ActivityLog,
} from '@/types';
import {
    ArrowLeft,
    Pencil,
    Users,
    CheckSquare,
    Phone,
    Mail,
    Building2,
    Activity,
    AlertCircle,
    Calendar,
} from 'lucide-react';

interface Props {
    project: Project & {
        members?: ProjectMember[];
        contacts?: ProjectContact[];
        tasks?: Task[];
        tasks_count?: number;
        completed_tasks_count?: number;
        overdue_tasks_count?: number;
        activity_log?: ActivityLog[];
    };
}

type Tab = 'overview' | 'tasks' | 'members' | 'contacts' | 'activity';

const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Przegląd' },
    { id: 'tasks', label: 'Zadania' },
    { id: 'members', label: 'Członkowie' },
    { id: 'contacts', label: 'Kontakty' },
    { id: 'activity', label: 'Aktywność' },
];

const MEMBER_ROLE_LABELS: Record<string, string> = {
    manager: 'Kierownik',
    member: 'Członek',
    guest: 'Gość',
};

const MEMBER_ROLE_COLORS: Record<string, string> = {
    manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    member: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    guest: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function TabButton({
    tab,
    activeTab,
    count,
    onClick,
}: {
    tab: Tab;
    activeTab: Tab;
    count?: number;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none',
                activeTab === tab
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
            )}
        >
            {TABS.find(t => t.id === tab)?.label}
            {count !== undefined && count > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {count}
                </span>
            )}
        </button>
    );
}

export default function ProjectShow({ project }: Props) {
    const { auth, flash } = usePage<PageProps>().props;
    const canManage = auth.user.role === 'admin' || auth.user.role === 'manager';
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const progress = project.progress ?? 0;
    const tasksCount = project.tasks_count ?? 0;
    const completedCount = project.completed_tasks_count ?? 0;
    const overdueCount = project.overdue_tasks_count ?? 0;
    const members = project.members ?? [];
    const contacts = project.contacts ?? [];
    const tasks = project.tasks ?? [];
    const activityLog = project.activity_log ?? [];

    return (
        <AppLayout title={project.name}>
            <Head title={project.name} />
            <div className="p-6 space-y-5">
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

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('projects.index')}>
                            <Button variant="ghost" size="sm" title="Wróć do listy projektów">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {project.name}
                            </h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                        PROJECT_STATUS_COLORS[project.status],
                                    )}
                                >
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Priorytet: {PROJECT_PRIORITY_LABELS[project.priority]}
                                </span>
                            </div>
                        </div>
                    </div>
                    {canManage && (
                        <Link href={route('projects.edit', project.id)}>
                            <Button size="sm" variant="outline">
                                <Pencil className="h-4 w-4" />
                                Edytuj projekt
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Tab navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex gap-0 overflow-x-auto" aria-label="Zakładki projektu">
                        <TabButton tab="overview" activeTab={activeTab} onClick={() => setActiveTab('overview')} />
                        <TabButton tab="tasks" activeTab={activeTab} count={tasksCount} onClick={() => setActiveTab('tasks')} />
                        <TabButton tab="members" activeTab={activeTab} count={members.length} onClick={() => setActiveTab('members')} />
                        <TabButton tab="contacts" activeTab={activeTab} count={contacts.length} onClick={() => setActiveTab('contacts')} />
                        <TabButton tab="activity" activeTab={activeTab} onClick={() => setActiveTab('activity')} />
                    </nav>
                </div>

                {/* ── Tab: Przegląd ── */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        {/* Description */}
                        {project.description && (
                            <Card>
                                <CardContent className="p-4">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Opis projektu
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {project.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Status
                                    </p>
                                    <div className="mt-2">
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                PROJECT_STATUS_COLORS[project.status],
                                            )}
                                        >
                                            {PROJECT_STATUS_LABELS[project.status]}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Priorytet
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                                        {PROJECT_PRIORITY_LABELS[project.priority]}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Data rozpoczęcia
                                    </p>
                                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatDate(project.start_date)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Termin zakończenia
                                    </p>
                                    <p
                                        className={cn(
                                            'mt-2 text-sm font-semibold',
                                            isOverdue(project.end_date) &&
                                                project.status !== 'completed' &&
                                                project.status !== 'archived'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-gray-900 dark:text-white',
                                        )}
                                    >
                                        {formatDate(project.end_date)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Progress card */}
                        <Card>
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Ogólny postęp
                                    </p>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                                        {progress}%
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-3 divide-x divide-gray-100 pt-1 dark:divide-gray-700">
                                    <div className="pr-4 text-center">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                                            {tasksCount}
                                        </p>
                                        <p className="text-xs text-gray-500">Wszystkie zadania</p>
                                    </div>
                                    <div className="px-4 text-center">
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                                            {completedCount}
                                        </p>
                                        <p className="text-xs text-gray-500">Ukończone</p>
                                    </div>
                                    <div className="pl-4 text-center">
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                                            {overdueCount}
                                        </p>
                                        <p className="text-xs text-gray-500">Przeterminowane</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card>
                            <CardContent className="p-4">
                                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                    <div>
                                        <dt className="font-medium text-gray-500 dark:text-gray-400">Twórca</dt>
                                        <dd className="mt-0.5 text-gray-900 dark:text-white">
                                            {project.creator?.full_name ?? '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-gray-500 dark:text-gray-400">
                                            Liczba członków
                                        </dt>
                                        <dd className="mt-0.5 text-gray-900 dark:text-white">
                                            {members.length}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-gray-500 dark:text-gray-400">
                                            Data utworzenia
                                        </dt>
                                        <dd className="mt-0.5 text-gray-900 dark:text-white">
                                            {formatDateTime(project.created_at)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="font-medium text-gray-500 dark:text-gray-400">
                                            Ostatnia aktualizacja
                                        </dt>
                                        <dd className="mt-0.5 text-gray-900 dark:text-white">
                                            {formatDateTime(project.updated_at)}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Tab: Zadania ── */}
                {activeTab === 'tasks' && (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Zadanie
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Priorytet
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                            Przypisane do
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                                            Termin
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {tasks.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
                                            >
                                                Brak zadań w tym projekcie.
                                            </td>
                                        </tr>
                                    ) : (
                                        tasks.map(task => (
                                            <tr
                                                key={task.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                {/* Title */}
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={route('tasks.show', task.id)}
                                                        className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                                                    >
                                                        {task.title}
                                                    </Link>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                            TASK_STATUS_COLORS[task.status],
                                                        )}
                                                    >
                                                        {TASK_STATUS_LABELS[task.status]}
                                                    </span>
                                                </td>

                                                {/* Priority */}
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={cn(
                                                            'text-xs font-medium',
                                                            TASK_PRIORITY_COLORS[task.priority],
                                                        )}
                                                    >
                                                        {TASK_PRIORITY_LABELS[task.priority]}
                                                    </span>
                                                </td>

                                                {/* Assignee */}
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                                    {task.assignee?.full_name ?? (
                                                        <span className="text-gray-300 dark:text-gray-600 italic">
                                                            Nieprzypisane
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Due date */}
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    {task.due_date ? (
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 text-sm',
                                                                isOverdue(task.due_date) &&
                                                                    task.status !== 'done' &&
                                                                    task.status !== 'cancelled'
                                                                    ? 'font-medium text-red-600 dark:text-red-400'
                                                                    : 'text-gray-500 dark:text-gray-400',
                                                            )}
                                                        >
                                                            {isOverdue(task.due_date) &&
                                                                task.status !== 'done' &&
                                                                task.status !== 'cancelled' && (
                                                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                                )}
                                                            {formatDate(task.due_date)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* ── Tab: Członkowie ── */}
                {activeTab === 'members' && (
                    <Card>
                        {members.length === 0 ? (
                            <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                                <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                <p className="text-sm">Brak członków przypisanych do tego projektu.</p>
                            </CardContent>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                                Użytkownik
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                                                Rola w projekcie
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                                Adres e-mail
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {members.map(member => (
                                            <tr
                                                key={member.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                                            {member.user?.first_name?.[0]}
                                                            {member.user?.last_name?.[0]}
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {member.user?.full_name ?? '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        className={cn(
                                                            'rounded-full text-xs font-semibold',
                                                            MEMBER_ROLE_COLORS[member.project_role] ??
                                                                'bg-gray-100 text-gray-600',
                                                        )}
                                                    >
                                                        {MEMBER_ROLE_LABELS[member.project_role] ??
                                                            member.project_role}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                                    {member.user?.email ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                )}

                {/* ── Tab: Kontakty ── */}
                {activeTab === 'contacts' && (
                    <Card>
                        {contacts.length === 0 ? (
                            <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                                <Phone className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                <p className="text-sm">Brak kontaktów przypisanych do tego projektu.</p>
                            </CardContent>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {contacts.map((contact: ProjectContact) => (
                                    <li key={contact.id} className="px-4 py-4">
                                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {contact.first_name} {contact.last_name}
                                                </p>
                                                {contact.position && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {contact.position}
                                                    </p>
                                                )}
                                            </div>
                                            {contact.company && (
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                    {contact.company}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                            {contact.email && (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
                                                >
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {contact.email}
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a
                                                    href={`tel:${contact.phone}`}
                                                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {contact.phone}
                                                </a>
                                            )}
                                        </div>
                                        {contact.notes && (
                                            <p className="mt-1.5 text-xs italic text-gray-400 dark:text-gray-500">
                                                {contact.notes}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                )}

                {/* ── Tab: Aktywność ── */}
                {activeTab === 'activity' && (
                    <Card>
                        {activityLog.length === 0 ? (
                            <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                                <Activity className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                <p className="text-sm">Brak zapisanej aktywności dla tego projektu.</p>
                            </CardContent>
                        ) : (
                            <CardContent className="p-4">
                                <ol className="space-y-5">
                                    {activityLog.map((log: ActivityLog) => (
                                        <li key={log.id} className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold dark:bg-gray-700 dark:text-gray-300">
                                                {log.user?.first_name?.[0]}
                                                {log.user?.last_name?.[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {log.user?.full_name ?? 'System'}
                                                    </span>
                                                    {' — '}
                                                    {log.action}
                                                </p>
                                                {(log.old_value || log.new_value) && (
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {log.old_value && (
                                                            <span className="line-through mr-1">{log.old_value}</span>
                                                        )}
                                                        {log.new_value && (
                                                            <span className="text-gray-600 dark:text-gray-300">
                                                                {log.new_value}
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDateTime(log.created_at)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        )}
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

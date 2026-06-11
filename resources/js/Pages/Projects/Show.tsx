import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar, Users, CheckSquare, AlertTriangle, BarChart2,
    Pencil, ArrowLeft, Clock, Mail, Phone, Building2,
} from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Project, PageProps } from '@/types';
import {
    cn,
    formatDate,
    formatDateTime,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_COLORS,
    PROJECT_PRIORITY_LABELS,
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    TASK_PRIORITY_COLORS,
    isOverdue,
} from '@/lib/utils';

interface Props {
    project: Project & {
        members?: import('@/types').ProjectMember[];
        contacts?: import('@/types').ProjectContact[];
        tasks?: import('@/types').Task[];
        tasks_count?: number;
        completed_tasks_count?: number;
        overdue_tasks_count?: number;
        activity_log?: import('@/types').ActivityLog[];
    };
}

type Tab = 'overview' | 'tasks' | 'members' | 'contacts' | 'activity';

const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Przegląd' },
    { key: 'tasks', label: 'Zadania' },
    { key: 'members', label: 'Członkowie' },
    { key: 'contacts', label: 'Kontakty' },
    { key: 'activity', label: 'Aktywność' },
];

const MEMBER_ROLE_LABELS: Record<string, string> = {
    manager: 'Kierownik',
    member: 'Członek',
    guest: 'Gość',
};

export default function ProjectShow({ project }: Props) {
    const { auth, flash } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const canEdit = auth.user.role === 'admin' || auth.user.role === 'manager';
    const progress = project.progress ?? 0;

    return (
        <AppLayout title={project.name}>
            <Head title={project.name} />
            <div className="p-6 space-y-5">
                {flash?.success && (
                    <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('projects.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
                                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', PROJECT_STATUS_COLORS[project.status])}>
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </div>
                            {project.description && (
                                <p className="mt-0.5 text-sm text-gray-500">{project.description}</p>
                            )}
                        </div>
                    </div>
                    {canEdit && (
                        <Button asChild>
                            <Link href={route('projects.edit', project.id)}>
                                <Pencil className="h-4 w-4" />
                                Edytuj
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex gap-1 -mb-px">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                                    activeTab === tab.key
                                        ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Overview */}
                {activeTab === 'overview' && (
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="space-y-5">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informacje</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Status</span>
                                        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', PROJECT_STATUS_COLORS[project.status])}>
                                            {PROJECT_STATUS_LABELS[project.status]}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Priorytet</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{PROJECT_PRIORITY_LABELS[project.priority]}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Data rozpoczęcia</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(project.start_date)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Data zakończenia</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(project.end_date)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Twórca</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{project.creator?.full_name ?? '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Liczba członków</span>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{project.members?.length ?? 0}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Postęp projektu</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Ukończono</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{progress}%</span>
                                    </div>
                                    <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-3 rounded-full bg-brand-500 transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 pt-2">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{project.tasks_count ?? 0}</p>
                                            <p className="text-xs text-gray-500">Wszystkie</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-green-600">{project.completed_tasks_count ?? 0}</p>
                                            <p className="text-xs text-gray-500">Ukończone</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-red-600">{(project as any).overdue_tasks_count ?? 0}</p>
                                            <p className="text-xs text-gray-500">Po terminie</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Zadania kanban</CardTitle>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={route('projects.kanban', project.id)}>
                                            Kanban
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {(project.tasks ?? []).length === 0 ? (
                                    <p className="text-sm text-gray-400">Brak zadań w projekcie.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {(project.tasks ?? []).slice(0, 8).map(task => (
                                            <Link
                                                key={task.id}
                                                href={route('tasks.show', task.id)}
                                                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={cn('inline-block h-2 w-2 rounded-full shrink-0', {
                                                        'bg-red-500': task.priority === 'urgent',
                                                        'bg-orange-500': task.priority === 'high',
                                                        'bg-blue-500': task.priority === 'medium',
                                                        'bg-gray-400': task.priority === 'low',
                                                    })} />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.title}</span>
                                                </div>
                                                <span className={cn('text-xs rounded-full px-2 py-0.5 ml-2 shrink-0', TASK_STATUS_COLORS[task.status])}>
                                                    {TASK_STATUS_LABELS[task.status]}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tasks */}
                {activeTab === 'tasks' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Zadania ({project.tasks?.length ?? 0})</CardTitle>
                                <Button asChild>
                                    <Link href={route('tasks.create', { project_id: project.id })}>
                                        Dodaj zadanie
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Tytuł</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Przypisany</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Termin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {(project.tasks ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                                Brak zadań w tym projekcie.
                                            </td>
                                        </tr>
                                    )}
                                    {(project.tasks ?? []).map(task => (
                                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3">
                                                <Link href={route('tasks.show', task.id)} className="text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
                                                    {task.title}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', TASK_STATUS_COLORS[task.status])}>
                                                    {TASK_STATUS_LABELS[task.status]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                                                {task.assignee?.full_name ?? '—'}
                                            </td>
                                            <td className={cn('px-4 py-3 hidden md:table-cell', isOverdue(task.due_date) ? 'text-red-500 font-medium' : 'text-gray-500')}>
                                                {formatDate(task.due_date)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* Members */}
                {activeTab === 'members' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Członkowie ({project.members?.length ?? 0})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Użytkownik</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Rola</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {(project.members ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                                                Brak członków projektu.
                                            </td>
                                        </tr>
                                    )}
                                    {(project.members ?? []).map(member => (
                                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                                        {member.user?.first_name?.[0]}{member.user?.last_name?.[0]}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {member.user?.full_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">
                                                    {MEMBER_ROLE_LABELS[member.project_role] ?? member.project_role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                                                {member.user?.email}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* Contacts */}
                {activeTab === 'contacts' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Kontakty ({(project as any).contacts?.length ?? 0})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Imię i nazwisko</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Firma</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Email</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Telefon</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {((project as any).contacts ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                                Brak kontaktów w projekcie.
                                            </td>
                                        </tr>
                                    )}
                                    {((project as any).contacts ?? []).map((contact: import('@/types').ProjectContact) => (
                                        <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {contact.first_name} {contact.last_name}
                                                {contact.position && <span className="ml-1 text-xs text-gray-400">({contact.position})</span>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{contact.company ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{contact.email ?? '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{contact.phone ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* Activity */}
                {activeTab === 'activity' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Dziennik aktywności</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {((project as any).activity_log ?? []).length === 0 ? (
                                <p className="text-sm text-gray-400">Brak zapisanej aktywności.</p>
                            ) : (
                                <div className="space-y-4">
                                    {((project as any).activity_log ?? []).map((log: import('@/types').ActivityLog) => (
                                        <div key={log.id} className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium dark:bg-gray-700">
                                                {log.user?.first_name?.[0]}{log.user?.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium">{log.user?.full_name}</span>
                                                    {' — '}{log.action}
                                                </p>
                                                <p className="text-xs text-gray-400">{formatDateTime(log.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

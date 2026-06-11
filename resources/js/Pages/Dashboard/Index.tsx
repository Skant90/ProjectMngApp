import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Calendar, CheckSquare, Clock, FolderKanban, TrendingUp } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Task, Project, ActivityLog } from '@/types';
import {
    TASK_STATUS_COLORS, TASK_STATUS_LABELS, TASK_PRIORITY_COLORS,
    formatDate, isOverdue,
} from '@/lib/utils';

interface DashboardProps {
    overdue_tasks: Task[];
    today_tasks: Task[];
    upcoming_tasks: Task[];
    projects: Project[];
    recent_activity: ActivityLog[];
    stats: {
        total_projects?: number;
        active_projects?: number;
        total_tasks?: number;
        overdue_tasks?: number;
    };
}

function TaskRow({ task }: { task: Task }) {
    return (
        <Link
            href={route('tasks.show', task.id)}
            className="flex items-center justify-between py-2.5 px-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded -mx-1 px-1 group"
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' :
                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-600">
                    {task.title}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
                {task.project && (
                    <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[100px]">
                        {task.project.name}
                    </span>
                )}
                {task.due_date && (
                    <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {formatDate(task.due_date)}
                    </span>
                )}
            </div>
        </Link>
    );
}

export default function DashboardIndex({
    overdue_tasks, today_tasks, upcoming_tasks, projects, recent_activity, stats,
}: DashboardProps) {
    const hasStats = Object.keys(stats).length > 0;

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />
            <div className="p-6 space-y-6">
                {/* Admin stats */}
                {hasStats && (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <FolderKanban className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_projects}</p>
                                        <p className="text-xs text-gray-500">Wszystkie projekty</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active_projects}</p>
                                        <p className="text-xs text-gray-500">Aktywne projekty</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                        <CheckSquare className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_tasks}</p>
                                        <p className="text-xs text-gray-500">Wszystkie zadania</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue_tasks}</p>
                                        <p className="text-xs text-gray-500">Po terminie</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Overdue tasks */}
                        {overdue_tasks.length > 0 && (
                            <Card className="border-red-200 dark:border-red-800">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-red-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        Po terminie ({overdue_tasks.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {overdue_tasks.map(task => <TaskRow key={task.id} task={task} />)}
                                </CardContent>
                            </Card>
                        )}

                        {/* Today's tasks */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-brand-600" />
                                    Dziś ({today_tasks.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {today_tasks.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-2">Brak zadań na dziś.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {today_tasks.map(task => <TaskRow key={task.id} task={task} />)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming tasks */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    Najbliższe 7 dni ({upcoming_tasks.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcoming_tasks.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-2">Brak nadchodzących zadań.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {upcoming_tasks.map(task => <TaskRow key={task.id} task={task} />)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* My projects */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4 text-brand-600" />
                                        Projekty
                                    </CardTitle>
                                    <Link href={route('projects.index')} className="text-xs text-brand-600 hover:underline">
                                        Wszystkie
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {projects.length === 0 ? (
                                    <p className="text-sm text-gray-400">Brak aktywnych projektów.</p>
                                ) : projects.map(project => (
                                    <Link
                                        key={project.id}
                                        href={route('projects.show', project.id)}
                                        className="block group"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 truncate">
                                                {project.name}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-2 shrink-0">
                                                {project.progress ?? 0}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="h-1.5 rounded-full bg-brand-500 transition-all"
                                                style={{ width: `${project.progress ?? 0}%` }}
                                            />
                                        </div>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Recent activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ostatnia aktywność</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recent_activity.length === 0 ? (
                                    <p className="text-sm text-gray-400">Brak aktywności.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recent_activity.map(log => (
                                            <div key={log.id} className="flex items-start gap-2">
                                                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium shrink-0">
                                                    {log.user?.first_name?.[0]}{log.user?.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300">
                                                        <span className="font-medium">{log.user?.full_name}</span>
                                                        {' · '}{log.action}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(log.created_at).toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

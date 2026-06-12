import React, { useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Paperclip, Download, Send, Clock, CheckSquare2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Task, Comment, Attachment, ActivityLog, User, Tag, PageProps,
} from '@/types';
import {
    cn,
    formatDate,
    formatDateTime,
    formatFileSize,
    TASK_STATUS_LABELS,
    TASK_STATUS_COLORS,
    TASK_PRIORITY_LABELS,
    TASK_PRIORITY_COLORS,
    isOverdue,
} from '@/lib/utils';

interface Props {
    task: Task;
    comments: Comment[];
    attachments: Attachment[];
    activity_log: ActivityLog[];
    project_users: User[];
    tags: Tag[];
}

export default function TaskShow({ task, comments, attachments, activity_log, project_users, tags }: Props) {
    const { auth, flash } = usePage<PageProps>().props;

    const commentForm = useForm({ content: '' });
    const attachmentForm = useForm({ file: null as File | null, entity_type: 'task', entity_id: task.id });

    function submitComment(e: React.FormEvent) {
        e.preventDefault();
        commentForm.post(route('tasks.comments.store', task.id), {
            onSuccess: () => commentForm.reset(),
        });
    }

    function submitAttachment(e: React.FormEvent) {
        e.preventDefault();
        attachmentForm.post(route('attachments.store'), {
            forceFormData: true,
            onSuccess: () => attachmentForm.reset(),
        });
    }

    function updateField(field: string, value: string) {
        router.put(route('tasks.update', task.id), { [field]: value } as Record<string, string>, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    function toggleChecklist(checklistId: number, isDone: boolean) {
        router.put(route('tasks.checklists.update', [task.id, checklistId]), { is_done: !isDone } as any, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    return (
        <AppLayout title={task.title}>
            <Head title={task.title} />
            <div className="p-6 space-y-5">
                {flash?.success && (
                    <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={task.project_id ? route('projects.show', task.project_id) : route('tasks.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">
                                {task.project ? (
                                    <Link href={route('projects.show', task.project_id)} className="hover:text-brand-600">
                                        {task.project.name}
                                    </Link>
                                ) : 'Zadanie'}
                            </span>
                            <span className="text-xs text-gray-400">/</span>
                            <span className="text-xs text-gray-500">#{task.id}</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Opis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {task.description ? (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.description}</p>
                                ) : (
                                    <p className="text-sm text-gray-400">Brak opisu.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Subtasks */}
                        {task.subtasks && task.subtasks.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Podzadania ({task.subtasks.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {task.subtasks.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 dark:border-gray-700">
                                            <Link href={route('tasks.show', sub.id)} className="text-sm text-gray-800 dark:text-gray-200 hover:text-brand-600">
                                                {sub.title}
                                            </Link>
                                            <span className={cn('text-xs rounded-full px-2 py-0.5', TASK_STATUS_COLORS[sub.status])}>
                                                {TASK_STATUS_LABELS[sub.status]}
                                            </span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Checklist */}
                        {task.checklists && task.checklists.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckSquare2 className="h-4 w-4" />
                                        Lista kontrolna ({task.checklists.filter(c => c.is_done).length}/{task.checklists.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {task.checklists.map(item => (
                                        <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={item.is_done}
                                                onChange={() => toggleChecklist(item.id, item.is_done)}
                                                className="rounded border-gray-300"
                                            />
                                            <span className={cn('text-sm', item.is_done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300')}>
                                                {item.content}
                                            </span>
                                        </label>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {task.tags.map(tag => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                        style={{ backgroundColor: tag.color + '22', color: tag.color }}
                                    >
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Comments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Komentarze ({comments.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {comments.length === 0 && (
                                    <p className="text-sm text-gray-400">Brak komentarzy.</p>
                                )}
                                {comments.map(comment => (
                                    <div key={comment.id} className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                            {comment.user?.first_name?.[0]}{comment.user?.last_name?.[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{comment.user?.full_name}</span>
                                                <span className="text-xs text-gray-400">{formatDateTime(comment.created_at)}</span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}

                                <form onSubmit={submitComment} className="flex items-start gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                                        {auth.user.first_name[0]}{auth.user.last_name[0]}
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                        <Textarea
                                            placeholder="Dodaj komentarz..."
                                            value={commentForm.data.content}
                                            onChange={e => commentForm.setData('content', e.target.value)}
                                            rows={2}
                                            className="flex-1"
                                        />
                                        <Button type="submit" size="icon" disabled={commentForm.processing}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Attachments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    Załączniki ({attachments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {attachments.length === 0 && (
                                    <p className="text-sm text-gray-400">Brak załączników.</p>
                                )}
                                {attachments.map(att => (
                                    <div key={att.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 dark:border-gray-700">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{att.original_filename}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(att.file_size)} · {att.uploader?.full_name}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={att.download_url} download>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                ))}

                                <form onSubmit={submitAttachment} className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <Input
                                        type="file"
                                        onChange={e => attachmentForm.setData('file', e.target.files?.[0] ?? null)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" disabled={attachmentForm.processing || !attachmentForm.data.file}>
                                        Prześlij
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Activity log */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Aktywność</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activity_log.length === 0 ? (
                                    <p className="text-sm text-gray-400">Brak aktywności.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {activity_log.map(log => (
                                            <div key={log.id} className="flex items-start gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium shrink-0">
                                                    {log.user?.first_name?.[0]}{log.user?.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300">
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
                    </div>

                    {/* Right column - Details */}
                    <div className="space-y-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>Szczegóły</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Status</Label>
                                    <Select
                                        value={task.status}
                                        onChange={e => updateField('status', e.target.value)}
                                    >
                                        <option value="todo">Do zrobienia</option>
                                        <option value="in_progress">W trakcie</option>
                                        <option value="review">Do sprawdzenia</option>
                                        <option value="blocked">Zablokowane</option>
                                        <option value="done">Zakończone</option>
                                        <option value="cancelled">Anulowane</option>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Priorytet</Label>
                                    <Select
                                        value={task.priority}
                                        onChange={e => updateField('priority', e.target.value)}
                                    >
                                        <option value="low">Niski</option>
                                        <option value="medium">Średni</option>
                                        <option value="high">Wysoki</option>
                                        <option value="urgent">Pilny</option>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Przypisany do</Label>
                                    <Select
                                        value={task.assigned_to?.toString() ?? ''}
                                        onChange={e => updateField('assigned_to', e.target.value)}
                                        placeholder="Nieprzypisany"
                                    >
                                        {project_users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Termin</Label>
                                    <p className={cn('text-sm', task.due_date && isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-700 dark:text-gray-300')}>
                                        {formatDate(task.due_date)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1 block">Szac. godziny</Label>
                                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            {task.estimated_hours ?? '—'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1 block">Przeprac. godziny</Label>
                                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            {task.spent_hours ?? '—'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Twórca</Label>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{task.creator?.full_name ?? '—'}</p>
                                </div>

                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">Utworzono</Label>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(task.created_at)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tagi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tags.length === 0 ? (
                                    <p className="text-sm text-gray-400">Brak dostępnych tagów.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map(tag => {
                                            const active = task.tags?.some(t => t.id === tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => router.put(route('tasks.tags.toggle', [task.id, tag.id]), {}, { preserveState: true, preserveScroll: true })}
                                                    className={cn(
                                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-opacity',
                                                        active ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                                                    )}
                                                    style={{ borderColor: tag.color, color: tag.color, backgroundColor: tag.color + '22' }}
                                                >
                                                    {tag.name}
                                                </button>
                                            );
                                        })}
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

import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { PaginatedData, Notification, PageProps } from '@/types';
import { cn, formatDateTime } from '@/lib/utils';

interface Props {
    notifications: PaginatedData<Notification>;
}

function Pagination({ data }: { data: PaginatedData<unknown> }) {
    if (data.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
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

const NOTIFICATION_ICONS: Record<string, string> = {
    task_assigned: '📋',
    task_overdue: '⚠️',
    comment_added: '💬',
    project_added: '📁',
    deadline_approaching: '🕐',
};

export default function NotificationsIndex({ notifications }: Props) {
    const { flash } = usePage<PageProps>().props;

    function markAllRead() {
        router.post(route('notifications.mark-all-read'));
    }

    function markRead(id: number) {
        router.patch(route('notifications.read', id), {}, { preserveScroll: true });
    }

    return (
        <AppLayout title="Powiadomienia">
            <Head title="Powiadomienia" />
            <div className="p-6 space-y-5">
                {flash?.success && (
                    <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Powiadomienia ({notifications.total})
                    </h2>
                    {notifications.total > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllRead}>
                            <CheckCheck className="h-4 w-4" />
                            Zaznacz wszystkie jako przeczytane
                        </Button>
                    )}
                </div>

                <Card>
                    <CardContent className="p-0">
                        {notifications.data.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <BellOff className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                                <p className="mt-3 text-sm text-gray-400">Brak powiadomień.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {notifications.data.map(notification => (
                                    <li
                                        key={notification.id}
                                        className={cn(
                                            'flex items-start gap-3 px-4 py-3 transition-colors',
                                            !notification.is_read && 'bg-brand-50/50 dark:bg-brand-900/10'
                                        )}
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg dark:bg-gray-800">
                                            {NOTIFICATION_ICONS[notification.type] ?? '🔔'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className={cn('text-sm font-medium text-gray-900 dark:text-white', !notification.is_read && 'font-semibold')}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                                                </div>
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={() => markRead(notification.id)}
                                                        className="shrink-0 text-brand-600 hover:text-brand-700 text-xs mt-0.5"
                                                    >
                                                        <span className="inline-block h-2 w-2 rounded-full bg-brand-600"></span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{formatDateTime(notification.created_at)}</span>
                                                {notification.link && (
                                                    <Link href={notification.link} className="text-xs text-brand-600 hover:underline">
                                                        Zobacz
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <Pagination data={notifications} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

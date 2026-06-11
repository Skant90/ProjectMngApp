import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { MessageSquarePlus, MessageSquare } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { ChatRoom, PageProps } from '@/types';
import { cn, formatDateTime } from '@/lib/utils';

interface Props {
    rooms: ChatRoom[];
}

export default function ChatIndex({ rooms }: Props) {
    const { flash } = usePage<PageProps>().props;

    return (
        <AppLayout title="Czat">
            <Head title="Czat" />
            <div className="p-6 space-y-5">
                {flash?.success && (
                    <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Czat</h2>
                    <Button asChild>
                        <Link href={route('chat.direct.create')}>
                            <MessageSquarePlus className="h-4 w-4" />
                            Nowa wiadomość
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {rooms.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <MessageSquare className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                                <p className="mt-3 text-sm text-gray-400">Brak pokojów czatu.</p>
                                <Button className="mt-4" asChild>
                                    <Link href={route('chat.direct.create')}>Rozpocznij rozmowę</Link>
                                </Button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {rooms.map(room => (
                                    <li key={room.id}>
                                        <Link
                                            href={route('chat.room', room.id)}
                                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                                {room.name[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {room.name}
                                                    </span>
                                                    {room.last_message && (
                                                        <span className="text-xs text-gray-400 shrink-0">
                                                            {formatDateTime(room.last_message.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {room.last_message
                                                            ? `${room.last_message.user?.first_name}: ${room.last_message.message}`
                                                            : 'Brak wiadomości'}
                                                    </p>
                                                    {(room.unread_count ?? 0) > 0 && (
                                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white shrink-0 ml-2">
                                                            {room.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

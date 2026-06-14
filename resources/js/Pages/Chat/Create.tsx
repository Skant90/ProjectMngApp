import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Card, CardContent } from '@/Components/ui/card';
import { User } from '@/types';

interface Props {
    users: User[];
}

export default function ChatCreate({ users }: Props) {
    const [search, setSearch] = useState('');
    const { post, processing } = useForm({});

    const filtered = users.filter(u =>
        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    function startChat(userId: number) {
        post(route('chat.direct'), {
            data: { user_id: userId } as any,
        });
    }

    return (
        <AppLayout title="Nowa wiadomość">
            <Head title="Nowa wiadomość" />
            <div className="p-6 space-y-5 max-w-lg">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('chat.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nowa wiadomość</h2>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Szukaj użytkownika..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <Card>
                    <CardContent className="p-0">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-gray-400">Nie znaleziono użytkowników.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {filtered.map(user => (
                                    <li key={user.id}>
                                        <button
                                            onClick={() => startChat(user.id)}
                                            disabled={processing}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                                {user.first_name[0]}{user.last_name[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.first_name} {user.last_name}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            </div>
                                        </button>
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

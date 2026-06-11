import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Search, FolderKanban, CheckSquare, Users } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS, PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/lib/utils';
import { TaskStatus, ProjectStatus } from '@/types';

interface Props {
    query: string;
    results: {
        projects: Array<{ id: number; name: string; status: ProjectStatus }>;
        tasks: Array<{ id: number; title: string; status: TaskStatus; project_id: number; project?: { id: number; name: string } }>;
        users: Array<{ id: number; first_name: string; last_name: string; email: string; role: string }>;
    };
}

export default function SearchIndex({ query, results }: Props) {
    const [q, setQ] = useState(query);

    const search = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('search'), { q }, { preserveState: true });
    };

    const totalResults = results.projects.length + results.tasks.length + results.users.length;

    return (
        <AppLayout title="Wyszukiwanie">
            <Head title="Wyszukiwanie" />
            <div className="p-6 max-w-3xl">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Wyszukiwanie</h1>

                <form onSubmit={search} className="flex gap-2 mb-6">
                    <Input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Szukaj projektów, zadań, użytkowników..."
                        className="flex-1"
                        autoFocus
                    />
                    <Button type="submit"><Search className="h-4 w-4 mr-1" />Szukaj</Button>
                </form>

                {query && (
                    <p className="text-sm text-gray-500 mb-4">
                        {totalResults === 0 ? 'Brak wyników dla' : `${totalResults} wynik${totalResults === 1 ? '' : 'ów'} dla`}{' '}
                        <strong>"{query}"</strong>
                    </p>
                )}

                {results.projects.length > 0 && (
                    <Card className="mb-4">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderKanban className="h-4 w-4" />Projekty ({results.projects.length})</CardTitle></CardHeader>
                        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                            {results.projects.map(p => (
                                <Link key={p.id} href={route('projects.show', p.id)} className="flex items-center justify-between py-2.5 hover:text-brand-600 group">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600">{p.name}</span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PROJECT_STATUS_COLORS[p.status]}`}>
                                        {PROJECT_STATUS_LABELS[p.status]}
                                    </span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {results.tasks.length > 0 && (
                    <Card className="mb-4">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckSquare className="h-4 w-4" />Zadania ({results.tasks.length})</CardTitle></CardHeader>
                        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                            {results.tasks.map(t => (
                                <Link key={t.id} href={route('tasks.show', t.id)} className="flex items-center justify-between py-2.5 group">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600">{t.title}</p>
                                        {t.project && <p className="text-xs text-gray-400">{t.project.name}</p>}
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TASK_STATUS_COLORS[t.status]}`}>
                                        {TASK_STATUS_LABELS[t.status]}
                                    </span>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {results.users.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Użytkownicy ({results.users.length})</CardTitle></CardHeader>
                        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                            {results.users.map(u => (
                                <div key={u.id} className="flex items-center gap-3 py-2.5">
                                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
                                        {u.first_name[0]}{u.last_name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</p>
                                        <p className="text-xs text-gray-400">{u.email}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {query && totalResults === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Brak wyników. Spróbuj innego zapytania.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

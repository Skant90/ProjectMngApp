import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Project, User } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    project: Project;
    users: User[];
}

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

export default function ProjectEdit({ project, users: _users }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: project.name,
        description: project.description ?? '',
        status: project.status as string,
        priority: project.priority as string,
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('projects.update', project.id));
    }

    const members = project.members ?? [];

    return (
        <AppLayout title={`Edycja: ${project.name}`}>
            <Head title={`Edycja: ${project.name}`} />
            <div className="mx-auto max-w-2xl p-6 space-y-5">
                {/* Back navigation */}
                <div className="flex items-center gap-3">
                    <Link href={route('projects.show', project.id)}>
                        <Button variant="ghost" size="sm" title="Wróć do projektu">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Edytuj projekt
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.name}</p>
                    </div>
                </div>

                {/* Form card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dane projektu</CardTitle>
                        <CardDescription>
                            Zaktualizuj informacje o projekcie i zapisz zmiany.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5" noValidate>
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name">
                                    Nazwa projektu <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    error={errors.name}
                                    placeholder="Wprowadź nazwę projektu"
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="description">Opis</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    error={errors.description}
                                    placeholder="Opisz cel i zakres projektu..."
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.description}</p>
                                )}
                            </div>

                            {/* Status + Priority */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        id="status"
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                        error={errors.status}
                                    >
                                        <option value="active">Aktywny</option>
                                        <option value="paused">Wstrzymany</option>
                                        <option value="completed">Zakończony</option>
                                        <option value="archived">Zarchiwizowany</option>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-xs text-red-600 dark:text-red-400">{errors.status}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="priority">Priorytet</Label>
                                    <Select
                                        id="priority"
                                        value={data.priority}
                                        onChange={e => setData('priority', e.target.value)}
                                        error={errors.priority}
                                    >
                                        <option value="low">Niski</option>
                                        <option value="normal">Normalny</option>
                                        <option value="high">Wysoki</option>
                                        <option value="critical">Krytyczny</option>
                                    </Select>
                                    {errors.priority && (
                                        <p className="text-xs text-red-600 dark:text-red-400">{errors.priority}</p>
                                    )}
                                </div>
                            </div>

                            {/* Start date + End date */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date">Data rozpoczęcia</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={e => setData('start_date', e.target.value)}
                                        error={errors.start_date}
                                    />
                                    {errors.start_date && (
                                        <p className="text-xs text-red-600 dark:text-red-400">{errors.start_date}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="end_date">Termin zakończenia</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                        error={errors.end_date}
                                    />
                                    {errors.end_date && (
                                        <p className="text-xs text-red-600 dark:text-red-400">{errors.end_date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                                <Link href={route('projects.show', project.id)}>
                                    <Button variant="outline" type="button">
                                        Anuluj
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Current members — read-only display */}
                {members.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Aktualni członkowie
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({members.length})
                                </span>
                            </CardTitle>
                            <CardDescription>
                                Lista osób przypisanych do projektu. Zarządzanie członkami dostępne
                                jest w ustawieniach projektu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
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
                                            <tr key={member.id}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
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
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Task, Project, User, Tag } from '@/types';

declare const route: Function;

interface Props {
    task: Task;
    projects: Project[];
    users: User[];
    tags: Tag[];
}

export default function TaskEdit({ task, projects, users, tags }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        project_id: task.project_id.toString(),
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to?.toString() ?? '',
        estimated_hours: task.estimated_hours?.toString() ?? '',
        due_date: task.due_date ?? '',
        tags: task.tags?.map(t => t.id) ?? [] as number[],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('tasks.update', task.id));
    }

    function toggleTag(tagId: number) {
        const current = data.tags;
        setData('tags', current.includes(tagId)
            ? current.filter(id => id !== tagId)
            : [...current, tagId]
        );
    }

    return (
        <AppLayout title="Edytuj zadanie">
            <Head title="Edytuj zadanie" />
            <div className="p-6 max-w-2xl mx-auto space-y-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('tasks.show', task.id)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edytuj zadanie</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dane zadania</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label htmlFor="project_id">Projekt *</Label>
                                <Select
                                    id="project_id"
                                    value={data.project_id}
                                    onChange={e => setData('project_id', e.target.value)}
                                    error={errors.project_id}
                                    placeholder="Wybierz projekt..."
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="title">Tytuł zadania *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    error={errors.title}
                                    placeholder="Wprowadź tytuł zadania"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Opis</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    error={errors.description}
                                    placeholder="Opisz zadanie..."
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        id="status"
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                        error={errors.status}
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
                                    <Label htmlFor="priority">Priorytet</Label>
                                    <Select
                                        id="priority"
                                        value={data.priority}
                                        onChange={e => setData('priority', e.target.value)}
                                        error={errors.priority}
                                    >
                                        <option value="low">Niski</option>
                                        <option value="medium">Średni</option>
                                        <option value="high">Wysoki</option>
                                        <option value="urgent">Pilny</option>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="assigned_to">Przypisany do</Label>
                                <Select
                                    id="assigned_to"
                                    value={data.assigned_to}
                                    onChange={e => setData('assigned_to', e.target.value)}
                                    error={errors.assigned_to}
                                    placeholder="Wybierz użytkownika..."
                                >
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="estimated_hours">Szacowane godziny</Label>
                                    <Input
                                        id="estimated_hours"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={data.estimated_hours}
                                        onChange={e => setData('estimated_hours', e.target.value)}
                                        error={errors.estimated_hours}
                                        placeholder="np. 8"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="due_date">Termin</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={e => setData('due_date', e.target.value)}
                                        error={errors.due_date}
                                    />
                                </div>
                            </div>

                            {tags.length > 0 && (
                                <div>
                                    <Label>Tagi</Label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {tags.map(tag => (
                                            <label key={tag.id} className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={data.tags.includes(tag.id)}
                                                    onChange={() => toggleTag(tag.id)}
                                                    className="rounded border-gray-300"
                                                />
                                                <span
                                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                                    style={{ backgroundColor: tag.color + '22', color: tag.color }}
                                                >
                                                    {tag.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" asChild>
                                    <Link href={route('tasks.show', task.id)}>Anuluj</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Zapisywanie...' : 'Zapisz zmiany'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

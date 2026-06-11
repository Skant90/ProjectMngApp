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
import { User } from '@/types';

interface Props {
    users: User[];
}

export default function ProjectCreate({ users }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        status: 'active',
        priority: 'normal',
        start_date: '',
        end_date: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('projects.store'));
    }

    return (
        <AppLayout title="Nowy projekt">
            <Head title="Nowy projekt" />
            <div className="p-6 max-w-2xl mx-auto space-y-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('projects.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nowy projekt</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dane projektu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nazwa projektu *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    error={errors.name}
                                    placeholder="Wprowadź nazwę projektu"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Opis</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    error={errors.description}
                                    placeholder="Opisz cel i zakres projektu..."
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
                                        <option value="active">Aktywny</option>
                                        <option value="paused">Wstrzymany</option>
                                        <option value="completed">Zakończony</option>
                                        <option value="archived">Zarchiwizowany</option>
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
                                        <option value="normal">Normalny</option>
                                        <option value="high">Wysoki</option>
                                        <option value="critical">Krytyczny</option>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start_date">Data rozpoczęcia</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={e => setData('start_date', e.target.value)}
                                        error={errors.start_date}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="end_date">Data zakończenia</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                        error={errors.end_date}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" asChild>
                                    <Link href={route('projects.index')}>Anuluj</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Zapisywanie...' : 'Utwórz projekt'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

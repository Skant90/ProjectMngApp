import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

export default function AdminUserCreate() {
    const { data, setData, post, processing, errors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: 'user',
        is_active: true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(route('admin.users.store'));
    }

    return (
        <AppLayout title="Nowy użytkownik">
            <Head title="Nowy użytkownik" />
            <div className="p-6 max-w-2xl mx-auto space-y-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.users.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nowy użytkownik</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dane użytkownika</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="first_name">Imię *</Label>
                                    <Input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={e => setData('first_name', e.target.value)}
                                        error={errors.first_name}
                                        placeholder="Jan"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="last_name">Nazwisko *</Label>
                                    <Input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={e => setData('last_name', e.target.value)}
                                        error={errors.last_name}
                                        placeholder="Kowalski"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    error={errors.email}
                                    placeholder="jan.kowalski@firma.pl"
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone">Telefon</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    error={errors.phone}
                                    placeholder="+48 123 456 789"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="password">Hasło *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        error={errors.password}
                                        placeholder="Minimum 8 znaków"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password_confirmation">Potwierdź hasło *</Label>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        placeholder="Powtórz hasło"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="role">Rola</Label>
                                    <Select
                                        id="role"
                                        value={data.role}
                                        onChange={e => setData('role', e.target.value)}
                                        error={errors.role}
                                    >
                                        <option value="admin">Administrator</option>
                                        <option value="manager">Kierownik</option>
                                        <option value="user">Użytkownik</option>
                                        <option value="guest">Gość</option>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        id="is_active"
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="is_active" className="cursor-pointer">Aktywny konto</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" asChild>
                                    <Link href={route('admin.users.index')}>Anuluj</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Zapisywanie...' : 'Utwórz użytkownika'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

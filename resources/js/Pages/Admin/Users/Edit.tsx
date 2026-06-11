import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { User } from '@/types';

interface Props {
    user: User;
}

export default function AdminUserEdit({ user }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone ?? '',
        password: '',
        password_confirmation: '',
        role: user.role,
        is_active: user.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    }

    return (
        <AppLayout title={"Edycja: " + user.full_name}>
            <Head title={"Edycja: " + user.full_name} />
            <div className="p-6 max-w-2xl mx-auto space-y-5">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.users.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edytuj uzytkownika</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dane uzytkownika</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="first_name">Imie *</Label>
                                    <Input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={e => setData('first_name', e.target.value)}
                                        error={errors.first_name}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="last_name">Nazwisko *</Label>
                                    <Input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={e => setData('last_name', e.target.value)}
                                        error={errors.last_name}
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
                                />
                            </div>

                            <div className="rounded-md border border-gray-200 p-4 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Zmiana hasla (pozostaw puste, aby nie zmieniac)
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="password">Nowe haslo</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            error={errors.password}
                                            placeholder="Minimum 8 znakow"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="password_confirmation">Potwierdz haslo</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            placeholder="Powtorz haslo"
                                        />
                                    </div>
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
                                        <option value="user">Uzytkownik</option>
                                        <option value="guest">Gosc</option>
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
                                    <Label htmlFor="is_active" className="cursor-pointer">Aktywne konto</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" type="button" asChild>
                                    <Link href={route('admin.users.index')}>Anuluj</Link>
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

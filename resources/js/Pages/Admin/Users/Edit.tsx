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

interface Props { user: User; }

export default function UserEdit({ user }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone ?? '',
        password: '',
        password_confirmation: '',
        role: user.role as string,
        is_active: user.is_active,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    };

    return (
        <AppLayout title="Edytuj użytkownika">
            <Head title="Edytuj użytkownika" />
            <div className="p-6 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Link href={route('admin.users.index')}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edytuj użytkownika</h1>
                </div>
                <Card>
                    <CardHeader><CardTitle>Dane konta</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="first_name">Imię *</Label>
                                    <Input id="first_name" value={data.first_name} onChange={e => setData('first_name', e.target.value)} error={errors.first_name} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="last_name">Nazwisko *</Label>
                                    <Input id="last_name" value={data.last_name} onChange={e => setData('last_name', e.target.value)} error={errors.last_name} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">E-mail *</Label>
                                <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} error={errors.email} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} error={errors.phone} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Nowe hasło (zostaw puste by nie zmieniać)</Label>
                                <Input id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} error={errors.password} autoComplete="new-password" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation">Potwierdź hasło</Label>
                                <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} autoComplete="new-password" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="role">Rola</Label>
                                    <Select id="role" value={data.role} onChange={e => setData('role', e.target.value)} error={errors.role}>
                                        <option value="admin">Administrator</option>
                                        <option value="manager">Kierownik</option>
                                        <option value="user">Użytkownik</option>
                                        <option value="guest">Gość</option>
                                    </Select>
                                </div>
                                <div className="space-y-1.5 flex flex-col justify-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="h-4 w-4 rounded text-brand-600" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Konto aktywne</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Link href={route('admin.users.index')}><Button type="button" variant="outline">Anuluj</Button></Link>
                                <Button type="submit" disabled={processing}>{processing ? 'Zapisuję...' : 'Zapisz zmiany'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

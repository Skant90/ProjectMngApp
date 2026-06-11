import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { FolderKanban } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Logowanie" />
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4">
                            <FolderKanban className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectMng</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">System zarządzania projektami</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Zaloguj się</CardTitle>
                            <CardDescription>Wprowadź dane dostępowe</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Adres e-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        autoComplete="email"
                                        autoFocus
                                        placeholder="jan@firma.pl"
                                        error={errors.email}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Hasło</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        error={errors.password}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-brand-600"
                                    />
                                    <Label htmlFor="remember" className="cursor-pointer">
                                        Zapamiętaj mnie
                                    </Label>
                                </div>

                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing ? 'Logowanie...' : 'Zaloguj się'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Dostęp tylko przez VPN · Prywatny system firmowy
                    </p>
                </div>
            </div>
        </>
    );
}

import React from 'react';
import { Head } from '@inertiajs/react';
import { Settings, Info, Database, Server, Globe } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';

export default function AdminSettings() {
    return (
        <AppLayout title="Ustawienia systemu">
            <Head title="Ustawienia systemu" />
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Settings className="h-6 w-6 text-gray-400" />
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ustawienia systemu</h1>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-blue-500" />
                                Informacje o aplikacji
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Nazwa aplikacji</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">ProjectMng</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Wersja</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">1.0.0</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Framework</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Laravel + Inertia.js</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-500">Frontend</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">React + TypeScript</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-green-500" />
                                Środowisko
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Środowisko</span>
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                    Production
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">PHP</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">8.2+</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Baza danych</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">MySQL</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-500">Cache</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Redis</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-purple-500" />
                                Statystyki systemu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
                                <p className="text-sm text-gray-400">Statystyki systemowe będą dostępne wkrótce.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-orange-500" />
                                Ustawienia ogólne
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 p-4 text-center">
                                <p className="text-sm text-gray-400">Konfiguracja ustawień ogólnych będzie dostępna wkrótce.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

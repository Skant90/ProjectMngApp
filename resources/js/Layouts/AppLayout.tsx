import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    MessageSquare,
    Bell,
    Settings,
    Users,
    ChevronDown,
    Menu,
    X,
    LogOut,
    Moon,
    Sun,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageProps } from '@/types';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    adminOnly?: boolean;
    managerOnly?: boolean;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard },
    { label: 'Projekty', href: route('projects.index'), icon: FolderKanban },
    { label: 'Zadania', href: route('tasks.index'), icon: CheckSquare },
    { label: 'Czat', href: route('chat.index'), icon: MessageSquare },
    { label: 'Użytkownicy', href: route('admin.users.index'), icon: Users, adminOnly: true },
    { label: 'Ustawienia', href: route('admin.settings'), icon: Settings, adminOnly: true },
];

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const { auth, unread_notifications_count } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(
        () => document.documentElement.classList.contains('dark')
    );

    const toggleDark = () => {
        document.documentElement.classList.toggle('dark');
        setDarkMode(!darkMode);
    };

    const visibleNav = navItems.filter(item => {
        if (item.adminOnly && auth.user.role !== 'admin') return false;
        return true;
    });

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b border-gray-200 px-4 dark:border-gray-700">
                <Link href={route('dashboard')} className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
                        <FolderKanban className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">ProjectMng</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {visibleNav.map((item) => {
                    const isActive = window.location.pathname.startsWith(
                        new URL(item.href).pathname
                    );
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        {auth.user.first_name[0]}{auth.user.last_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {auth.user.first_name} {auth.user.last_name}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {auth.user.email}
                        </p>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <LogOut className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
            {/* Desktop sidebar */}
            <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col dark:border-gray-700 dark:bg-gray-900">
                <SidebarContent />
            </aside>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <aside className="absolute left-0 top-0 h-full w-56 bg-white dark:bg-gray-900">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
                    <button
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {title && (
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
                            {title}
                        </h1>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        <Link
                            href={route('search')}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        >
                            <Search className="h-4 w-4" />
                        </Link>

                        <Link
                            href={route('notifications.index')}
                            className="relative flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        >
                            <Bell className="h-4 w-4" />
                            {(unread_notifications_count ?? 0) > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {unread_notifications_count}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={toggleDark}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        >
                            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

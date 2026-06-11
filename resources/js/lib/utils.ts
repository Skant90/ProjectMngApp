import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskStatus, TaskPriority, ProjectStatus, ProjectPriority } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateTime(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    todo: 'Do zrobienia',
    in_progress: 'W trakcie',
    review: 'Do sprawdzenia',
    blocked: 'Zablokowane',
    done: 'Zakończone',
    cancelled: 'Anulowane',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
    todo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    review: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    blocked: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
    low: 'Niski',
    medium: 'Średni',
    high: 'Wysoki',
    urgent: 'Pilny',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    active: 'Aktywny',
    paused: 'Wstrzymany',
    completed: 'Zakończony',
    archived: 'Zarchiwizowany',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-500',
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
    low: 'Niski',
    normal: 'Normalny',
    high: 'Wysoki',
    critical: 'Krytyczny',
};

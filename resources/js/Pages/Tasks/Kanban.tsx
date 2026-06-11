import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCorners,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, Plus } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Project, Task, TaskStatus } from '@/types';
import { cn, formatDate, TASK_PRIORITY_COLORS, isOverdue } from '@/lib/utils';

interface Props {
    project: Project;
    tasks_by_status: Record<string, Task[]>;
}

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
    { key: 'todo', label: 'Do zrobienia', color: 'border-gray-300 dark:border-gray-600' },
    { key: 'in_progress', label: 'W trakcie', color: 'border-blue-400 dark:border-blue-600' },
    { key: 'review', label: 'Do sprawdzenia', color: 'border-orange-400 dark:border-orange-600' },
    { key: 'blocked', label: 'Zablokowane', color: 'border-red-400 dark:border-red-600' },
    { key: 'done', label: 'Zakończone', color: 'border-green-400 dark:border-green-600' },
];

interface TaskCardProps {
    task: Task;
    isDragging?: boolean;
}

function TaskCard({ task, isDragging }: TaskCardProps) {
    return (
        <div className={cn(
            'rounded-md border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800',
            isDragging && 'rotate-2 shadow-lg opacity-90'
        )}>
            <Link href={route('tasks.show', task.id)} className="block">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400">
                    {task.title}
                </p>
            </Link>
            <div className="mt-2 flex items-center justify-between">
                <span className={cn('inline-block h-2 w-2 rounded-full', {
                    'bg-red-500': task.priority === 'urgent',
                    'bg-orange-500': task.priority === 'high',
                    'bg-blue-500': task.priority === 'medium',
                    'bg-gray-400': task.priority === 'low',
                })} />
                <div className="flex items-center gap-2">
                    {task.due_date && (
                        <span className={cn('text-xs', isOverdue(task.due_date) ? 'text-red-500 font-medium' : 'text-gray-400')}>
                            {formatDate(task.due_date)}
                        </span>
                    )}
                    {task.assignee && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 shrink-0">
                            {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface SortableTaskCardProps {
    task: Task;
}

function SortableTaskCard({ task }: SortableTaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} />
        </div>
    );
}

export default function TasksKanban({ project, tasks_by_status }: Props) {
    const [columns, setColumns] = useState<Record<string, Task[]>>(() => {
        const initial: Record<string, Task[]> = {};
        COLUMNS.forEach(col => {
            initial[col.key] = tasks_by_status[col.key] ?? [];
        });
        return initial;
    });
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    function findColumnForTask(taskId: number): string | null {
        for (const [colKey, tasks] of Object.entries(columns)) {
            if (tasks.some(t => t.id === taskId)) return colKey;
        }
        return null;
    }

    function handleDragStart(event: DragStartEvent) {
        const taskId = event.active.id as number;
        for (const tasks of Object.values(columns)) {
            const task = tasks.find(t => t.id === taskId);
            if (task) { setActiveTask(task); break; }
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        const activeCol = findColumnForTask(activeId);
        const overCol = COLUMNS.find(c => c.key === overId)?.key
            ?? findColumnForTask(overId as number);

        if (!activeCol || !overCol || activeCol === overCol) return;

        setColumns(prev => {
            const activeTask = prev[activeCol].find(t => t.id === activeId);
            if (!activeTask) return prev;
            return {
                ...prev,
                [activeCol]: prev[activeCol].filter(t => t.id !== activeId),
                [overCol]: [...prev[overCol], activeTask],
            };
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active } = event;
        const taskId = active.id as number;
        const newCol = findColumnForTask(taskId);

        if (newCol) {
            router.put(route('tasks.update', taskId), { status: newCol }, {
                preserveState: true,
                preserveScroll: true,
            });
        }
        setActiveTask(null);
    }

    return (
        <AppLayout title={`Kanban: ${project.name}`}>
            <Head title={`Kanban: ${project.name}`} />
            <div className="p-6 space-y-5 h-full flex flex-col">
                <div className="flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('projects.show', project.id)}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <p className="text-xs text-gray-500">Kanban</p>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{project.name}</h1>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={route('tasks.create', { project_id: project.id })}>
                            <Plus className="h-4 w-4" />
                            Nowe zadanie
                        </Link>
                    </Button>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
                        {COLUMNS.map(col => (
                            <div
                                key={col.key}
                                className="flex flex-col flex-shrink-0 w-64"
                            >
                                <div className={cn('mb-2 flex items-center justify-between rounded-t-md border-t-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50', col.color)}>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {col.label}
                                    </span>
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium dark:bg-gray-700">
                                        {columns[col.key]?.length ?? 0}
                                    </span>
                                </div>

                                <SortableContext
                                    id={col.key}
                                    items={columns[col.key]?.map(t => t.id) ?? []}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div
                                        className="flex flex-col gap-2 flex-1 rounded-b-md border border-t-0 border-gray-200 dark:border-gray-700 p-2 min-h-32 bg-gray-50/50 dark:bg-gray-800/20"
                                        data-column={col.key}
                                    >
                                        {(columns[col.key] ?? []).map(task => (
                                            <SortableTaskCard key={task.id} task={task} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </div>
                        ))}
                    </div>

                    <DragOverlay>
                        {activeTask && <TaskCard task={activeTask} isDragging />}
                    </DragOverlay>
                </DndContext>
            </div>
        </AppLayout>
    );
}

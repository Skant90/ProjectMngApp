import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { ChatRoom, ChatMessage, PageProps } from '@/types';
import { cn, formatDateTime } from '@/lib/utils';

interface Props {
    room: ChatRoom;
    messages: ChatMessage[];
}

export default function ChatRoomPage({ room, messages: initialMessages }: Props) {
    const { auth } = usePage<PageProps>().props;
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastIdRef = useRef<number>(initialMessages[initialMessages.length - 1]?.id ?? 0);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch(
                    `/chat/${room.id}/messages?after_id=${lastIdRef.current}`,
                    { headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }
                );
                if (!res.ok) return;
                const data: ChatMessage[] = await res.json();
                if (data.length > 0) {
                    setMessages(prev => [...prev, ...data]);
                    lastIdRef.current = data[data.length - 1].id;
                }
            } catch {
                // ignore network errors during polling
            }
        }, 3000);
        return () => clearInterval(poll);
    }, [room.id]);

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim() || sending) return;
        setSending(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res = await fetch(`/chat/${room.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ message }),
            });
            if (res.ok) {
                const newMsg: ChatMessage = await res.json();
                setMessages(prev => [...prev, newMsg]);
                lastIdRef.current = newMsg.id;
                setMessage('');
            }
        } catch {
            // handle error silently
        } finally {
            setSending(false);
        }
    }

    return (
        <AppLayout title={room.name}>
            <Head title={room.name} />
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('chat.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        {room.name[0]?.toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{room.name}</p>
                        {room.members && (
                            <p className="text-xs text-gray-400">{room.members.length} uczestników</p>
                        )}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {messages.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-8">
                            Brak wiadomości. Rozpocznij rozmowę!
                        </p>
                    )}
                    {messages.map(msg => {
                        const isOwn = msg.user_id === auth.user.id;
                        return (
                            <div
                                key={msg.id}
                                className={cn('flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
                            >
                                {!isOwn && (
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium dark:bg-gray-700">
                                        {msg.user?.first_name?.[0]}{msg.user?.last_name?.[0]}
                                    </div>
                                )}
                                <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start', 'flex flex-col gap-0.5')}>
                                    {!isOwn && (
                                        <span className="text-xs text-gray-400 ml-1">{msg.user?.full_name}</span>
                                    )}
                                    <div className={cn(
                                        'rounded-2xl px-3 py-2 text-sm',
                                        isOwn
                                            ? 'bg-brand-600 text-white rounded-br-sm'
                                            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-bl-sm'
                                    )}>
                                        {msg.message}
                                    </div>
                                    <span className="text-xs text-gray-400 mx-1">
                                        {formatDateTime(msg.created_at)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
                    <form onSubmit={handleSend} className="flex items-center gap-3">
                        <Input
                            placeholder="Wpisz wiadomość..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="flex-1"
                            autoFocus
                        />
                        <Button type="submit" size="icon" disabled={sending || !message.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

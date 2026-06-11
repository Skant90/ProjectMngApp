export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'normal' | 'high' | 'critical';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectMemberRole = 'manager' | 'member' | 'guest';

export type EntityType = 'project' | 'task' | 'file' | 'comment';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
    full_name: string;
    avatar_url?: string | null;
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    start_date: string | null;
    end_date: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    creator?: User;
    members?: ProjectMember[];
    tasks_count?: number;
    completed_tasks_count?: number;
    progress?: number;
}

export interface ProjectMember {
    id: number;
    project_id: number;
    user_id: number;
    project_role: ProjectMemberRole;
    can_view_all_tasks: boolean;
    can_add_tasks: boolean;
    can_upload_files: boolean;
    can_invite_users: boolean;
    created_at: string;
    user?: User;
    project?: Project;
}

export interface ProjectContact {
    id: number;
    project_id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    position: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: number;
    project_id: number;
    parent_task_id: number | null;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assigned_to: number | null;
    created_by: number;
    estimated_hours: number | null;
    spent_hours: number | null;
    due_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    assignee?: User;
    creator?: User;
    project?: Project;
    subtasks?: Task[];
    tags?: Tag[];
    comments_count?: number;
    attachments_count?: number;
    checklists?: TaskChecklist[];
}

export interface TaskVisibility {
    id: number;
    task_id: number;
    user_id: number;
    can_view: boolean;
    can_comment: boolean;
    can_upload_files: boolean;
    can_edit_status: boolean;
    created_at: string;
    user?: User;
}

export interface Comment {
    id: number;
    entity_type: EntityType;
    entity_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user?: User;
    attachments?: Attachment[];
}

export interface Attachment {
    id: number;
    entity_type: EntityType;
    entity_id: number;
    uploaded_by: number;
    original_filename: string;
    stored_filename: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    created_at: string;
    uploader?: User;
    download_url: string;
}

export interface ActivityLog {
    id: number;
    user_id: number;
    entity_type: string;
    entity_id: number;
    action: string;
    old_value: string | null;
    new_value: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user?: User;
}

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export interface ChatRoom {
    id: number;
    type: 'direct' | 'project' | 'task';
    project_id: number | null;
    task_id: number | null;
    name: string;
    created_by: number;
    created_at: string;
    members?: User[];
    last_message?: ChatMessage;
    unread_count?: number;
}

export interface ChatMessage {
    id: number;
    chat_room_id: number;
    user_id: number;
    message: string;
    attachment_id: number | null;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    user?: User;
    attachment?: Attachment;
}

export interface Tag {
    id: number;
    name: string;
    color: string;
    created_at: string;
}

export interface TaskChecklist {
    id: number;
    task_id: number;
    content: string;
    is_done: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface PageProps {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
    };
    unread_notifications_count?: number;
    [key: string]: unknown;
}

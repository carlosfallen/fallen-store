export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Step {
  id: string;
  title: string;
  completed: boolean;
  orderIndex: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  important: boolean;
  listId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  steps: Step[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  linkedNotes: string[];
}

export interface AppState {
  user: User | null;
  tasks: Task[];
  taskLists: TaskList[];
  notes: Note[];
  darkMode: boolean;
  activeTab: 'tasks' | 'notes' | 'profile';
}
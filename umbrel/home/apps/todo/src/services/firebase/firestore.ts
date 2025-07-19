import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './config';
import { Task, TaskList, Note, Step } from '../../types';

// Tasks
export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    throw error;
  }
};

export const subscribeToTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const tasks: Task[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Task[];
    callback(tasks);
  });
};

// Task Lists
export const createTaskList = async (taskList: Omit<TaskList, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'taskLists'), {
      ...taskList,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateTaskList = async (listId: string, updates: Partial<TaskList>) => {
  try {
    const listRef = doc(db, 'taskLists', listId);
    await updateDoc(listRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw error;
  }
};

export const deleteTaskList = async (listId: string) => {
  try {
    await deleteDoc(doc(db, 'taskLists', listId));
  } catch (error) {
    throw error;
  }
};

export const subscribeToTaskLists = (userId: string, callback: (taskLists: TaskList[]) => void) => {
  const q = query(
    collection(db, 'taskLists'),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const taskLists: TaskList[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as TaskList[];
    callback(taskLists);
  });
};

// Notes
export const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...note,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateNote = async (noteId: string, updates: Partial<Note>) => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    throw error;
  }
};

export const deleteNote = async (noteId: string) => {
  try {
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (error) {
    throw error;
  }
};

export const subscribeToNotes = (userId: string, callback: (notes: Note[]) => void) => {
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const notes: Note[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Note[];
    callback(notes);
  });
};

export const searchNotes = async (userId: string, searchTerm: string) => {
  try {
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const notes: Note[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Note[];

    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  } catch (error) {
    throw error;
  }
};
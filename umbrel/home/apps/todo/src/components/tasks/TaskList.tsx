import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskList as TaskListType } from '../../types';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { subscribeToTasks, subscribeToTaskLists } from '../../services/firebase/firestore';

interface TaskListProps {
  userId: string;
}

export const TaskList: React.FC<TaskListProps> = ({ userId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskListType[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const unsubscribeTasks = subscribeToTasks(userId, setTasks);
    const unsubscribeTaskLists = subscribeToTaskLists(userId, setTaskLists);

    return () => {
      unsubscribeTasks();
      unsubscribeTaskLists();
    };
  }, [userId]);

  useEffect(() => {
    let filtered = tasks;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by list
    if (selectedList) {
      filtered = filtered.filter(task => task.listId === selectedList);
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(task => !task.completed);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, selectedList, showCompleted]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  // Group tasks by list
  const tasksByList = taskLists.map(list => ({
    list,
    tasks: filteredTasks.filter(task => task.listId === list.id)
  })).filter(group => group.tasks.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tarefas
          </h1>
          <Button
            onClick={() => setShowTaskForm(true)}
            variant="primary"
            size="sm"
          >
            <Plus size={16} className="mr-1" />
            Nova
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <Input
            placeholder="Pesquisar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} className="text-gray-400" />}
          />

          <div className="flex space-x-2">
            <select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className="
                px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="">Todas as listas</option>
              {taskLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar concluídas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-8">
          {tasksByList.map(({ list, tasks }) => (
            <div key={list.id}>
              <div className="flex items-center space-x-2 mb-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  {list.name} ({tasks.length})
                </h2>
              </div>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      taskList={list}
                      onEdit={handleEditTask}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {tasksByList.length === 0 && (
            <div>
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <Plus size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma tarefa encontrada</p>
                  <p className="text-sm">
                    {searchTerm || selectedList
                      ? 'Tente ajustar os filtros'
                      : 'Crie sua primeira tarefa para começar'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={showTaskForm}
        onClose={handleCloseTaskForm}
        task={editingTask}
        taskLists={taskLists}
        userId={userId}
      />
    </div>
  );
};
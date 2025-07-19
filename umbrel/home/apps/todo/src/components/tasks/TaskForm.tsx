import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2, Star } from 'lucide-react';
import { Task, TaskList, Step } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { createTask, updateTask } from '../../services/firebase/firestore';

interface TaskFormData {
  title: string;
  notes: string;
  important: boolean;
  listId: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  taskLists: TaskList[];
  userId: string;
}

// Helper function to generate UUID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  task,
  taskLists,
  userId
}) => {
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStep, setNewStep] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<TaskFormData>();

  useEffect(() => {
    if (task) {
      setValue('title', task.title);
      setValue('notes', task.notes || '');
      setValue('important', task.important);
      setValue('listId', task.listId);
      setSteps(task.steps || []);
    } else {
      reset();
      setSteps([]);
    }
  }, [task, setValue, reset]);

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true);
    
    try {
      const taskData = {
        ...data,
        notes: data.notes || '',
        steps,
        userId,
        completed: task?.completed || false
      };

      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }

      onClose();
      reset();
      setSteps([]);
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, {
        id: generateId(),
        title: newStep.trim(),
        completed: false,
        orderIndex: steps.length,
        taskId: task?.id || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);
      setNewStep('');
    }
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Editar Tarefa' : 'Nova Tarefa'} maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título
          </label>
          <input
            id="title"
            type="text"
            {...register('title', { required: 'Título é obrigatório' })}
            className={`
              block w-full px-3 py-2 border rounded-md
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${errors.title 
                ? 'border-red-300 dark:border-red-600' 
                : 'border-gray-300 dark:border-gray-600'
              }
            `}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            className="
              block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
            placeholder="Adicione notas..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="listId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lista
            </label>
            <select
              id="listId"
              {...register('listId', { required: 'Lista é obrigatória' })}
              className="
                block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            >
              <option value="">Selecione uma lista</option>
              {taskLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            {errors.listId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.listId.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                {...register('important')}
                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Star size={16} className="mr-1 text-yellow-500" />
                Importante
              </span>
            </label>
          </div>
        </div>

        {/* Steps */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Etapas
          </label>
          
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => {
                    setSteps(steps.map(st => 
                      st.id === step.id ? { ...st, title: e.target.value, updatedAt: new Date().toISOString() } : st
                    ));
                  }}
                  className="
                    flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  "
                />
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Adicionar etapa..."
                className="
                  flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
              />
              <Button
                type="button"
                onClick={addStep}
                variant="outline"
                size="sm"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={loading}
          >
            {task ? 'Atualizar' : 'Criar'} Tarefa
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
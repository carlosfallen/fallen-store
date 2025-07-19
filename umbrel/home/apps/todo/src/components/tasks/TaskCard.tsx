import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  Star,
  StarOff,
  Edit3, 
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  ListTodo,
  AlertCircle
} from 'lucide-react';
import { Task, TaskList } from '../../types';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { updateTask, deleteTask } from '../../services/firebase/firestore';

interface TaskCardProps {
  task: Task;
  taskList: TaskList;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, taskList, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const swipeGesture = useSwipeGesture({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => setShowActions(false)
  });

  const handleToggleComplete = async () => {
    try {
      await updateTask(task.id, {
        completed: !task.completed
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleToggleImportant = async () => {
    try {
      await updateTask(task.id, {
        important: !task.important
      });
    } catch (error) {
      console.error('Error updating task importance:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStepToggle = async (stepId: string) => {
    try {
      const updatedSteps = task.steps.map(step =>
        step.id === stepId
          ? { ...step, completed: !step.completed, updatedAt: new Date().toISOString() }
          : step
      );
      await updateTask(task.id, { steps: updatedSteps });
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  const getCompletedStepsCount = () => {
    return task.steps.filter(step => step.completed).length;
  };

  const getProgressPercentage = () => {
    if (task.steps.length === 0) return 0;
    return Math.round((getCompletedStepsCount() / task.steps.length) * 100);
  };

  const isOverdue = () => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && !task.completed;
  };

  const isDueToday = () => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return today.toDateString() === dueDate.toDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        scale: 1.01,
        boxShadow: task.completed 
          ? "0 4px 15px rgba(34, 197, 94, 0.1)" 
          : "0 4px 15px rgba(0, 0, 0, 0.1)"
      }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-lg shadow-sm border overflow-hidden group transition-all duration-200
        ${task.completed 
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${isOverdue() ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}
      `}
      {...swipeGesture}
    >
      {/* Swipe Actions */}
      {showActions && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-end px-4 z-10"
        >
          <button
            onClick={handleDelete}
            className="text-white p-3 rounded-full hover:bg-white/20 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </motion.div>
      )}

      {/* Priority/Status Indicators */}
      <div className="absolute top-2 left-2 flex items-center space-x-1">
        {task.important && (
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        )}
        {isOverdue() && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
        {isDueToday() && !task.completed && (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleComplete}
              className={`mt-0.5 transition-colors ${
                task.completed 
                  ? 'text-green-600 hover:text-green-700' 
                  : 'text-gray-400 hover:text-green-500'
              }`}
            >
              {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
            </motion.button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`
                  text-sm font-medium truncate flex-1
                  ${task.completed 
                    ? 'line-through text-gray-500 dark:text-gray-400' 
                    : 'text-gray-900 dark:text-white'
                  }
                `}>
                  {task.title}
                </h3>
                {isOverdue() && (
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                )}
              </div>
              
              {task.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                  {task.notes.length > 60 ? `${task.notes.substring(0, 60)}...` : task.notes}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-1.5">
                  <motion.span 
                    whileHover={{ scale: 1.05 }}
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ backgroundColor: taskList.color }}
                  >
                    {taskList.name}
                  </motion.span>
                  
                  {task.steps.length > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                      <ListTodo size={10} />
                      <span>{getCompletedStepsCount()}/{task.steps.length}</span>
                    </div>
                  )}
                </div>

                {task.dueDate && (
                  <div className={`flex items-center text-xs ${
                    isOverdue() 
                      ? 'text-red-600 dark:text-red-400' 
                      : isDueToday() 
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {isOverdue() || isDueToday() ? <Clock size={10} className="mr-1" /> : <Calendar size={10} className="mr-1" />}
                    <span className="text-xs">
                      {isOverdue() ? 'Atrasada' : isDueToday() ? 'Hoje' : new Date(task.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {task.steps.length > 0 && !task.completed && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progresso</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 ml-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleImportant}
              className={`transition-colors ${
                task.important 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            >
              {task.important ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
            </motion.button>
            
            {task.steps.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(task)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <Edit3 size={14} />
            </motion.button>
          </div>
        </div>

        {/* Steps */}
        {isExpanded && task.steps.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-3 pl-6 space-y-2 border-l-2 border-gray-100 dark:border-gray-700"
          >
            {task.steps.sort((a, b) => a.orderIndex - b.orderIndex).map((step, index) => (
              <motion.div 
                key={step.id} 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-2 group/step"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStepToggle(step.id)}
                  className={`transition-colors ${
                    step.completed 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-gray-400 hover:text-green-500'
                  }`}
                >
                  {step.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
                </motion.button>
                <span className={`
                  text-xs flex-1 transition-colors
                  ${step.completed 
                    ? 'line-through text-gray-500 dark:text-gray-400' 
                    : 'text-gray-700 dark:text-gray-300 group-hover/step:text-gray-900 dark:group-hover/step:text-white'
                  }
                `}>
                  {step.title}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Bottom gradient for visual depth */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        task.completed 
          ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600'
          : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600'
      }`}></div>
    </motion.div>
  );
};
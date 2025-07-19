import React from 'react';
import { CheckSquare, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavigationProps {
  activeTab: 'tasks' | 'notes' | 'profile';
  onTabChange: (tab: 'tasks' | 'notes' | 'profile') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs = [
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'notes', label: 'Notas', icon: FileText },
    { id: 'profile', label: 'Perfil', icon: User }
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {tabs.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            onClick={() => onTabChange(id)}
            className={`
              flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors
              ${activeTab === id
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            whileTap={{ scale: 0.95 }}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
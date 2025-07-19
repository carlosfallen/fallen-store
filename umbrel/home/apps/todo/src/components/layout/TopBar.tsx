import React from 'react';
import { Settings, Bell } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

interface TopBarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ darkMode, onToggleDarkMode }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-40 safe-area-inset-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Productivity
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <Bell size={20} />
          </button>
          <ThemeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />
        </div>
      </div>
    </div>
  );
};
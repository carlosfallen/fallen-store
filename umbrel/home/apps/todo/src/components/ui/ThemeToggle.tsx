import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, onToggle }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className="
        p-2 rounded-full bg-gray-100 dark:bg-gray-800 
        text-gray-600 dark:text-gray-300 
        hover:bg-gray-200 dark:hover:bg-gray-700 
        transition-colors
      "
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </motion.button>
  );
};
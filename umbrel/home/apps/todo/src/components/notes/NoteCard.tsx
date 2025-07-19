import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Hash, 
  Edit3, 
  Trash2, 
  Calendar, 
  FileText,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Note } from '../../types';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { deleteNote } from '../../services/firebase/firestore';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onView: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onEdit, onView }) => {
  const [showActions, setShowActions] = React.useState(false);

  const swipeGesture = useSwipeGesture({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => setShowActions(false)
  });

  const handleDelete = async () => {
    try {
      await deleteNote(note.id);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getPreviewText = (content: string) => {
    return content.replace(/[#*`>\[\]]/g, '').substring(0, 120) + (content.length > 120 ? '...' : '');
  };

  const getWordCount = (content: string) => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const isRecent = () => {
    const now = new Date();
    const noteDate = new Date(note.updatedAt);
    const diffHours = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)"
      }}
      transition={{ duration: 0.2 }}
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
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

      {/* Recent indicator */}
      {isRecent() && (
        <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      )}

      <div className="p-5 cursor-pointer" onClick={() => onView(note)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <FileText size={18} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {note.title}
            </h3>
          </div>
          <div className="flex items-center space-x-2 ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <Edit3 size={16} />
            </button>
            <ChevronRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>

        {note.content && (
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
              {getPreviewText(note.content)}
            </p>
            <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
              <FileText size={12} className="mr-1" />
              <span>{getWordCount(note.content)} palavras</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {note.tags.slice(0, 2).map(tag => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-800"
              >
                <Hash size={10} className="mr-1" />
                {tag}
              </motion.span>
            ))}
            {note.tags.length > 2 && (
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full border border-gray-200 dark:border-gray-600">
                +{note.tags.length - 2}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isRecent() && (
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <Clock size={12} className="mr-1" />
                <span>Recente</span>
              </div>
            )}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Calendar size={12} className="mr-1" />
              <span>{format(new Date(note.updatedAt), 'dd/MM/yy', { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient for visual depth */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </motion.div>
  );
};
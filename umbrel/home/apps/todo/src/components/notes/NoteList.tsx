import React, { useState, useEffect } from 'react';
import { Plus, Search, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Note } from '../../types';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { NoteViewer } from './NoteViewer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { subscribeToNotes, searchNotes } from '../../services/firebase/firestore';

interface NoteListProps {
  userId: string;
}

export const NoteList: React.FC<NoteListProps> = ({ userId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToNotes(userId, setNotes);
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    let filtered = notes;

    if (searchTerm) {
      const searchResults = notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      filtered = searchResults;
    }

    if (selectedTag) {
      filtered = filtered.filter(note => note.tags.includes(selectedTag));
    }

    setFilteredNotes(filtered);
  }, [notes, searchTerm, selectedTag]);

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleViewNote = (note: Note) => {
    setViewingNote(note);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
  };

  const handleCloseViewer = () => {
    setViewingNote(null);
  };

  const handleEditFromViewer = () => {
    if (viewingNote) {
      setEditingNote(viewingNote);
      setViewingNote(null);
      setShowEditor(true);
    }
  };

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags))).sort();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notas
          </h1>
          <Button
            onClick={() => setShowEditor(true)}
            variant="primary"
            size="sm"
          >
            <Plus size={16} className="mr-1" />
            Nova
          </Button>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <Input
            placeholder="Pesquisar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={16} className="text-gray-400" />}
          />

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`
                  px-3 py-1 text-sm rounded-full transition-colors
                  ${!selectedTag
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                Todas
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  className={`
                    inline-flex items-center px-3 py-1 text-sm rounded-full transition-colors
                    ${tag === selectedTag
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Hash size={12} className="mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onView={handleViewNote}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Plus size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma nota encontrada</p>
              <p className="text-sm">
                {searchTerm || selectedTag
                  ? 'Tente ajustar os filtros de pesquisa'
                  : 'Crie sua primeira nota para começar'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Note Editor */}
      {showEditor && (
        <NoteEditor
          note={editingNote}
          onClose={handleCloseEditor}
          userId={userId}
        />
      )}

      {/* Note Viewer */}
      {viewingNote && (
        <NoteViewer
          note={viewingNote}
          onClose={handleCloseViewer}
          onEdit={handleEditFromViewer}
        />
      )}
    </div>
  );
};
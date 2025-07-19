import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Eye, 
  Edit3, 
  Save, 
  X, 
  Hash, 
  Link as LinkIcon,
  Bold,
  Italic,
  Code,
  List,
  Quote
} from 'lucide-react';
import { Note } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { createNote, updateNote } from '../../services/firebase/firestore';

interface NoteEditorProps {
  note?: Note | null;
  onClose: () => void;
  userId: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onClose, userId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
    }
  }, [note]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setLoading(true);
    
    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        tags,
        userId,
        linkedNotes: [] // TODO: Implement backlinks
      };

      if (note) {
        await updateNote(note.id, noteData);
      } else {
        await createNote(noteData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newContent = '';
    
    switch (syntax) {
      case 'bold':
        newContent = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        break;
      case 'italic':
        newContent = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
        break;
      case 'code':
        newContent = content.substring(0, start) + `\`${selectedText}\`` + content.substring(end);
        break;
      case 'list':
        newContent = content.substring(0, start) + `\n- ${selectedText}` + content.substring(end);
        break;
      case 'quote':
        newContent = content.substring(0, start) + `\n> ${selectedText}` + content.substring(end);
        break;
      default:
        return;
    }
    
    setContent(newContent);
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {note ? 'Editar Nota' : 'Nova Nota'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`
              p-2 rounded-lg transition-colors
              ${isPreview 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }
            `}
          >
            {isPreview ? <Edit3 size={20} /> : <Eye size={20} />}
          </button>
          <Button
            onClick={handleSave}
            variant="primary"
            size="sm"
            loading={loading}
          >
            <Save size={16} className="mr-1" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da nota..."
            className="text-lg font-semibold border-none bg-transparent p-0 focus:ring-0"
          />
        </div>

        {/* Tags */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                <Hash size={12} className="mr-1" />
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={addTag}
            placeholder="Adicionar tag..."
            className="text-sm"
          />
        </div>

        {/* Toolbar */}
        {!isPreview && (
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => insertMarkdown('bold')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Bold size={16} />
              </button>
              <button
                onClick={() => insertMarkdown('italic')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Italic size={16} />
              </button>
              <button
                onClick={() => insertMarkdown('code')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Code size={16} />
              </button>
              <button
                onClick={() => insertMarkdown('list')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => insertMarkdown('quote')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Quote size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Editor/Preview */}
        <div className="flex-1 p-4">
          {isPreview ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              id="content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Comece a escrever sua nota..."
              className="
                w-full h-full resize-none border-none bg-transparent
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-0
              "
            />
          )}
        </div>
      </div>
    </div>
  );
};
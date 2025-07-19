import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Edit3, 
  Hash, 
  Calendar,
  Clock
} from 'lucide-react';
import { Note } from '../../types';
import { Button } from '../ui/Button';

interface NoteViewerProps {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
}

export const NoteViewer: React.FC<NoteViewerProps> = ({ note, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {note.title}
          </h1>
        </div>

        <Button
          onClick={onEdit}
          variant="outline"
          size="sm"
        >
          <Edit3 size={16} className="mr-1" />
          Editar
        </Button>
      </div>

      {/* Note Metadata */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar size={14} />
            <span>Criado em {format(note.createdAt, 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock size={14} />
            <span>Atualizado em {format(note.updatedAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
          </div>
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {note.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                <Hash size={12} className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {note.content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800">
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
                        className="rounded-lg"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code 
                        className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm`} 
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-6 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-5">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">
                      {children}
                    </ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/10 text-gray-700 dark:text-gray-300 italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border border-gray-300 dark:border-gray-600">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-left font-semibold text-gray-900 dark:text-white">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
                      {children}
                    </td>
                  ),
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  )
                }}
              >
                {note.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500">
                <Edit3 size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nota vazia</p>
                <p className="text-sm">Clique em "Editar" para adicionar conteúdo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
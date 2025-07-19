import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { TaskList } from './components/tasks/TaskList';
import { NoteList } from './components/notes/NoteList';
import { ProfilePage } from './components/profile/ProfilePage';
import { TopBar } from './components/layout/TopBar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { createTaskList } from './services/firebase/firestore';

function App() {
  const { user, loading } = useAuth();
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [activeTab, setActiveTab] = useLocalStorage<'tasks' | 'notes' | 'profile'>('activeTab', 'tasks');
  const [isLogin, setIsLogin] = useState(true);
  const [defaultListsCreated, setDefaultListsCreated] = useState(false);

  // Create default task lists for new users
  useEffect(() => {
    if (user && !defaultListsCreated) {
      const createDefaultLists = async () => {
        try {
          const defaultLists = [
            { name: 'Pessoal', color: '#3B82F6' },
            { name: 'Trabalho', color: '#EF4444' },
            { name: 'Estudos', color: '#10B981' },
            { name: 'Casa', color: '#F59E0B' }
          ];

          for (const list of defaultLists) {
            await createTaskList({
              ...list,
              userId: user.uid
            });
          }

          setDefaultListsCreated(true);
        } catch (error) {
          console.error('Error creating default task lists:', error);
        }
      };

      createDefaultLists();
    }
  }, [user, defaultListsCreated]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        {isLogin ? (
          <LoginForm onToggleForm={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleForm={() => setIsLogin(true)} />
        )}
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskList userId={user.uid} />;
      case 'notes':
        return <NoteList userId={user.uid} />;
      case 'profile':
        return <ProfilePage user={user} />;
      default:
        return <TaskList userId={user.uid} />;
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopBar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
        
        <main className="pt-16 pb-20">
          {renderContent()}
        </main>

        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </Router>
  );
}

export default App;
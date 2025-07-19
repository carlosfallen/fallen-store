import React, { useState } from 'react';
import { User, Mail, Calendar, Edit3, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User as FirebaseUser } from 'firebase/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { updateUserProfile, logout } from '../../services/firebase/auth';

interface ProfilePageProps {
  user: FirebaseUser;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile(user, { displayName });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Perfil
            </h1>
            <Button
              onClick={() => setShowEditModal(true)}
              variant="outline"
              size="sm"
            >
              <Edit3 size={16} className="mr-1" />
              Editar
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User size={32} className="text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.displayName || 'Usuário'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Mail size={16} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </span>
              </div>
              <p className="text-gray-900 dark:text-white">
                {user.email}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Membro desde
                </span>
              </div>
              <p className="text-gray-900 dark:text-white">
                {user.metadata.creationTime && 
                  format(new Date(user.metadata.creationTime), 'dd/MM/yyyy', { locale: ptBR })
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/10"
            >
              <LogOut size={16} className="mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Perfil"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Digite seu nome"
          />

          <div className="flex space-x-3">
            <Button
              onClick={handleUpdateProfile}
              variant="primary"
              className="flex-1"
              loading={loading}
            >
              Salvar
            </Button>
            <Button
              onClick={() => setShowEditModal(false)}
              variant="ghost"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
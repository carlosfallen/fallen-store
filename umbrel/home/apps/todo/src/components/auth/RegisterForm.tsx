import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { signUpWithEmail } from '../../services/firebase/auth';

interface RegisterFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onToggleForm: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError('');
    
    try {
      await signUpWithEmail(data.email, data.password, data.displayName);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Criar conta
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Registre-se para começar
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome"
          type="text"
          icon={<User size={20} className="text-gray-400" />}
          {...register('displayName', {
            required: 'Nome é obrigatório',
            minLength: {
              value: 2,
              message: 'Nome deve ter pelo menos 2 caracteres'
            }
          })}
          error={errors.displayName?.message}
        />

        <Input
          label="Email"
          type="email"
          icon={<Mail size={20} className="text-gray-400" />}
          {...register('email', {
            required: 'Email é obrigatório',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido'
            }
          })}
          error={errors.email?.message}
        />

        <div className="relative">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            icon={<Lock size={20} className="text-gray-400" />}
            {...register('password', {
              required: 'Senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Senha deve ter pelo menos 6 caracteres'
              }
            })}
            error={errors.password?.message}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirmar Senha"
            type={showConfirmPassword ? 'text' : 'password'}
            icon={<Lock size={20} className="text-gray-400" />}
            {...register('confirmPassword', {
              required: 'Confirmação de senha é obrigatória',
              validate: (value) => value === password || 'Senhas não coincidem'
            })}
            error={errors.confirmPassword?.message}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Criar conta
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Já tem uma conta?{' '}
          <button
            onClick={onToggleForm}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
};
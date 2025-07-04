import { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Trash2,
  Loader2
} from 'lucide-react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './hooks/useAuth';

interface Item {
  id: number;
  name: string;
  category: string;
  quantity: string;
  value: number;
  location?: string;
  completed: boolean;
}

type ShoppingLists = Record<string, Item[]>;

const ShoppingListManager: React.FC = () => {
  const { user, login } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [shoppingLists, setShoppingLists] = useState<ShoppingLists>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [savingItems, setSavingItems] = useState<Set<number>>(new Set());
  const [newItem, setNewItem] = useState<Omit<Item, 'id'>>({
    name: '',
    category: 'Alimentação',
    quantity: '1',
    value: 0,
    location: '',
    completed: false
  });

  const months = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  const categories = [
    'Alimentação','Limpeza','Higiene','Bebidas','Frutas','Carnes','Laticínios','Outros'
  ];

  const getMonthKey = (month: number, year: number): string => `${year}-${String(month).padStart(2, '0')}`;
  const currentMonthKey = getMonthKey(currentMonth, currentYear);

  // Carregar lista do mês atual
  useEffect(() => {
    const loadList = async () => {
      setLoading(true);
      const localKey = `shoppingList-${currentMonthKey}`;

      try {
        if (user) {
          console.log('Carregando do Firestore para usuário:', user.uid);
          const docRef = doc(db, 'users', user.uid, 'shoppingLists', currentMonthKey);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Dados carregados do Firestore:', data);
            setShoppingLists(prev => ({
              ...prev,
              [currentMonthKey]: Array.isArray(data?.items) ? data.items : []
            }));
          } else {
            console.log('Documento não existe no Firestore');
            setShoppingLists(prev => ({
              ...prev,
              [currentMonthKey]: []
            }));
          }
        } else {
          console.log('Carregando do localStorage');
          const stored = localStorage.getItem(localKey);
          setShoppingLists(prev => ({
            ...prev,
            [currentMonthKey]: stored ? JSON.parse(stored) : []
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar lista:', error);
        setShoppingLists(prev => ({
          ...prev,
          [currentMonthKey]: []
        }));
      } finally {
        setTimeout(() => setLoading(false), 300); // Pequeno delay para suavizar a transição
      }
    };

    loadList();
  }, [currentMonthKey, user]);

  // Salvar lista quando há mudanças
  const saveList = async (list: Item[]) => {
    const localKey = `shoppingList-${currentMonthKey}`;
    
    try {
      // Sempre salvar no localStorage como backup
      localStorage.setItem(localKey, JSON.stringify(list));
      
      if (user) {
        console.log('Salvando no Firestore:', list);
        const docRef = doc(db, 'users', user.uid, 'shoppingLists', currentMonthKey);
        await setDoc(docRef, { 
          items: list,
          lastUpdated: new Date().toISOString(),
          month: currentMonth,
          year: currentYear
        });
        console.log('Lista salva no Firestore com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar lista:', error);
    }
  };

  const currentList = shoppingLists[currentMonthKey] ?? [];

  const addItem = async () => {
    if (!newItem.name.trim()) return;

    const item: Item = {
      id: Date.now(),
      ...newItem
    };

    const updatedList = [...currentList, item];
    
    setShoppingLists(prev => ({
      ...prev,
      [currentMonthKey]: updatedList
    }));

    // Salvar imediatamente após adicionar
    await saveList(updatedList);

    setNewItem({
      name: '',
      category: 'Alimentação',
      quantity: '1',
      value: 0,
      location: '',
      completed: false
    });
    setShowAddForm(false);
  };

  const toggleComplete = async (id: number) => {
    setSavingItems(prev => new Set(prev).add(id));
    
    const updatedList = currentList.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    
    setShoppingLists(prev => ({
      ...prev,
      [currentMonthKey]: updatedList
    }));

    // Salvar imediatamente após toggle
    await saveList(updatedList);
    
    setTimeout(() => {
      setSavingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 500);
  };

  const deleteItem = async (id: number) => {
    setDeletingItems(prev => new Set(prev).add(id));
    
    // Aguardar a animação antes de remover
    setTimeout(async () => {
      const updatedList = currentList.filter(item => item.id !== id);
      
      setShoppingLists(prev => ({
        ...prev,
        [currentMonthKey]: updatedList
      }));

      // Salvar imediatamente após deletar
      await saveList(updatedList);
      
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  const groupedItems = currentList.reduce<Record<string, Item[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const navigateMonth = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(y => y + 1);
      } else {
        setCurrentMonth(m => m + 1);
      }
    } else {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(y => y - 1);
      } else {
        setCurrentMonth(m => m - 1);
      }
    }
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getTotalValue = (): number =>
    currentList.reduce((total, item) => total + item.value, 0);

  const getCompletedCount = (): number =>
    currentList.filter(item => item.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center animate-pulse">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 rounded-full bg-purple-200 dark:bg-purple-800 animate-ping opacity-20"></div>
          </div>
          <p className="text-purple-600 dark:text-purple-300 font-medium animate-bounce">
            Carregando suas listas...
          </p>
        </div>
      </div>
    );
  }

  if (!user && !currentList.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900">
        <div className="text-center animate-fade-in">
          <div className="mb-8 relative">
            <ShoppingCart className="w-20 h-20 text-purple-400 dark:text-purple-500 mx-auto animate-bounce" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-3xl font-bold text-purple-800 dark:text-purple-200 mb-4 animate-slide-up">
            Bem-vindo!
          </h1>
          <button
            onClick={login}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl animate-slide-up animation-delay-400 shadow-lg"
          >
            <span className="font-medium">Entrar com Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900 animate-fade-in">
      {/* Top App Bar */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-purple-200 dark:border-purple-700 sticky top-0 z-40 transition-all duration-300 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-3 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </button>
            
            <div className="flex items-center space-x-2 animate-slide-down">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {months[currentMonth]} {currentYear}
              </h1>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-3 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="mt-4 flex justify-between text-sm text-purple-700 dark:text-purple-300 animate-slide-up">
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-800 rounded-full transition-all duration-300">
              {currentList.length} itens
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-800 rounded-full transition-all duration-300">
              {getCompletedCount()} concluídos
            </span>
            <span className="px-3 py-1 bg-pink-100 dark:bg-pink-800 rounded-full font-semibold transition-all duration-300">
              {formatCurrency(getTotalValue())}
            </span>
          </div>
          
          {/* Status do usuário */}
          {user && (
            <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 text-center animate-fade-in">
              Logado como: {user.email}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {currentList.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="relative mb-6">
              <ShoppingCart className="w-20 h-20 mx-auto text-purple-300 dark:text-purple-600 animate-bounce" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-purple-600 dark:text-purple-400 text-xl font-medium mb-2 animate-slide-up">
              Nenhum item na lista
            </p>
            <p className="text-purple-500 dark:text-purple-500 text-sm animate-slide-up animation-delay-200">
              Adicione itens para começar suas compras
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items], categoryIndex) => (
              <div key={category} className="animate-slide-up" style={{ animationDelay: `${categoryIndex * 100}ms` }}>
                <div className="sticky top-20 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800 dark:to-pink-800 rounded-xl px-4 py-3 mb-4 z-10 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md">
                  <h2 className="text-sm font-semibold text-purple-800 dark:text-purple-200 uppercase tracking-wide flex items-center justify-between">
                    <span>{category}</span>
                    <span className="bg-white/50 dark:bg-gray-700/50 px-2 py-1 rounded-full text-xs">
                      {items.length}
                    </span>
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {items.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-purple-100 dark:border-purple-700 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-800 animate-slide-up ${
                        item.completed ? 'opacity-70 scale-95' : ''
                      } ${
                        deletingItems.has(item.id) ? 'animate-slide-out-right opacity-0 scale-75' : ''
                      }`}
                      style={{ animationDelay: `${itemIndex * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleComplete(item.id)}
                              disabled={savingItems.has(item.id)}
                              className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                                item.completed
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 shadow-lg'
                                  : 'border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900'
                              } ${
                                savingItems.has(item.id) ? 'animate-pulse' : ''
                              }`}
                            >
                              {savingItems.has(item.id) ? (
                                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                              ) : (
                                item.completed && <Check className="w-4 h-4 text-white animate-bounce-in" />
                              )}
                            </button>
                            
                            <div className="flex-1">
                              <h3 className={`font-medium text-gray-900 dark:text-gray-100 transition-all duration-300 ${
                                item.completed ? 'line-through text-gray-500' : ''
                              }`}>
                                {item.name}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-purple-600 dark:text-purple-400 px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded-full">
                                  Qtd: {item.quantity}
                                </span>
                                {item.location && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                    {item.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-purple-700 dark:text-purple-300 animate-pulse-value">
                            {formatCurrency(item.value)}
                          </span>
                          <button
                            onClick={() => deleteItem(item.id)}
                            disabled={deletingItems.has(item.id)}
                            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-6 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2 z-50 transform hover:scale-110 active:scale-95 animate-bounce-in hover:animate-none"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">Adicionar</span>
      </button>

      {/* Bottom Sheet Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end animate-fade-in">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md w-full max-w-md mx-auto rounded-t-3xl p-6 transform transition-all duration-500 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 animate-slide-right">
                Adicionar Item
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110 active:scale-95"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="animate-slide-up animation-delay-100">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nome do item *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-purple-300 focus:scale-105"
                  placeholder="Ex: Arroz, Feijão..."
                />
              </div>

              <div className="animate-slide-up animation-delay-200">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-purple-300 focus:scale-105"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="animate-slide-up animation-delay-300">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-purple-300 focus:scale-105"
                    placeholder="1"
                  />
                </div>

                <div className="animate-slide-up animation-delay-400">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    value={newItem.value}
                    onChange={(e) => setNewItem({...newItem, value: e.target.valueAsNumber || 0})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-purple-300 focus:scale-105"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="animate-slide-up animation-delay-500">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Local (opcional)
                </label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-purple-300 focus:scale-105"
                  placeholder="Ex: Supermercado, Farmácia..."
                />
              </div>

              <div className="flex space-x-3 pt-4 animate-slide-up animation-delay-600">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={addItem}
                  disabled={!newItem.name.trim()}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-right {
          from { 
            opacity: 0;
            transform: translateX(-20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-out-right {
          from { 
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to { 
            opacity: 0;
            transform: translateX(100px) scale(0.8);
          }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        @keyframes pulse-value {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-slide-right {
          animation: slide-right 0.6s ease-out;
        }
        
        .animate-slide-out-right {
          animation: slide-out-right 0.3s ease-in;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        
        .animate-pulse-value {
          animation: pulse-value 2s ease-in-out infinite;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default ShoppingListManager;
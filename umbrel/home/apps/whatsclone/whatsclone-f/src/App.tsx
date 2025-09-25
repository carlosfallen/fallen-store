import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, set, serverTimestamp, off, Database } from 'firebase/database';

// Interfaces TypeScript
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface Conversation {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

interface Message {
  id: string;
  message: string;
  timestamp: number;
  isFromMe: boolean;
  messageType: string;
}

interface ConnectionStatus {
  connected: boolean;
  timestamp: number;
  user?: {
    id: string;
    name?: string;
  };
}

interface QRCodeData {
  qr: string;
  timestamp: number;
}

interface SendMessageCommand {
  conversationId: string;
  message: string;
  timestamp: any;
  status: 'pending' | 'processed' | 'error';
}

interface MarkReadCommand {
  conversationId: string;
  timestamp: any;
}

// Configuração Firebase (substitua pelos seus dados)
const firebaseConfig: FirebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database: Database = getDatabase(app);

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Monitorar status da conexão
    const statusRef = ref(database, 'connection/status');
    const statusUnsubscribe = onValue(statusRef, (snapshot) => {
      const status = snapshot.val() as ConnectionStatus | null;
      if (status) {
        setIsConnected(status.connected);
        setConnectionStatus(status);
        setLoading(false);
      }
    });

    // Monitorar QR Code
    const qrRef = ref(database, 'connection/qr_code');
    const qrUnsubscribe = onValue(qrRef, (snapshot) => {
      const qrData = snapshot.val() as QRCodeData | null;
      if (qrData && qrData.qr) {
        setQrCode(qrData.qr);
      } else {
        setQrCode(null);
      }
    });

    // Monitorar conversas
    const conversationsRef = ref(database, 'conversations');
    const conversationsUnsubscribe = onValue(conversationsRef, (snapshot) => {
      const conversationsData = snapshot.val();
      if (conversationsData) {
        const conversationsList: Conversation[] = Object.keys(conversationsData)
          .map(conversationId => ({
            id: conversationId,
            ...conversationsData[conversationId].info
          }))
          .filter((conv: Conversation) => conv.lastMessage) // Só mostrar conversas com mensagens
          .sort((a: Conversation, b: Conversation) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        
        setConversations(conversationsList);
      }
    });

    return () => {
      off(statusRef, 'value', statusUnsubscribe);
      off(qrRef, 'value', qrUnsubscribe);
      off(conversationsRef, 'value', conversationsUnsubscribe);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // Monitorar mensagens da conversa selecionada
      const messagesRef = ref(database, `conversations/${selectedConversation.id}/messages`);
      const messagesUnsubscribe = onValue(messagesRef, (snapshot) => {
        const messagesData = snapshot.val();
        if (messagesData) {
          const messagesList: Message[] = Object.keys(messagesData)
            .map(messageId => ({
              id: messageId,
              ...messagesData[messageId]
            }))
            .sort((a: Message, b: Message) => a.timestamp - b.timestamp);
          
          setMessages(messagesList);
        } else {
          setMessages([]);
        }
      });

      return () => {
        off(messagesRef, 'value', messagesUnsubscribe);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectConversation = async (conversation: Conversation): Promise<void> => {
    setSelectedConversation(conversation);
    
    // Marcar como lida
    if (conversation.unreadCount > 0) {
      await markAsRead(conversation.id);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Enviar comando para o backend local via Firebase
      const commandRef = ref(database, 'commands/send_message');
      const command: SendMessageCommand = {
        conversationId: selectedConversation.id,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        status: 'pending'
      };
      
      await push(commandRef, command);
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    }
  };

  const markAsRead = async (conversationId: string): Promise<void> => {
    try {
      const commandRef = ref(database, 'commands/mark_read');
      const command: MarkReadCommand = {
        conversationId: conversationId,
        timestamp: serverTimestamp()
      };
      
      await push(commandRef, command);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatLastMessageTime = (timestamp?: number): string => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(timestamp);
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return messageDate.toLocaleDateString('pt-BR');
    }
  };

  const getStatusColor = (): string => {
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (): string => {
    if (loading) return 'Conectando...';
    return isConnected ? 'Online' : 'Desconectado';
  };

  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">WhatsApp Web</h2>
          <p className="text-gray-600">Conectando ao servidor...</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>🔥 Firebase TypeScript</p>
            <p>🚀 Aguarde a sincronização...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar QR Code se necessário
  if (qrCode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">WhatsApp Web</h2>
          <p className="mb-4 text-gray-600">
            Para usar o WhatsApp Web, escaneie este código QR com seu celular
          </p>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
            <img src={qrCode} alt="QR Code" className="mx-auto max-w-full h-auto" />
          </div>
          <div className="text-sm text-gray-500 space-y-1">
            <p>1. Abra o WhatsApp no seu celular</p>
            <p>2. Toque em Menu ou Configurações</p>
            <p>3. Toque em Dispositivos conectados</p>
            <p>4. Toque em Conectar dispositivo</p>
            <p>5. Aponte seu celular para esta tela</p>
          </div>
          <div className="flex items-center justify-center mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
            <span className="text-gray-600 text-sm">Aguardando conexão...</span>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            <p>🔥 Firebase + TypeScript</p>
            <p>📱 Sincronização em tempo real</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Lista de Conversas */}
      <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">WhatsApp Web</h1>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`}></div>
              <span className="text-sm text-gray-600">
                {getStatusText()}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              🔥 Firebase + TypeScript
            </p>
            {connectionStatus?.user && (
              <p className="text-xs text-green-600">
                📱 {connectionStatus.user.name || connectionStatus.user.id}
              </p>
            )}
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="mb-4">
                {isConnected ? (
                  <>
                    <div className="text-6xl mb-2">💬</div>
                    <p>Aguardando conversas...</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Envie uma mensagem para o WhatsApp conectado
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-2">⚠️</div>
                    <p>Bot desconectado</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Verifique se o backend está rodando
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : ''
                }`}
                onClick={() => selectConversation(conversation)}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-gray-600 font-semibold text-lg">
                      {conversation.name?.charAt(0)?.toUpperCase() || conversation.phone?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.name || conversation.phone}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatLastMessageTime(conversation.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 ml-2 flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <span className="text-gray-600 font-semibold">
                    {selectedConversation.name?.charAt(0)?.toUpperCase() || 
                     selectedConversation.phone?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.name || selectedConversation.phone}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">
                      {selectedConversation.phone}
                    </p>
                    {isConnected && (
                      <span className="text-xs text-green-500 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Online
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">💭</div>
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Inicie a conversa enviando uma mensagem
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                          message.isFromMe
                            ? 'bg-green-500 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                        <div className="flex items-center justify-end mt-1">
                          <p className={`text-xs ${
                            message.isFromMe ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                          {message.isFromMe && (
                            <span className="ml-1 text-green-100">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-white p-4 border-t border-gray-200">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Digite uma mensagem..." : "Bot desconectado - não é possível enviar"}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    rows={1}
                    disabled={!isConnected}
                    style={{
                      minHeight: '40px',
                      maxHeight: '120px',
                      overflowY: newMessage.length > 100 ? 'auto' : 'hidden'
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full p-3 transition-colors duration-200 flex-shrink-0"
                  title={!isConnected ? "Bot desconectado" : "Enviar mensagem"}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
              
              {!isConnected && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 text-center flex items-center justify-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Bot desconectado - mensagens não podem ser enviadas
                  </p>
                </div>
              )}
              
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-400">
                  🔥 Sincronizado via Firebase • 📱 TypeScript
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-4">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                WhatsApp Web Clone
              </h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Selecione uma conversa na barra lateral para começar a trocar mensagens
                em tempo real
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-600 font-semibold mb-2">
                    🔥 Firebase Sync
                  </div>
                  <p className="text-blue-700">
                    Sincronização em tempo real com backend local
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-600 font-semibold mb-2">
                    📱 TypeScript
                  </div>
                  <p className="text-green-700">
                    Type safety e melhor experiência de desenvolvimento
                  </p>
                </div>
              </div>
              
              {isConnected ? (
                <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Sistema online e pronto para usar
                  </p>
                </div>
              ) : (
                <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Aguardando conexão com o backend
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
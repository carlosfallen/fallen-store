import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, WASocket, ConnectionState } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import sqlite3 from 'sqlite3';
import * as admin from 'firebase-admin';

// Interfaces
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
    id?: number;
    conversation_id: string;
    message: string;
    timestamp: number;
    is_from_me: boolean;
    message_type: string;
    firebase_synced?: boolean;
}

interface FirebaseMessage {
    message: string;
    timestamp: number;
    isFromMe: boolean;
    messageType: string;
    id: string;
    syncedAt?: any;
}

interface FirebaseConversation {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    syncedAt?: any;
}

interface SendMessageCommand {
    conversationId: string;
    message: string;
    timestamp: any;
    status: 'pending' | 'processed' | 'error';
    processedAt?: any;
    error?: string;
}

interface MarkReadCommand {
    conversationId: string;
    timestamp: any;
}

interface ConnectionStatus {
    connected: boolean;
    timestamp: any;
    shouldReconnect?: boolean;
    user?: any;
}

interface QRCodeData {
    qr: string;
    timestamp: any;
}

// Configuração do Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://seu-projeto-firebase-default-rtdb.firebaseio.com"
});

const db_firebase = admin.database();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// SQLite local (backup)
const db = new sqlite3.Database('./whatsapp_local.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco SQLite:', err);
        return;
    }
    console.log('Banco SQLite conectado');
    initializeLocalDatabase();
});

function initializeLocalDatabase(): void {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                name TEXT,
                phone TEXT,
                avatar TEXT,
                last_message TEXT,
                last_message_time INTEGER,
                unread_count INTEGER DEFAULT 0
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT,
                message TEXT,
                timestamp INTEGER,
                is_from_me BOOLEAN,
                message_type TEXT DEFAULT 'text',
                firebase_synced BOOLEAN DEFAULT FALSE
            )
        `);
    });
}

class WhatsAppFirebaseManager {
    private sock: WASocket | null = null;
    private isConnected: boolean = false;
    private conversations: Map<string, Conversation> = new Map();

    constructor() {
        this.setupFirebaseListeners();
    }

    // Configurar listeners do Firebase para comandos do frontend
    private setupFirebaseListeners(): void {
        console.log('🔥 Configurando listeners Firebase...');
        
        // Escutar comandos de envio de mensagem do frontend
        db_firebase.ref('commands/send_message').on('child_added', async (snapshot) => {
            const command = snapshot.val() as SendMessageCommand;
            const commandKey = snapshot.key;
            
            console.log('📨 Comando de envio recebido:', command);
            
            if (command && command.conversationId && command.message && commandKey) {
                try {
                    await this.sendMessageToWhatsApp(command.conversationId, command.message);
                    
                    // Marcar comando como processado
                    await db_firebase.ref(`commands/send_message/${commandKey}`).update({
                        status: 'processed',
                        processedAt: admin.database.ServerValue.TIMESTAMP
                    });
                } catch (error) {
                    console.error('Erro ao processar comando:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                    
                    await db_firebase.ref(`commands/send_message/${commandKey}`).update({
                        status: 'error',
                        error: errorMessage,
                        processedAt: admin.database.ServerValue.TIMESTAMP
                    });
                }
            }
        });

        // Escutar comandos de marcar como lido
        db_firebase.ref('commands/mark_read').on('child_added', async (snapshot) => {
            const command = snapshot.val() as MarkReadCommand;
            const commandKey = snapshot.key;
            
            console.log('👁️ Comando marcar como lido:', command);
            
            if (command && command.conversationId && commandKey) {
                try {
                    await this.markAsRead(command.conversationId);
                    
                    // Marcar comando como processado
                    await db_firebase.ref(`commands/mark_read/${commandKey}`).remove();
                } catch (error) {
                    console.error('Erro ao marcar como lido:', error);
                }
            }
        });
    }

    async initialize(): Promise<void> {
        try {
            console.log('🚀 Inicializando WhatsApp...');
            const { state, saveCreds } = await useMultiFileAuthState('auth_tokens');
            
            this.sock = makeWASocket({
                printQRInTerminal: false,
                auth: state,
                logger: pino({ level: 'silent' })
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    try {
                        const qrImageUrl = await qrcode.toDataURL(qr);
                        console.log('📱 QR Code gerado');
                        
                        // Salvar QR Code no Firebase
                        const qrData: QRCodeData = {
                            qr: qrImageUrl,
                            timestamp: admin.database.ServerValue.TIMESTAMP
                        };
                        
                        await db_firebase.ref('connection/qr_code').set(qrData);
                        
                    } catch (err) {
                        console.error('Erro ao gerar QR code:', err);
                    }
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('❌ Conexão fechada, reconectando:', shouldReconnect);
                    
                    // Atualizar status no Firebase
                    const statusData: ConnectionStatus = {
                        connected: false,
                        timestamp: admin.database.ServerValue.TIMESTAMP,
                        shouldReconnect
                    };
                    
                    await db_firebase.ref('connection/status').set(statusData);

                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 5000);
                    }
                } else if (connection === 'open') {
                    console.log('✅ WhatsApp conectado com sucesso!');
                    this.isConnected = true;
                    
                    // Atualizar status no Firebase
                    const statusData: ConnectionStatus = {
                        connected: true,
                        timestamp: admin.database.ServerValue.TIMESTAMP,
                        user: this.sock?.user
                    };
                    
                    await db_firebase.ref('connection/status').set(statusData);

                    // Remover QR Code
                    await db_firebase.ref('connection/qr_code').remove();
                    
                    // Sincronizar conversas existentes
                    await this.syncConversationsToFirebase();
                }
            });

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                const msg = messages[0];
                if (!msg?.message || msg.key.fromMe) return;

                await this.handleIncomingMessage(msg);
            });

        } catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
        }
    }

    private async handleIncomingMessage(msg: any): Promise<void> {
        console.log('📥 Nova mensagem recebida');
        
        const messageType = Object.keys(msg.message)[0];
        const text = messageType === 'conversation' ? 
            msg.message.conversation : 
            msg.message.extendedTextMessage?.text;

        if (!text) return;

        const conversationId: string = msg.key.remoteJid;
        const phone = conversationId.replace('@s.whatsapp.net', '');
        const timestamp = Date.now();

        // Salvar localmente (SQLite)
        await this.saveMessageLocal({
            conversation_id: conversationId,
            message: text,
            timestamp: timestamp,
            is_from_me: false,
            message_type: 'text'
        });

        // Salvar conversa localmente
        await this.saveConversationLocal({
            id: conversationId,
            name: phone,
            phone: phone,
            lastMessage: text,
            lastMessageTime: timestamp,
            unreadCount: 1
        });

        // Sincronizar com Firebase
        const firebaseMessage: FirebaseMessage = {
            message: text,
            timestamp: timestamp,
            isFromMe: false,
            messageType: 'text',
            id: `msg_${timestamp}_${Math.random()}`
        };

        await this.syncMessageToFirebase(conversationId, firebaseMessage);

        const firebaseConversation: FirebaseConversation = {
            id: conversationId,
            name: phone,
            phone: phone,
            lastMessage: text,
            lastMessageTime: timestamp,
            unreadCount: 1
        };

        await this.syncConversationToFirebase(firebaseConversation);

        console.log('✅ Mensagem sincronizada com Firebase');
    }

    private async sendMessageToWhatsApp(conversationId: string, message: string): Promise<{ success: boolean }> {
        if (!this.sock || !this.isConnected) {
            throw new Error('WhatsApp não conectado');
        }

        console.log(`📤 Enviando mensagem para ${conversationId}: ${message}`);

        try {
            await this.sock.sendMessage(conversationId, { text: message });
            
            const timestamp = Date.now();
            
            // Salvar localmente
            await this.saveMessageLocal({
                conversation_id: conversationId,
                message: message,
                timestamp: timestamp,
                is_from_me: true,
                message_type: 'text'
            });

            // Sincronizar com Firebase
            const firebaseMessage: FirebaseMessage = {
                message: message,
                timestamp: timestamp,
                isFromMe: true,
                messageType: 'text',
                id: `msg_${timestamp}_${Math.random()}`
            };

            await this.syncMessageToFirebase(conversationId, firebaseMessage);

            // Atualizar última mensagem da conversa
            await this.updateConversationLastMessage(conversationId, message, timestamp);

            console.log('✅ Mensagem enviada e sincronizada');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    // Sincronização Firebase
    private async syncMessageToFirebase(conversationId: string, messageData: FirebaseMessage): Promise<void> {
        try {
            const messageRef = db_firebase.ref(`conversations/${conversationId}/messages`).push();
            await messageRef.set({
                ...messageData,
                syncedAt: admin.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Erro ao sincronizar mensagem:', error);
        }
    }

    private async syncConversationToFirebase(conversationData: FirebaseConversation): Promise<void> {
        try {
            await db_firebase.ref(`conversations/${conversationData.id}/info`).set({
                ...conversationData,
                syncedAt: admin.database.ServerValue.TIMESTAMP
            });
        } catch (error) {
            console.error('Erro ao sincronizar conversa:', error);
        }
    }

    private async syncConversationsToFirebase(): Promise<void> {
        try {
            console.log('🔄 Sincronizando conversas existentes...');
            
            const conversations = await this.getLocalConversations();
            
            for (const conversation of conversations) {
                const firebaseConversation: FirebaseConversation = {
                    id: conversation.id,
                    name: conversation.name,
                    phone: conversation.phone,
                    avatar: conversation.avatar,
                    lastMessage: conversation.lastMessage,
                    lastMessageTime: conversation.lastMessageTime,
                    unreadCount: conversation.unreadCount
                };
                
                await this.syncConversationToFirebase(firebaseConversation);
                
                // Sincronizar mensagens da conversa
                const messages = await this.getLocalMessages(conversation.id);
                for (const message of messages) {
                    const firebaseMessage: FirebaseMessage = {
                        message: message.message,
                        timestamp: message.timestamp,
                        isFromMe: message.is_from_me === 1,
                        messageType: message.message_type || 'text',
                        id: `msg_${message.id}`
                    };
                    
                    await this.syncMessageToFirebase(conversation.id, firebaseMessage);
                }
            }
            
            console.log('✅ Sincronização inicial completa');
        } catch (error) {
            console.error('Erro na sincronização inicial:', error);
        }
    }

    private async updateConversationLastMessage(conversationId: string, message: string, timestamp: number): Promise<void> {
        // Atualizar localmente
        db.run(
            'UPDATE conversations SET last_message = ?, last_message_time = ? WHERE id = ?',
            [message, timestamp, conversationId]
        );

        // Atualizar Firebase
        await db_firebase.ref(`conversations/${conversationId}/info`).update({
            lastMessage: message,
            lastMessageTime: timestamp,
            syncedAt: admin.database.ServerValue.TIMESTAMP
        });
    }

    private async markAsRead(conversationId: string): Promise<void> {
        // Atualizar localmente
        db.run('UPDATE conversations SET unread_count = 0 WHERE id = ?', [conversationId]);

        // Atualizar Firebase
        await db_firebase.ref(`conversations/${conversationId}/info`).update({
            unreadCount: 0,
            syncedAt: admin.database.ServerValue.TIMESTAMP
        });
    }

    // Métodos auxiliares SQLite
    private async saveMessageLocal(message: Message): Promise<number> {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO messages (conversation_id, message, timestamp, is_from_me, message_type) 
                VALUES (?, ?, ?, ?, ?)`,
                [message.conversation_id, message.message, message.timestamp, message.is_from_me, message.message_type],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    private async saveConversationLocal(conversation: Omit<Conversation, 'avatar'>): Promise<number> {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT OR REPLACE INTO conversations 
                (id, name, phone, avatar, last_message, last_message_time, unread_count) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    conversation.id, conversation.name, conversation.phone,
                    null, conversation.lastMessage,
                    conversation.lastMessageTime, conversation.unreadCount
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    private async getLocalConversations(): Promise<Conversation[]> {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM conversations ORDER BY last_message_time DESC', (err, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    const conversations: Conversation[] = rows.map(row => ({
                        id: row.id,
                        name: row.name,
                        phone: row.phone,
                        avatar: row.avatar,
                        lastMessage: row.last_message,
                        lastMessageTime: row.last_message_time,
                        unreadCount: row.unread_count
                    }));
                    resolve(conversations);
                }
            });
        });
    }

    private async getLocalMessages(conversationId: string): Promise<Message[]> {
        return new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
                [conversationId],
                (err, rows: any[]) => {
                    if (err) {
                        reject(err);
                    } else {
                        const messages: Message[] = rows.map(row => ({
                            id: row.id,
                            conversation_id: row.conversation_id,
                            message: row.message,
                            timestamp: row.timestamp,
                            is_from_me: row.is_from_me === 1,
                            message_type: row.message_type,
                            firebase_synced: row.firebase_synced === 1
                        }));
                        resolve(messages);
                    }
                }
            );
        });
    }

    // Getter para status
    public get connected(): boolean {
        return this.isConnected;
    }
}

// Inicializar o manager
const whatsappManager = new WhatsAppFirebaseManager();

// Rotas de status (opcional para debug local)
app.get('/api/status', (req, res) => {
    res.json({
        connected: whatsappManager.connected,
        timestamp: Date.now()
    });
});

// Inicializar WhatsApp
whatsappManager.initialize();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Backend TypeScript rodando na porta ${PORT}`);
    console.log(`🔥 Firebase sincronização ativa`);
});

export { whatsappManager };
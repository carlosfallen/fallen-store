"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappManager = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const baileys_1 = require("@whiskeysockets/baileys");
const pino_1 = __importDefault(require("pino"));
const qrcode_1 = __importDefault(require("qrcode"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const admin = __importStar(require("firebase-admin"));
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://seu-projeto-firebase-default-rtdb.firebaseio.com"
});
const db_firebase = admin.database();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const db = new sqlite3_1.default.Database('./whatsapp_local.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco SQLite:', err);
        return;
    }
    console.log('Banco SQLite conectado');
    initializeLocalDatabase();
});
function initializeLocalDatabase() {
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
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.conversations = new Map();
        this.setupFirebaseListeners();
    }
    setupFirebaseListeners() {
        console.log('🔥 Configurando listeners Firebase...');
        db_firebase.ref('commands/send_message').on('child_added', async (snapshot) => {
            const command = snapshot.val();
            const commandKey = snapshot.key;
            console.log('📨 Comando de envio recebido:', command);
            if (command && command.conversationId && command.message && commandKey) {
                try {
                    await this.sendMessageToWhatsApp(command.conversationId, command.message);
                    await db_firebase.ref(`commands/send_message/${commandKey}`).update({
                        status: 'processed',
                        processedAt: admin.database.ServerValue.TIMESTAMP
                    });
                }
                catch (error) {
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
        db_firebase.ref('commands/mark_read').on('child_added', async (snapshot) => {
            const command = snapshot.val();
            const commandKey = snapshot.key;
            console.log('👁️ Comando marcar como lido:', command);
            if (command && command.conversationId && commandKey) {
                try {
                    await this.markAsRead(command.conversationId);
                    await db_firebase.ref(`commands/mark_read/${commandKey}`).remove();
                }
                catch (error) {
                    console.error('Erro ao marcar como lido:', error);
                }
            }
        });
    }
    async initialize() {
        try {
            console.log('🚀 Inicializando WhatsApp...');
            const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)('auth_tokens');
            this.sock = (0, baileys_1.makeWASocket)({
                printQRInTerminal: false,
                auth: state,
                logger: (0, pino_1.default)({ level: 'silent' })
            });
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    try {
                        const qrImageUrl = await qrcode_1.default.toDataURL(qr);
                        console.log('📱 QR Code gerado');
                        const qrData = {
                            qr: qrImageUrl,
                            timestamp: admin.database.ServerValue.TIMESTAMP
                        };
                        await db_firebase.ref('connection/qr_code').set(qrData);
                    }
                    catch (err) {
                        console.error('Erro ao gerar QR code:', err);
                    }
                }
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== baileys_1.DisconnectReason.loggedOut;
                    console.log('❌ Conexão fechada, reconectando:', shouldReconnect);
                    const statusData = {
                        connected: false,
                        timestamp: admin.database.ServerValue.TIMESTAMP,
                        shouldReconnect
                    };
                    await db_firebase.ref('connection/status').set(statusData);
                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 5000);
                    }
                }
                else if (connection === 'open') {
                    console.log('✅ WhatsApp conectado com sucesso!');
                    this.isConnected = true;
                    const statusData = {
                        connected: true,
                        timestamp: admin.database.ServerValue.TIMESTAMP,
                        user: this.sock?.user
                    };
                    await db_firebase.ref('connection/status').set(statusData);
                    await db_firebase.ref('connection/qr_code').remove();
                    await this.syncConversationsToFirebase();
                }
            });
            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                const msg = messages[0];
                if (!msg?.message || msg.key.fromMe)
                    return;
                await this.handleIncomingMessage(msg);
            });
        }
        catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
        }
    }
    async handleIncomingMessage(msg) {
        console.log('📥 Nova mensagem recebida');
        const messageType = Object.keys(msg.message)[0];
        const text = messageType === 'conversation' ?
            msg.message.conversation :
            msg.message.extendedTextMessage?.text;
        if (!text)
            return;
        const conversationId = msg.key.remoteJid;
        const phone = conversationId.replace('@s.whatsapp.net', '');
        const timestamp = Date.now();
        await this.saveMessageLocal({
            conversation_id: conversationId,
            message: text,
            timestamp: timestamp,
            is_from_me: false,
            message_type: 'text'
        });
        await this.saveConversationLocal({
            id: conversationId,
            name: phone,
            phone: phone,
            lastMessage: text,
            lastMessageTime: timestamp,
            unreadCount: 1
        });
        const firebaseMessage = {
            message: text,
            timestamp: timestamp,
            isFromMe: false,
            messageType: 'text',
            id: `msg_${timestamp}_${Math.random()}`
        };
        await this.syncMessageToFirebase(conversationId, firebaseMessage);
        const firebaseConversation = {
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
    async sendMessageToWhatsApp(conversationId, message) {
        if (!this.sock || !this.isConnected) {
            throw new Error('WhatsApp não conectado');
        }
        console.log(`📤 Enviando mensagem para ${conversationId}: ${message}`);
        try {
            await this.sock.sendMessage(conversationId, { text: message });
            const timestamp = Date.now();
            await this.saveMessageLocal({
                conversation_id: conversationId,
                message: message,
                timestamp: timestamp,
                is_from_me: true,
                message_type: 'text'
            });
            const firebaseMessage = {
                message: message,
                timestamp: timestamp,
                isFromMe: true,
                messageType: 'text',
                id: `msg_${timestamp}_${Math.random()}`
            };
            await this.syncMessageToFirebase(conversationId, firebaseMessage);
            await this.updateConversationLastMessage(conversationId, message, timestamp);
            console.log('✅ Mensagem enviada e sincronizada');
            return { success: true };
        }
        catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }
    async syncMessageToFirebase(conversationId, messageData) {
        try {
            const messageRef = db_firebase.ref(`conversations/${conversationId}/messages`).push();
            await messageRef.set({
                ...messageData,
                syncedAt: admin.database.ServerValue.TIMESTAMP
            });
        }
        catch (error) {
            console.error('Erro ao sincronizar mensagem:', error);
        }
    }
    async syncConversationToFirebase(conversationData) {
        try {
            await db_firebase.ref(`conversations/${conversationData.id}/info`).set({
                ...conversationData,
                syncedAt: admin.database.ServerValue.TIMESTAMP
            });
        }
        catch (error) {
            console.error('Erro ao sincronizar conversa:', error);
        }
    }
    async syncConversationsToFirebase() {
        try {
            console.log('🔄 Sincronizando conversas existentes...');
            const conversations = await this.getLocalConversations();
            for (const conversation of conversations) {
                const firebaseConversation = {
                    id: conversation.id,
                    name: conversation.name,
                    phone: conversation.phone,
                    avatar: conversation.avatar,
                    lastMessage: conversation.lastMessage,
                    lastMessageTime: conversation.lastMessageTime,
                    unreadCount: conversation.unreadCount
                };
                await this.syncConversationToFirebase(firebaseConversation);
                const messages = await this.getLocalMessages(conversation.id);
                for (const message of messages) {
                    const firebaseMessage = {
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
        }
        catch (error) {
            console.error('Erro na sincronização inicial:', error);
        }
    }
    async updateConversationLastMessage(conversationId, message, timestamp) {
        db.run('UPDATE conversations SET last_message = ?, last_message_time = ? WHERE id = ?', [message, timestamp, conversationId]);
        await db_firebase.ref(`conversations/${conversationId}/info`).update({
            lastMessage: message,
            lastMessageTime: timestamp,
            syncedAt: admin.database.ServerValue.TIMESTAMP
        });
    }
    async markAsRead(conversationId) {
        db.run('UPDATE conversations SET unread_count = 0 WHERE id = ?', [conversationId]);
        await db_firebase.ref(`conversations/${conversationId}/info`).update({
            unreadCount: 0,
            syncedAt: admin.database.ServerValue.TIMESTAMP
        });
    }
    async saveMessageLocal(message) {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO messages (conversation_id, message, timestamp, is_from_me, message_type) 
                VALUES (?, ?, ?, ?, ?)`, [message.conversation_id, message.message, message.timestamp, message.is_from_me, message.message_type], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
        });
    }
    async saveConversationLocal(conversation) {
        return new Promise((resolve, reject) => {
            db.run(`INSERT OR REPLACE INTO conversations 
                (id, name, phone, avatar, last_message, last_message_time, unread_count) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                conversation.id, conversation.name, conversation.phone,
                null, conversation.lastMessage,
                conversation.lastMessageTime, conversation.unreadCount
            ], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
        });
    }
    async getLocalConversations() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM conversations ORDER BY last_message_time DESC', (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const conversations = rows.map(row => ({
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
    async getLocalMessages(conversationId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC', [conversationId], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const messages = rows.map(row => ({
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
            });
        });
    }
    get connected() {
        return this.isConnected;
    }
}
const whatsappManager = new WhatsAppFirebaseManager();
exports.whatsappManager = whatsappManager;
app.get('/api/status', (req, res) => {
    res.json({
        connected: whatsappManager.connected,
        timestamp: Date.now()
    });
});
whatsappManager.initialize();
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Backend TypeScript rodando na porta ${PORT}`);
    console.log(`🔥 Firebase sincronização ativa`);
});
//# sourceMappingURL=server.js.map
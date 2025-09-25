declare class WhatsAppFirebaseManager {
    private sock;
    private isConnected;
    private conversations;
    constructor();
    private setupFirebaseListeners;
    initialize(): Promise<void>;
    private handleIncomingMessage;
    private sendMessageToWhatsApp;
    private syncMessageToFirebase;
    private syncConversationToFirebase;
    private syncConversationsToFirebase;
    private updateConversationLastMessage;
    private markAsRead;
    private saveMessageLocal;
    private saveConversationLocal;
    private getLocalConversations;
    private getLocalMessages;
    get connected(): boolean;
}
declare const whatsappManager: WhatsAppFirebaseManager;
export { whatsappManager };
//# sourceMappingURL=server.d.ts.map